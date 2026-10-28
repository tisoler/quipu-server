import { Injectable } from '@nestjs/common';
import * as soap from 'soap';
import * as forge from 'node-forge';
import { XMLParser } from 'fast-xml-parser';
import { EntornoArca } from '../entities/credenciales-arca.entity';
import { WSAA_URLS, SERVICE_WSFE } from './arca.constants';

export interface TicketAccesoArca {
  token: string;
  sign: string;
  expirationTime: string;
}

/** Genera el TRA (ticket de requerimiento de acceso) XML sin firmar. */
function buildTraXml(cuit: string, service: string): string {
  const now = new Date();
  const exp = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  // uniqueId en segundos (xsd:int de 32 bits): el timestamp en ms desborda el schema de ARCA
  const uniqueId = Math.floor(now.getTime() / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = (d: Date) => {
    const tz = -d.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const abs = Math.abs(tz);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
<header>
<uniqueId>${uniqueId}</uniqueId>
<generationTime>${offset(now)}</generationTime>
<expirationTime>${offset(exp)}</expirationTime>
</header>
<service>${service}</service>
</loginTicketRequest>`;
}

@Injectable()
export class WsaaService {
  private clients: Record<string, soap.Client> = {};

  async login(entorno: EntornoArca, cuit: string, certificado: string, clavePrivada: string): Promise<TicketAccesoArca> {
    const tra = this.buildTra(cuit, SERVICE_WSFE);
    const signedCms = this.firmarCms(tra, certificado, clavePrivada);

    const client = await this.getClient(entorno);
    const result: any = await new Promise((resolve, reject) => {
      client.loginCms({ in0: signedCms }, (err: any, res: any) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    const ret = result?.loginCmsReturn;
    // loginCmsReturn es el ticket como string XML: hay que parsearlo
    if (typeof ret !== 'string' || !ret.includes('<token>')) {
      throw new Error(`WSAA no devolvió un ticket válido: ${JSON.stringify(result).slice(0, 300)}`);
    }

    const ticket = new XMLParser().parse(ret);
    const token = ticket?.loginTicketResponse?.credentials?.token;
    const sign = ticket?.loginTicketResponse?.credentials?.sign;
    const expirationTime = ticket?.loginTicketResponse?.header?.expirationTime;
    if (!token || !sign) {
      throw new Error('WSAA no devolvió token/sign en el ticket');
    }

    return { token, sign, expirationTime };
  }

  /** Expuesto para diagnóstico/pruebas: genera el TRA sin firmar. */
  buildTra(cuit: string, service: string): string {
    return buildTraXml(cuit, service);
  }

  /** Firma el TRA (PKCS#7 / CMS) con la clave privada y certificado del contribuyente. */
  firmarCms(tra: string, certificadoPem: string, clavePrivadaPem: string): string {
    const certificate = forge.pki.certificateFromPem(certificadoPem);
    const privateKey = forge.pki.privateKeyFromPem(clavePrivadaPem);

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(tra, 'utf8');
    p7.addCertificate(certificate);
    p7.addSigner({
      key: privateKey,
      certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date() as any },
      ],
    });
    p7.sign({ detached: false });

    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    // ARCA rechaza el base64 con saltos de línea: se envía en una sola línea
    return forge.util.encode64(der).replace(/[\r\n]/g, '');
  }

  private async getClient(entorno: EntornoArca): Promise<soap.Client> {
    if (!this.clients[entorno]) {
      this.clients[entorno] = await soap.createClientAsync(WSAA_URLS[entorno], {});
    }
    return this.clients[entorno];
  }
}
