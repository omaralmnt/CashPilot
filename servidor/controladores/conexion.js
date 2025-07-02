const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

});

// Establecer la zona horaria en cada conexión
pool.on('connect', (client) => {
  client.query("SET TIMEZONE = 'America/Santo_Domingo'");
});

module.exports = pool;
