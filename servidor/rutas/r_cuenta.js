const express = require('express');
const { crearCuenta } = require('../controladores/c_cuenta');
const router = express.Router();

router.post('/crear',crearCuenta)

module.exports = router;