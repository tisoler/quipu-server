import { EntornoArca } from '../entities/credenciales-arca.entity';

export const WSAA_URLS: Record<EntornoArca, string> = {
  [EntornoArca.HOMOLOGACION]: 'https://wsaahomo.afip.gob.ar/ws/services/LoginCms?wsdl',
  [EntornoArca.PRODUCCION]: 'https://wsaa.afip.gob.ar/ws/services/LoginCms?wsdl',
};

export const WSFE_URLS: Record<EntornoArca, string> = {
  [EntornoArca.HOMOLOGACION]: 'https://wswhomo.afip.gob.ar/wsfev1/service.asmx?wsdl',
  [EntornoArca.PRODUCCION]: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl',
};

export const SERVICE_WSFE = 'wsfe';

// Tipos de comprobante (Factura electrónica, Responsable Inscripto)
export enum TipoComprobanteArca {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  FACTURA_C = 11,
  NOTA_DEBITO_C = 12,
  NOTA_CREDITO_C = 13,
}

// Condición frente al IVA del receptor -> id para WSFE
export const CONDICION_IVA_IDS: Record<string, number> = {
  'IVA Responsable Inscripto': 1,
  'IVA Responsable No Inscripto': 3,
  'IVA Sujeto Exento': 4,
  'Consumidor Final': 5,
  'Responsable Monotributo': 6,
  'Monotributo Social': 13,
  'IVA No Alcanzado': 15,
};

export const CONDICIONES_IVA: { id: number; descripcion: string }[] = [
  { id: 1, descripcion: 'IVA Responsable Inscripto' },
  { id: 4, descripcion: 'IVA Sujeto Exento' },
  { id: 5, descripcion: 'Consumidor Final' },
  { id: 6, descripcion: 'Responsable Monotributo' },
  { id: 13, descripcion: 'Monotributo Social' },
  { id: 15, descripcion: 'IVA No Alcanzado' },
];

// Tipo de documento del receptor
export enum TipoDocArca {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  LE = 89,
  LC = 90,
  DNI = 96,
  CONSUMIDOR_FINAL = 99,
}

// Alícuotas de IVA (porcentaje) -> id para WSFE (FEParamGetTiposIva)
export const IVA_ALICUOTA_IDS: Record<string, number> = {
  '0': 3,
  '2.5': 9,
  '5': 8,
  '10.5': 4,
  '21': 5,
  '27': 6,
};

export const MONEDA_PESOS = 'PES';

/** Código de barras CAE: CUIT(11) + tipo(2) + ptoVta(4) + CAE(14) + vencimiento(8) */
export function buildCodigoBarras(
  cuit: string,
  tipoComprobante: number,
  puntoVenta: number,
  cae: string,
  caeVencimiento: string, // AAAAMMDD
): string {
  return (
    cuit.padStart(11, '0') +
    String(tipoComprobante).padStart(2, '0') +
    String(puntoVenta).padStart(4, '0') +
    String(cae).padStart(14, '0') +
    String(caeVencimiento).padStart(8, '0')
  );
}
