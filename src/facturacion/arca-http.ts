import axios from 'axios';
import * as https from 'https';

/**
 * Cliente HTTP para ARCA con un agente TLS propio.
 *
 * Los terminadores de producción de ARCA negocian Diffie-Hellman con
 * parámetros legacy que el nivel de seguridad por defecto de OpenSSL 3
 * (Node 22+/24) rechaza ("dh key too small"). Como ese ajuste no se puede
 * bajar por conexión en Node actual, el agente directamente NO ofrece
 * suites DHE y negocia ECDHE o RSA (verificado contra WSAA/WSFE prod).
 * No toca la seguridad del resto del backend (Firebase, etc.).
 */
const ARCA_CIPHERS = [
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES256-SHA384',
  'ECDHE-RSA-AES128-SHA256',
  'AES256-GCM-SHA384',
  'AES128-GCM-SHA256',
  'AES256-SHA256',
  'AES128-SHA256',
].join(':');

let cachedInstance: ReturnType<typeof axios.create> | null = null;

export function arcaAxios() {
  if (!cachedInstance) {
    cachedInstance = axios.create({
      timeout: 60000,
      httpsAgent: new https.Agent({
        keepAlive: true,
        ciphers: ARCA_CIPHERS,
      }),
    });
  }
  return cachedInstance;
}
  return cachedInstance;
}
