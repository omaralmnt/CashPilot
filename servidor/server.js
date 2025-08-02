const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000; 
app.use(express.json());
app.use(cors())


const rutasUsuario = require('./rutas/r_usuario');
const rutasCuenta = require('./rutas/r_cuenta')
const rutasGithub = require('./controladores/githubAuth')
app.use('/api/usuario', rutasUsuario);
app.use('/api/cuenta', rutasCuenta);
app.use('/api/cuenta', rutasCuenta);
app.use('/api/github',rutasGithub)
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
  