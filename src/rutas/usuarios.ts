import { Request, Response } from 'express';
import { RepositorioUsuario } from '../Repositorio/repositorio';
import { ConexionDatos } from '../ConexionDatos/conexionDatos';

export const rutaLogin = async (req: Request, res: Response, conexionDB: ConexionDatos) => {
  try {
    const { usuario, password } = req.body;
    const repositorio = new RepositorioUsuario(conexionDB);
    const isAuthenticated = await repositorio.login(usuario, password)
    if (isAuthenticated) {
      res.status(200).send(`Usuario autenticado correctamente: ${usuario}`);
    } else {
      res.status(401).send('Credenciales inválidas.');
    }
  } catch (e) {
    res.status(500).send('Error autenticando usuario.');
  }
};
