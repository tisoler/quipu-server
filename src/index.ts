import express from 'express';
import { PORT } from './config/config'
import { ConexionDatosSequelize } from './ConexionDatos/conexionDatosSequelize';
import { rutaLogin } from './rutas/usuarios';

const app = express();
app.use(express.json());

// Iniciar Base de Datos
const conexionDB = new ConexionDatosSequelize();
await conexionDB.inicializar();

app.post('/api/login', (req, res) => rutaLogin(req, res, conexionDB))

app.listen(PORT, () => {
  console.info(`⚡️[Server]: Server running in http://localhost:${PORT}`);
})
