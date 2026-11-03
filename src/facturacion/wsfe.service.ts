import { Injectable } from '@nestjs/common';
import * as soap from 'soap';
import { EntornoArca } from '../entities/credenciales-arca.entity';
import { WSFE_URLS } from './arca.constants';
import { arcaAxios } from './arca-http';

export interface AuthArca {
  token: string;
  sign: string;
  cuit: string;
}

export interface AlicIva {
  Id: number;
  BaseImp: number;
  Importe: number;
}

export interface FeDetReq {
  Concepto: number;
  DocTipo: number;
  DocNro: number;
  CbteDesde: number;
  CbteHasta: number;
  CbteFch: string;
  ImpTotal: number;
  ImpTotConc: number;
  ImpNeto: number;
  ImpOpEx: number;
  ImpIVA: number;
  ImpTrib: number;
  MonId: string;
  MonCotiz: number;
  CondicionIVAReceptorId: number;
  Iva?: { AlicIva: AlicIva[] };
}

export interface FeCAEReq {
  FeCabReq: { CantReg: number; PtoVta: number; CbteTipo: number };
  FeDetReq: { FECAEDetRequest: FeDetReq[] };
}

export interface ResultadoCae {
  resultado: string; // A = aprobado, R = rechazado, O = observado
  cae: string;
  caeFchVto: string;
  cbteDesde: number;
  observaciones?: { Obs: { Code: number; Msg: string }[] };
}

@Injectable()
export class WsfeService {
  private clients: Record<string, soap.Client> = {};

  /**
   * Puntos de venta habilitados en ARCA para Web Services (RECE).
   * Sirve para validar antes de emitir y para mostrarlo en Configuración.
   */
  async puntosVentaHabilitados(entorno: EntornoArca, auth: AuthArca): Promise<number[]> {
    const client = await this.getClient(entorno);

    const result: any = await new Promise((resolve, reject) => {
      client.FEParamGetPtosVenta(
        {
          Auth: { Token: auth.token, Sign: auth.sign, Cuit: auth.cuit },
        },
        (err: any, res: any) => {
          if (err) return reject(err);
          resolve(res);
        },
      );
    });

    const r = result?.FEParamGetPtosVentaResult;
    if (r?.Errors?.Err) {
      const errs = (Array.isArray(r.Errors.Err) ? r.Errors.Err : [r.Errors.Err])
        .map((e: any) => `${e.Code}: ${e.Msg}`)
        .join(' | ');
      throw new Error(`Error ARCA: ${errs}`);
    }

    const pts = r?.ResultGet?.PtoVenta;
    const arr = Array.isArray(pts) ? pts : pts ? [pts] : [];
    return arr.map((p: any) => Number(p.Nro)).filter((n: number) => !isNaN(n));
  }

  async ultimoAutorizado(entorno: EntornoArca, auth: AuthArca, puntoVenta: number, tipoCbte: number): Promise<number> {
    const client = await this.getClient(entorno);

    const result: any = await new Promise((resolve, reject) => {
      client.FECompUltimoAutorizado(
        {
          Auth: { Token: auth.token, Sign: auth.sign, Cuit: auth.cuit },
          PtoVta: puntoVenta,
          CbteTipo: tipoCbte,
        },
        (err: any, res: any) => {
          if (err) return reject(err);
          resolve(res);
        },
      );
    });

    const nro = result?.FECompUltimoAutorizadoResult?.CbteNro;
    return nro != null ? Number(nro) : 0;
  }

  async solicitarCae(entorno: EntornoArca, auth: AuthArca, req: FeCAEReq): Promise<ResultadoCae> {
    const client = await this.getClient(entorno);

    const result: any = await new Promise((resolve, reject) => {
      client.FECAESolicitar(
        {
          Auth: { Token: auth.token, Sign: auth.sign, Cuit: auth.cuit },
          FeCAEReq: req,
        },
        (err: any, res: any) => {
          if (err) return reject(err);
          resolve(res);
        },
      );
    });

    const r = result?.FECAESolicitarResult;
    if (!r) throw new Error('FECAESolicitar no devolvió resultado');

    if (r.Errors?.Err) {
      const errs = (Array.isArray(r.Errors.Err) ? r.Errors.Err : [r.Errors.Err])
        .map((e: any) => `${e.Code}: ${e.Msg}`)
        .join(' | ');
      throw new Error(`Error ARCA: ${errs}`);
    }

    const det = Array.isArray(r.FeDetResp?.FECAEDetResponse)
      ? r.FeDetResp.FECAEDetResponse[0]
      : r.FeDetResp?.FECAEDetResponse;

    if (!det) throw new Error('FECAESolicitar no devolvió detalle de comprobante');

    const observaciones = det.Observaciones?.Obs
      ? {
          Obs: (Array.isArray(det.Observaciones.Obs) ? det.Observaciones.Obs : [det.Observaciones.Obs]),
        }
      : undefined;

    return {
      resultado: det.Resultado,
      cae: det.CAE || '',
      caeFchVto: det.CAEFchVto || '',
      cbteDesde: Number(det.CbteDesde),
      observaciones,
    };
  }

  private async getClient(entorno: EntornoArca): Promise<soap.Client> {
    if (!this.clients[entorno]) {
      this.clients[entorno] = await soap.createClientAsync(WSFE_URLS[entorno], {
        request: arcaAxios(),
      });
    }
    return this.clients[entorno];
  }
}
