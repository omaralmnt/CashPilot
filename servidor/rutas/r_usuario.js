// rutas/r_usuario.js

const express = require('express');
const router = express.Router();

// Importar controladores existentes
const { iniciarSesion, registrarUsuario } = require('../controladores/procesos/c_login');

// Importar nuevos controladores de perfil
const { 
  verificarToken, 
  obtenerUsuario, 
  actualizarUsuario, 
  verificarUsername 
} = require('../controladores/procesos/c_perfil_usuario');

// Rutas existentes
router.post('/login', iniciarSesion);
router.post('/register', registrarUsuario);

// Nuevas rutas para perfil de usuario (protegidas con JWT)
router.get('/users/:id', verificarToken, obtenerUsuario);
router.put('/users/:id', verificarToken, actualizarUsuario);
router.get('/check-username/:username', verificarToken, verificarUsername);

// Ruta de prueba para verificar que el token funciona
router.get('/profile', verificarToken, (req, res) => {
  res.json({ 
    mensaje: 'Token válido', 
    usuario: req.user 
  });
});

module.exports = router;