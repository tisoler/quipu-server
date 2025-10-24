import { UsuarioBase } from "./usuario";

export class ConexionDatos {
  async inicializar(): Promise<never | void> {
    throw new Error('No implementado - inicializar - conexionDatos.ts');
  };

  async login(usuario: string, password: string): Promise<never | UsuarioBase | null> {
    throw new Error('No implementado - login - conexionDatos.ts');
  };
};
