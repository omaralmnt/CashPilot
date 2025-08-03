const jwt = require('jsonwebtoken');
const pool = require('../conexion');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Configurar el transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiar por otro proveedor
  auth: {
    user: process.env.EMAIL_USER, // tu correo
    pass: process.env.EMAIL_PASS  // tu contraseña de aplicación
  }
});

// Verificar la configuración del transportador al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error en configuración de correo:', error);
  } else {
    console.log('✅ Servidor de correo configurado correctamente');
  }
});

// Función para generar código aleatorio de 5 dígitos
function generarCodigoRecuperacion() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

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

const iniciarSesion = async (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);
  
  try {
    const queryValidarUsuario = ` 
         SELECT * FROM usuario WHERE username = $1 AND password = $2
    `;
    const resultValidarUsuario = await pool.query(queryValidarUsuario, [username, password]);

    if (resultValidarUsuario.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { id_usuario, nombre, correo } = resultValidarUsuario.rows[0];

    try {
      const token = generarAccessToken({
        id_usuario,
        nombre,
      });

      res.status(200).json({ 
        token,
        email: correo // Incluir el email en la respuesta para el frontend
      });

    } catch (error) {
      console.error('Error al generar el token', error);
      return res.status(500).json({ error: 'Error al generar el token' });
    }

  } catch (error) {
    console.error('Error al iniciar sesión', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const registrarUsuario = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar si ya existe un usuario con el mismo username o correo
    const queryVerificar = `
      SELECT 1 FROM usuario WHERE username = $1 OR correo = $2
    `;
    const resultVerificar = await pool.query(queryVerificar, [username, email]);

    if (resultVerificar.rowCount > 0) {
      return res.status(409).json({ error: 'El usuario o correo ya existe' });
    }

    // Insertar el nuevo usuario
    const queryInsertar = `
      INSERT INTO usuario (username, password, correo, nombre)
      VALUES ($1, $2, $3, $4)
      RETURNING id_usuario, username, correo
    `;

    const nombre = username;
    await pool.query(queryInsertar, [username, password, email, nombre]);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const recuperarContraseña = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido' });
  }

  try {
    // Verificar si el correo existe en la base de datos
    const queryVerificarCorreo = `
      SELECT id_usuario, username, correo FROM usuario WHERE correo = $1
    `;
    const resultVerificarCorreo = await pool.query(queryVerificarCorreo, [email]);

    if (resultVerificarCorreo.rowCount === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con este correo electrónico' });
    }

    const usuario = resultVerificarCorreo.rows[0];
    
    // Generar código de recuperación de 5 dígitos
    const codigoRecuperacion = generarCodigoRecuperacion();
    
    // Guardar el código en la base de datos con tiempo de expiración (30 minutos)
    const fechaExpiracion = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    
    const queryActualizarCodigo = `
      UPDATE usuario 
      SET verification_code = $1, code_expiration = $2 
      WHERE id_usuario = $3
    `;
    
    await pool.query(queryActualizarCodigo, [codigoRecuperacion, fechaExpiracion, usuario.id_usuario]);

    // Configurar el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CashPilot - Código de recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">CashPilot</h1>
            <p style="color: #6B7280; margin: 5px 0;">Tu piloto financiero personal</p>
          </div>
          
          <div style="background-color: #F9FAFB; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #1F2937; margin-top: 0;">Recuperación de contraseña</h2>
            <p style="color: #374151; line-height: 1.6;">
              Hola <strong>${usuario.username}</strong>,
            </p>
            <p style="color: #374151; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
              Usa el siguiente código para continuar con el proceso:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4F46E5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                ${codigoRecuperacion}
              </div>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              Este código expirará en <strong>30 minutos</strong> por seguridad.
            </p>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Si no solicitaste este restablecimiento, puedes ignorar este correo de forma segura.
            </p>
          </div>
          
          <div style="text-align: center; color: #6B7280; font-size: 12px;">
            <p>© 2025 CashPilot. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    console.log(`Código de recuperación enviado a ${email}: ${codigoRecuperacion}`);

    res.status(200).json({
      mensaje: 'Código de recuperación enviado exitosamente',
      email: email
    });

  } catch (error) {
    console.error('Error al enviar código de recuperación:', error);
    res.status(500).json({ error: 'Error al enviar el código de recuperación' });
  }
};

const restablecerContraseña = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar el código y que no haya expirado
    const queryVerificarCodigo = `
      SELECT id_usuario, username, verification_code, code_expiration 
      FROM usuario 
      WHERE correo = $1
    `;
    
    const resultVerificarCodigo = await pool.query(queryVerificarCodigo, [email]);

    if (resultVerificarCodigo.rowCount === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con este correo electrónico' });
    }

    const usuario = resultVerificarCodigo.rows[0];

    // Verificar que el código coincida
    if (usuario.verification_code !== code) {
      return res.status(400).json({ error: 'Código de verificación inválido' });
    }

    // Verificar que el código no haya expirado
    if (new Date() > new Date(usuario.code_expiration)) {
      return res.status(400).json({ error: 'El código de verificación ha expirado' });
    }

    // Actualizar la contraseña y limpiar el código de verificación
    const queryActualizarContraseña = `
      UPDATE usuario 
      SET password = $1, verification_code = NULL, code_expiration = NULL 
      WHERE correo = $2
    `;
    
    await pool.query(queryActualizarContraseña, [newPassword, email]);

    console.log(`Contraseña restablecida exitosamente para: ${email}`);

    // Enviar correo de confirmación
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CashPilot - Contraseña restablecida exitosamente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">CashPilot</h1>
            <p style="color: #6B7280; margin: 5px 0;">Tu piloto financiero personal</p>
          </div>
          
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #15803D; margin-top: 0;">✅ Contraseña restablecida</h2>
            <p style="color: #374151; line-height: 1.6;">
              Hola <strong>${usuario.username}</strong>,
            </p>
            <p style="color: #374151; line-height: 1.6;">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <p style="color: #374151; line-height: 1.6;">
              Si no realizaste este cambio, contacta con nuestro soporte inmediatamente.
            </p>
          </div>
          
          <div style="text-align: center; color: #6B7280; font-size: 12px;">
            <p>© 2025 CashPilot. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      mensaje: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

module.exports = {
  iniciarSesion,
  registrarUsuario,
  recuperarContraseña,
  restablecerContraseña
};