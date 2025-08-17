// rutas/r_transferencia.js

const express = require('express');
const { registrarTransferencia, obtenerTransferenciasUsuario, obtenerCategorias, registrarPagoTercero, registrarRecepcionDinero, obtenerCategoriasPersonalizadas, crearCategoriaPersonalizada, actualizarCategoriaPersonalizada, eliminarCategoriaPersonalizada } = require('../controladores/procesos/c_transferencia');
const router = express.Router();

router.post('/', registrarTransferencia );
router.get('/usuario/:id_usuario', obtenerTransferenciasUsuario );
router.get('/categorias/:id_usuario',obtenerCategorias)
router.post('/pago-tercero',registrarPagoTercero)
router.post('/recibir-dinero',registrarRecepcionDinero)
router.get('/categorias-personalizadas/:id_usuario',obtenerCategoriasPersonalizadas)
router.post('/categorias-personalizadas/:id_usuario',crearCategoriaPersonalizada)
router.put('/categorias-personalizadas/:id_usuario',actualizarCategoriaPersonalizada)
router.delete('/categorias-personalizadas/:id_usuario',eliminarCategoriaPersonalizada)


module.exports = router;