// controladores/procesos/c_perfil_usuario.js

const jwt = require('jsonwebtoken');
const pool = require('../conexion');
const dotenv = require('dotenv');
dotenv.config();

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.CLAVE_FIRMA_TOKEN_JWT, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Obtener información completa del usuario
const obtenerUsuario = async (req, res) => {
  const { id } = req.params;
  const userIdFromToken = req.user.id_usuario;

  try {
    // Verificar que el usuario solo pueda acceder a su propia información
    if (parseInt(id) !== userIdFromToken) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a esta información' });
    }

    const queryObtenerUsuario = `
      SELECT id_usuario, nombre, username, correo, githublogin 
      FROM usuario 
      WHERE id_usuario = $1
    `;
    
    const resultado = await pool.query(queryObtenerUsuario, [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = resultado.rows[0];
    
    console.log('✅ Usuario obtenido:', { id: usuario.id_usuario, nombre: usuario.nombre });
    
    res.status(200).json(usuario);

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar información del usuario
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const userIdFromToken = req.user.id_usuario;
  const { nombre, username, correo, changePassword, currentPassword, newPassword } = req.body;

  try {
    // Verificar que el usuario solo pueda actualizar su propia información
    if (parseInt(id) !== userIdFromToken) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta información' });
    }

    // Validar campos obligatorios
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }

    // Validar email si se proporciona
    if (correo && correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
      }
    }

    // Verificar que el username no esté en uso por otro usuario
    const queryVerificarUsername = `
      SELECT id_usuario FROM usuario 
      WHERE username = $1 AND id_usuario != $2
    `;
    const resultUsername = await pool.query(queryVerificarUsername, [username.trim(), id]);
    
    if (resultUsername.rowCount > 0) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Si se va a cambiar la contraseña
    if (changePassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Se requiere la contraseña actual y la nueva contraseña' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      // Verificar contraseña actual
      const queryVerificarPassword = `
        SELECT id_usuario FROM usuario 
        WHERE id_usuario = $1 AND password = $2
      `;
      const resultPassword = await pool.query(queryVerificarPassword, [id, currentPassword]);
      
      if (resultPassword.rowCount === 0) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      // Actualizar usuario con nueva contraseña
      const queryActualizarConPassword = `
        UPDATE usuario 
        SET nombre = $1, username = $2, correo = $3, password = $4
        WHERE id_usuario = $5
        RETURNING id_usuario, nombre, username, correo, githublogin
      `;
      
      const resultActualizar = await pool.query(queryActualizarConPassword, [
        nombre.trim(),
        username.trim(),
        correo?.trim() || null,
        newPassword,
        id
      ]);

      const usuarioActualizado = resultActualizar.rows[0];
      
      // Generar nuevo token con información actualizada
      const nuevoToken = generarAccessToken({
        id_usuario: usuarioActualizado.id_usuario,
        nombre: usuarioActualizado.nombre,
      });
      
      console.log('✅ Usuario actualizado con nueva contraseña:', { 
        id: usuarioActualizado.id_usuario, 
        nombre: usuarioActualizado.nombre 
      });
      
      res.status(200).json({
        mensaje: 'Perfil y contraseña actualizados correctamente',
        usuario: usuarioActualizado,
        nuevoToken: nuevoToken // Nuevo token para actualizar el frontend
      });

    } else {
      // Actualizar usuario sin cambiar contraseña
      const queryActualizarSinPassword = `
        UPDATE usuario 
        SET nombre = $1, username = $2, correo = $3
        WHERE id_usuario = $4
        RETURNING id_usuario, nombre, username, correo, githublogin
      `;
      
      const resultActualizar = await pool.query(queryActualizarSinPassword, [
        nombre.trim(),
        username.trim(),
        correo?.trim() || null,
        id
      ]);

      const usuarioActualizado = resultActualizar.rows[0];
      
      // Generar nuevo token con información actualizada
      const nuevoToken = generarAccessToken({
        id_usuario: usuarioActualizado.id_usuario,
        nombre: usuarioActualizado.nombre,
      });
      
      console.log('✅ Usuario actualizado:', { 
        id: usuarioActualizado.id_usuario, 
        nombre: usuarioActualizado.nombre 
      });
      
      res.status(200).json({
        mensaje: 'Perfil actualizado correctamente',
        usuario: usuarioActualizado,
        nuevoToken: nuevoToken // Nuevo token para actualizar el frontend
      });
    }

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Función para generar token (la misma que usas en login)
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

// Verificar si un username está disponible
const verificarUsername = async (req, res) => {
  const { username } = req.params;
  const userIdFromToken = req.user.id_usuario;

  try {
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username requerido' });
    }

    const queryVerificar = `
      SELECT id_usuario FROM usuario 
      WHERE username = $1 AND id_usuario != $2
    `;
    const resultado = await pool.query(queryVerificar, [username.trim(), userIdFromToken]);
    
    const disponible = resultado.rowCount === 0;
    
    res.status(200).json({ 
      disponible,
      mensaje: disponible ? 'Username disponible' : 'Username ya está en uso'
    });

  } catch (error) {
    console.error('❌ Error al verificar username:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  verificarToken,
  obtenerUsuario,
  actualizarUsuario,
  verificarUsername
};