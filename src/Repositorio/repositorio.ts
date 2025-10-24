import { ConexionDatos } from "../ConexionDatos/conexionDatos";

export class RepositorioUsuario {
  conexionDB: ConexionDatos;

  constructor (conexion: ConexionDatos) {
    if (!conexion || !(conexion instanceof ConexionDatos)) {
      throw new Error('No hay una instancia válida de Base de datos - repositorio.ts');
    }

    this.conexionDB = conexion;
  }

  async login( usuario: string, password: string) {
    try {
      const usuarioRes = await this.conexionDB.login(usuario, password);
      return usuarioRes;
    } catch (e) {
      console.error('Error durante login - src/Repositorio/repositorio.ts', e);
    }
  }
}