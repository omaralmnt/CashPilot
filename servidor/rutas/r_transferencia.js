// rutas/r_usuario.js

const express = require('express');
const { registrarTransferencia, obtenerTransferenciasUsuario } = require('../controladores/procesos/c_transferencia');
const router = express.Router();

router.post('/', registrarTransferencia );
router.get('/usuario/:id_usuario', obtenerTransferenciasUsuario );


module.exports = router;