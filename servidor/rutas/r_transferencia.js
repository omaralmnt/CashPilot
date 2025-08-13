// rutas/r_usuario.js

const express = require('express');
const { registrarTransferencia } = require('../controladores/procesos/c_transferencia');
const router = express.Router();

router.post('/', registrarTransferencia );
router.get('/',  );


module.exports = router;