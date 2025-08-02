const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../controladores/conexion'); // Ajusta la ruta según tu estructura
const router = express.Router();

// Configuración de GitHub OAuth (usar variables de entorno)
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liFToTnnnJWBxjcg';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET; // NUNCA hardcodear esto

function generarAccessToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
    },
    process.env.CLAVE_FIRMA_TOKEN_JWT,
    { expiresIn: '8h' }
  );
}

/**
 * POST /api/github/auth
 * Endpoint para manejar la autenticación con GitHub OAuth (con soporte para PKCE)
 */
router.post('/auth', async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    // Validar que se recibió el código de autorización
    if (!code) {
      return res.status(400).json({ 
        success: false,
        error: 'Código de autorización requerido' 
      });
    }

    // Validar que el CLIENT_SECRET esté configurado
    if (!CLIENT_SECRET) {
      console.error('❌ GITHUB_CLIENT_SECRET no está configurado en las variables de entorno');
      return res.status(500).json({
        success: false,
        error: 'Configuración del servidor incompleta'
      });
    }

    // Preparar los datos para el intercambio de token
    const tokenRequestData = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
    };

    // Si hay code_verifier (flujo PKCE), incluirlo
    if (code_verifier) {
      tokenRequestData.code_verifier = code_verifier;
    }

    // Paso 1: Intercambiar el código por un access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      tokenRequestData,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CashPilot-App',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const { access_token, token_type, scope, error, error_description } = tokenResponse.data;

    // Verificar si hubo un error en la respuesta
    if (error) {
      return res.status(400).json({
        success: false,
        error: `GitHub OAuth Error: ${error}`,
        details: error_description
      });
    }

    // Verificar que se recibió el access token
    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Error al obtener token de acceso de GitHub',
        details: tokenResponse.data
      });
    }

    // Paso 2: Obtener información del usuario de GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `${token_type || 'Bearer'} ${access_token}`,
        'User-Agent': 'CashPilot-App',
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    });

    // Paso 3: Obtener emails del usuario (pueden ser privados)
    let primaryEmail = userResponse.data.email;
    
    try {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `${token_type || 'Bearer'} ${access_token}`,
          'User-Agent': 'CashPilot-App',
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      // Buscar el email primario
      const emails = emailResponse.data;
      const primaryEmailObj = emails.find(email => email.primary && email.verified);
      if (primaryEmailObj) {
        primaryEmail = primaryEmailObj.email;
      }
    } catch (emailError) {
      // No es crítico, continuar con el email del perfil público
    }

    // Paso 4: Verificar si el usuario existe en la base de datos
    const queryBuscarUsuario = `
      SELECT * FROM usuario WHERE correo = $1
    `;
    const resultBuscarUsuario = await pool.query(queryBuscarUsuario, [primaryEmail]);

    let usuarioBD;

    if (resultBuscarUsuario.rowCount > 0) {
      // Usuario existe - actualizar githublogin
      const usuarioExistente = resultBuscarUsuario.rows[0];
      
      const queryActualizarGithub = `
        UPDATE usuario SET githublogin = true WHERE id_usuario = $1
      `;
      await pool.query(queryActualizarGithub, [usuarioExistente.id_usuario]);
      
      usuarioBD = usuarioExistente;
      console.log('✅ Usuario existente autenticado con GitHub:', usuarioExistente.nombre);
    } else {
      // Usuario no existe - crear nuevo usuario
      const queryCrearUsuario = `
        INSERT INTO usuario (nombre, correo, username, password, githublogin)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `;
      
      const nombreUsuario = userResponse.data.name || userResponse.data.login;
      const username = userResponse.data.login;
      const passwordTemporal = 'github_oauth_' + Date.now(); // Password temporal para usuarios de GitHub
      
      const resultCrearUsuario = await pool.query(queryCrearUsuario, [
        nombreUsuario,
        primaryEmail,
        username,
        passwordTemporal
      ]);
      
      usuarioBD = resultCrearUsuario.rows[0];
      console.log('✅ Nuevo usuario creado desde GitHub:', usuarioBD.nombre);
    }

    // Paso 5: Generar JWT token
    const token = generarAccessToken({
      id_usuario: usuarioBD.id_usuario,
      nombre: usuarioBD.nombre,
    });

    // Paso 6: Preparar datos del usuario para el frontend
    const userData = {
      id: userResponse.data.id,
      login: userResponse.data.login,
      name: userResponse.data.name,
      email: primaryEmail,
      avatar_url: userResponse.data.avatar_url,
      bio: userResponse.data.bio,
      location: userResponse.data.location,
      public_repos: userResponse.data.public_repos,
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      created_at: userResponse.data.created_at,
      updated_at: userResponse.data.updated_at,
    };

    console.log('✅ Autenticación GitHub exitosa para:', userData.login);

    // Paso 7: Responder con los datos (igual que iniciarSesion)
    res.status(200).json({
      success: true,
      message: 'Autenticación GitHub exitosa',
      token: token, // JWT token como en iniciarSesion
      access_token: access_token, // Token de GitHub para llamadas a API
      user: userData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error en autenticación GitHub:', error.message);
    
    // Manejar diferentes tipos de errores
    if (error.response) {
      // Error de respuesta de GitHub
      if (error.response.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales de GitHub inválidas',
          details: 'Verifica CLIENT_ID y CLIENT_SECRET'
        });
      } else if (error.response.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado por GitHub',
          details: error.response.data.message
        });
      } else {
        return res.status(error.response.status).json({
          success: false,
          error: 'Error de GitHub API',
          details: error.response.data
        });
      }
    } else if (error.request) {
      // Error de red/timeout
      return res.status(503).json({
        success: false,
        error: 'Error de conexión con GitHub',
        details: 'Verifica tu conexión a internet'
      });
    } else {
      // Error interno del servidor (incluyendo errores de BD)
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  }
});

/**
 * GET /api/github/status
 * Endpoint para verificar el estado de la configuración GitHub
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    configured: !!CLIENT_SECRET,
    client_id: CLIENT_ID ? CLIENT_ID.substring(0, 8) + '...' : 'No configurado',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;