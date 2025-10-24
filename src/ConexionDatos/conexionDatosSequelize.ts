import { Sequelize } from 'sequelize';
import { ConexionDatos } from './conexionDatos';
import bcrypt from 'bcrypt';
import { initUsuario, Usuario } from './Modelos/Sequelize/usuario';
import { DATA_BASE_HOST, DATA_BASE_PORT, DATA_BASE_USER, DATA_BASE_PASSWORD, DATA_BASE } from '../config/config'

export class ConexionDatosSequelize extends ConexionDatos {
  private conexionDB: Sequelize;

  constructor () {
    super();
    if (!DATA_BASE_USER || !DATA_BASE_PASSWORD || !DATA_BASE) {
      console.error('error: faltan algunas vars (DATA_BASE_USER, DATA_BASE_PASSWORD, DATA_BASE)')
      throw Error('error: faltan algunas vars  (DATA_BASE_USER, DATA_BASE_PASSWORD, DATA_BASE)')
    }

    this.conexionDB = new Sequelize(DATA_BASE, DATA_BASE_USER, DATA_BASE_PASSWORD, {
      host: DATA_BASE_HOST || `localhost`,
      port: DATA_BASE_PORT ? parseInt(DATA_BASE_PORT) : 3306,
      dialect: 'mysql',
      pool: {
        max: 10,
        min: 0,
        idle: 10000
      },
    });
  }

  async inicializar() {
    try {
      await this.conexionDB.authenticate();
      console.log('Se estableció la conexión a la BD correctamente.')
    } catch (error) {
      console.error('No se puede conectar a la BD:', error)
      throw Error(`No se puede conectar a la BD: ${error}`)
    }
  };

  async login(usuario: string, password: string) {
    try {
      await initUsuario(this.conexionDB);
      const usr = await Usuario.findOne({
        where: [{ usuario }]
      });

      if (!usr) return null;

      const isAuthenticated = await bcrypt.compare(password, usr.password || '');
      return isAuthenticated ? { usuario: usr.usuario, password: usr.password } : null;
    } catch (e) {
      console.error('Error durante login - conexionDatosSequelize.ts', e);
      return null;
    }
  }
};
