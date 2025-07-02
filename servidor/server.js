const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000; 
app.use(express.json());
app.use(cors())


const rutasUsuario = require('./rutas/r_usuario');


app.use('/api/usuario', rutasUsuario);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
  