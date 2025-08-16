// rutas/r_transferencia.js

const express = require('express');
const { registrarTransferencia, obtenerTransferenciasUsuario, obtenerCategorias, registrarPagoTercero, registrarRecepcionDinero, obtenerCategoriasPersonalizadas, crearCategoriaPersonalizada, actualizarCategoriaPersonalizada, eliminarCategoriaPersonalizada } = require('../controladores/procesos/c_transferencia');
const router = express.Router();

router.post('/', registrarTransferencia );
router.get('/usuario/:id_usuario', obtenerTransferenciasUsuario );
router.get('/categorias/:id_usuario',obtenerCategorias)
router.post('/pago-tercero',registrarPagoTercero)
router.post('/recibir-dinero',registrarRecepcionDinero)
router.get('/categorias-personalizadas',obtenerCategoriasPersonalizadas)
router.post('/categorias-personalizadas',crearCategoriaPersonalizada)
router.put('/categorias-personalizadas',actualizarCategoriaPersonalizada)
router.delete('/categorias-personalizadas',eliminarCategoriaPersonalizada)


module.exports = router;