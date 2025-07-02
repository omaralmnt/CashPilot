const pool = require('./servidor/controladores/conexion')
async function probarConexion() {
    console.log('ga')
  try {
    const resultado = await pool.query('SELECT CURRENT_TIMESTAMP::text');
    console.log('✅ Conexión exitosa:', resultado.rows[0]);
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  } finally {
    await pool.end(); // Cierra la conexión
  }
}

probarConexion();