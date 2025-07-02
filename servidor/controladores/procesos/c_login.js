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
         SELECT id_usuario,nombre FROM usuario WHERE username = $1 AND password = $2
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


module.exports = {
    iniciarSesion
}