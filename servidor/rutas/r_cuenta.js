const express = require('express');
const { 
 crearCuenta, 
 consultarCuentas, 
 consultarTodasLasCuentas, 
 consultarCuentaPorId,
 actualizarCuenta,
 eliminarCuenta,
 consultarBancos,
 consultarTiposCuenta,
 consultarColores,
 consultarResumenCuentas,
 consultarCuentasPorTipo,
 cambiarEstadoCuenta
} = require('../controladores/c_cuenta');

const router = express.Router();

// ===============================
// RUTAS PRINCIPALES DE CUENTA
// ===============================
router.post('/crear', crearCuenta);
router.get('/cuentas/usuario/:id_usuario', consultarCuentas);
router.get('/cuentas', consultarTodasLasCuentas);
router.get('/cuentas/:id_cuenta', consultarCuentaPorId);
router.put('/cuentas/:id_cuenta', actualizarCuenta);
router.delete('/cuentas/:id_cuenta', eliminarCuenta);

// ===============================
// RUTAS AUXILIARES
// ===============================
router.get('/bancos', consultarBancos);
router.get('/tipos-cuenta', consultarTiposCuenta);
router.get('/colores', consultarColores);

// ===============================
// RUTAS ADICIONALES
// ===============================
router.get('/cuentas/usuario/:id_usuario/resumen', consultarResumenCuentas);
router.get('/cuentas/usuario/:id_usuario/por-tipo', consultarCuentasPorTipo);
router.patch('/cuentas/:id_cuenta/estado', cambiarEstadoCuenta);

module.exports = router;