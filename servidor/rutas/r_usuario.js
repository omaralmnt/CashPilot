const express = require('express');
const { iniciarSesion } = require('../controladores/procesos/c_login');
const router = express.Router();
// const { ObtenerBanco, ObtenerTipoCuentaBanco } = require('../controladores/mantenimientos/c_banco');

router.post('/login', iniciarSesion)

module.exports = router;