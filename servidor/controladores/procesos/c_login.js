const jwt = require('jsonwebtoken');
const pool = require('../conexion');
const dotenv = require('dotenv');
dotenv.config();

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
  // console.log(clave)

  console.log(username,password)
  try {
    const queryValidarUsuario = ` 
         SELECT * FROM usuario WHERE username = $1 AND password = $2
    `;
    const resultValidarUsuario = await pool.query(queryValidarUsuario, [ username , password]);

    if (resultValidarUsuario.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { id_usuario, nombre } = resultValidarUsuario.rows[0];

    try {
        const token = generarAccessToken({
            id_usuario,
            nombre,
    
          });

   
        // console.log('Token actualizado en la base de datos');
          res.status(200).json({ token });

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

    const nombre = username; // o puedes pedir el campo por separado
    await pool.query(queryInsertar, [username, password, email, nombre]);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
    iniciarSesion,
    registrarUsuario
}