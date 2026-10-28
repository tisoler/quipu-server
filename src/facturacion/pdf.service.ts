import { Injectable } from '@nestjs/common';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Comprobante } from '../entities/comprobante.entity';
import { letraTipoComprobante } from './facturacion.service';
import { CopiaComprobante } from './dto/pdf-factura.dto';

// Formato ARCA: decimales con coma, sin separador de miles ("37450,11")
const money = (n: number) => (Number(n) || 0).toFixed(2).replace('.', ',');
const qty = (n: number) => (Number(n) || 0).toFixed(2).replace('.', ',');

const COPIA_LABEL: Record<CopiaComprobante, string> = {
  [CopiaComprobante.ORIGINAL]: 'ORIGINAL',
  [CopiaComprobante.DUPLICADO]: 'DUPLICADO',
  [CopiaComprobante.TRIPLICADO]: 'TRIPLICADO',
};

const IVA_ROWS = ['27%', '21%', '10.5%', '5%', '2.5%', '0%'];

@Injectable()
export class PdfFacturaService {
  async generar(comprobante: Comprobante, copia: CopiaComprobante = CopiaComprobante.ORIGINAL): Promise<Buffer> {
    const s = comprobante.snapshot || {};
    const empresa = s.empresa || {};
    const cliente = s.cliente || {};
    const detalle = s.detalle || { items: [], ivaPorAlicuota: [] };
    const letra = letraTipoComprobante(comprobante.tipoComprobante);
    const cod = String(comprobante.tipoComprobante).padStart(2, '0');
    const cuitEmp = String(empresa.cuit || '').replace(/\D/g, '');
    const cuitRec = String(cliente.cuit || '').replace(/\D/g, '');

    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const M = 30;
    const PW = doc.page.width;
    const PH = doc.page.height;
    const W = PW - M * 2;
    const R = M + W;
    const FS = 8.5;

    // ---------- Fila ORIGINAL en recuadro ----------
    const origH = 26;
    doc.rect(M, M, W, origH).strokeColor('black').lineWidth(0.8).stroke();
    doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
    doc.text(COPIA_LABEL[copia], M, M + 7, { width: W, align: 'center' });

    // ---------- Encabezado principal ----------
    let y = M + origH + 4;
    const headerH = 118;
    doc.rect(M, y, W, headerH).strokeColor('black').lineWidth(0.8).stroke();
    const divX = M + 268;
    doc.moveTo(divX, y).lineTo(divX, y + headerH).strokeColor('black').lineWidth(0.8).stroke();

    // Letra centrada sobre el divisor, a la altura de la primera fila
    const letraW = 47;
    const letraH = 41;
    const letraX = divX - letraW / 2;
    doc.rect(letraX, y, letraW, letraH).fillColor('white').fill();
    doc.rect(letraX, y, letraW, letraH).strokeColor('black').lineWidth(0.8).stroke();
    doc.font('Helvetica-Bold').fontSize(22).fillColor('black');
    doc.text(letra, letraX, y + 6, { width: letraW, align: 'center' });
    doc.font('Helvetica').fontSize(7);
    doc.text(`COD. ${cod}`, letraX, y + 28, { width: letraW, align: 'center' });

    // Columna izquierda: nombre arriba, datos al fondo con interlineado amplio
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(empresa.razonSocial || '', M + 6, y + 26, { width: 256, align: 'center' });
    doc.fontSize(FS);
    const leadL = 16;
    const yL3 = y + headerH - 12 - 11;
    this.fila(doc, M + 6, yL3 - leadL * 2, 'Razón Social: ', empresa.razonSocial || '', 250);
    this.fila(doc, M + 6, yL3 - leadL, 'Domicilio Comercial: ', empresa.domicilio || '', 250);
    this.fila(doc, M + 6, yL3, 'Condición frente al IVA: ', empresa.condicionIva || '', 250);

    // Columna derecha
    const colR = divX + 56;
    doc.font('Helvetica-Bold').fontSize(15);
    doc.text('FACTURA', colR, y + 6);
    doc.fontSize(FS);
    const pv = String(comprobante.puntoVenta).padStart(5, '0');
    const nro = String(comprobante.nroComprobante).padStart(8, '0');
    const leadR = 14;
    let yr = y + 30;
    doc.font('Helvetica-Bold');
    doc.text(`Punto de Venta:  ${pv}     Comp. Nro:  ${nro}`, colR, yr);
    yr += leadR;
    this.fila(doc, colR, yr, 'Fecha de Emisión: ', this.fechaCorta(s.fechaEmision), R - colR - 4);
    yr += leadR + 6;
    this.fila(doc, colR, yr, 'CUIT: ', cuitEmp, R - colR - 4);
    yr += leadR;
    this.fila(doc, colR, yr, 'Ingresos Brutos: ', empresa.iibb || '', R - colR - 4);
    yr += leadR;
    this.fila(doc, colR, yr, 'Fecha de Inicio de Actividades: ', this.fechaLarga(empresa.fechaInicioActividades), R - colR - 4);

    y += headerH + 6;

    // ---------- Bloque receptor ----------
    const recepH = 52;
    doc.rect(M, y, W, recepH).strokeColor('black').lineWidth(0.8).stroke();
    doc.font('Helvetica-Bold').fontSize(FS);
    this.fila(doc, M + 6, y + 6, 'CUIT:   ', cuitRec || '-', 140);
    this.fila(doc, M + 150, y + 6, 'Apellido y Nombre / Razón Social: ', cliente.nombre || '', R - M - 156, 7.5);
    doc.fontSize(FS);
    this.fila(doc, M + 6, y + 20, 'Condición frente al IVA: ', cliente.condicionIva || '', 250);
    this.fila(doc, M + 262, y + 20, 'Domicilio Comercial: ', cliente.domicilio || '', R - M - 268);
    this.fila(doc, M + 6, y + 34, 'Condición de venta: ', this.etiquetaPago(s.tipoPago), W - 12);

    y += recepH + 10;

    // ---------- Tabla de ítems (solo el header con bordes) ----------
    const cols: { x: number; w: number; label: string; align: 'left' | 'right' | 'center'; twoLines?: boolean }[] = [
      { x: M, w: 30, label: 'Código', align: 'center' },
      { x: M + 30, w: 158, label: 'Producto / Servicio', align: 'center' },
      { x: M + 188, w: 50, label: 'Cantidad', align: 'center' },
      { x: M + 238, w: 44, label: 'U. medida', align: 'center' },
      { x: M + 282, w: 56, label: 'Precio Unit.', align: 'center' },
      { x: M + 338, w: 40, label: '% Bonif', align: 'center' },
      { x: M + 378, w: 56, label: 'Subtotal', align: 'center' },
      { x: M + 434, w: 36, label: 'Alicuota IVA', align: 'center', twoLines: true },
      { x: M + 470, w: 65, label: 'Subtotal c/IVA', align: 'center' },
    ];
    const headH = 22;
    const rowH = 14;
    doc.rect(M, y, W, headH).fillColor('#d9d9d9').fill();
    doc.rect(M, y, W, headH).strokeColor('black').lineWidth(0.7).stroke();
    for (const c of cols) {
      doc.moveTo(c.x, y).lineTo(c.x, y + headH).strokeColor('black').lineWidth(0.5).stroke();
    }
    doc.moveTo(R, y).lineTo(R, y + headH).strokeColor('black').lineWidth(0.7).stroke();
    doc.fillColor('black').font('Helvetica-Bold').fontSize(7.5);
    for (const c of cols) {
      doc.text(c.label, c.x + 2, y + (c.twoLines ? 3 : 6), { width: c.w - 4, align: 'center' });
    }
    y += headH;

    // Posiciones fijas desde abajo: totales + pie (margen inferior como el original)
    const bottomMargin = 40;
    const footerH = 116;
    const footerTop = PH - bottomMargin - footerH;
    const totRows = 10; // otros trib + neto + 6 ivas + otros trib + total
    const totH = totRows * 13 + 16;
    const totalsTop = footerTop - 10 - totH;

    const items = detalle.items || [];
    doc.font('Helvetica').fontSize(7.5);
    const cellAlign: ('left' | 'right' | 'center')[] =
      ['center', 'left', 'right', 'left', 'right', 'center', 'right', 'center', 'right'];
    items.forEach((it: any, i: number) => {
      if (y + rowH > totalsTop) {
        doc.addPage();
        y = 50;
      }
      const vals = [
        String(i + 1),
        `${it.codigo ? it.codigo + ' ' : ''}${it.descripcion || ''}`.slice(0, 34),
        qty(it.cantidad),
        'unidades',
        money(it.precioUnitarioNeto),
        '0,00',
        money(it.subtotalNeto),
        `${Number(it.alicuotaIva || 0)}%`,
        money(it.subtotalConIva),
      ];
      vals.forEach((v, j) => {
        doc.text(v, cols[j].x + 2, y + 8, { width: cols[j].w - 4, align: cellAlign[j] });
      });
      y += rowH;
    });

    // ---------- Totales en recuadro ----------
    const ivaMap = new Map<string, number>();
    for (const a of detalle.ivaPorAlicuota || []) {
      ivaMap.set(`${Number(a.alicuota)}%`, Number(a.importe));
    }
    y = Math.max(y + 12, totalsTop);
    doc.rect(M, y, W, totH).strokeColor('black').lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(FS).fillColor('black');
    let yt = y + 8;
    doc.text('Importe Otros Tributos: $   0,00', M, yt, { width: W, align: 'center' });
    yt += 13;
    this.totalRow(doc, R - 8, yt, 'Importe Neto Gravado: $', money(detalle.netoGravado));
    yt += 13;
    for (const pct of IVA_ROWS) {
      this.totalRow(doc, R - 8, yt, `IVA ${pct}: $`, money(ivaMap.get(pct) ?? 0));
      yt += 13;
    }
    this.totalRow(doc, R - 8, yt, 'Importe Otros Tributos: $', '0,00');
    yt += 13;
    this.totalRow(doc, R - 8, yt, 'Importe Total: $', money(detalle.impTotal), 9.5);

    // ---------- Pie ----------
    y = footerTop;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
    doc.text('Pág. 1/1', M, y, { width: W, align: 'center' });

    const qr = await QRCode.toBuffer(this.qrPayload(comprobante, s), {
      errorCorrectionLevel: 'M',
      width: 360,
      margin: 1,
    });
    const qrSize = 92;
    doc.image(qr, M + 4, y + 14, { width: qrSize, height: qrSize });

    const midX = M + 110;
    try {
      doc.image(path.join(__dirname, '..', '..', 'assets', 'arca.png'), midX, y + 14, { width: 61 });
    } catch {
      doc.font('Helvetica-Bold').fontSize(13).fillColor('black');
      doc.text('ARCA', midX, y + 16);
      doc.font('Helvetica').fontSize(6.5).fillColor('#333');
      doc.text('AGENCIA DE RECAUDACIÓN\nY CONTROL ADUANERO', midX, y + 34, { width: 120 });
    }
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
    doc.text('Comprobante Autorizado', midX, y + 58);
    doc.font('Helvetica-Oblique').fontSize(7);
    doc.text('Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación', midX, y + 72, { width: 260 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
    doc.text(`CAE N°:  ${comprobante.cae || ''}`, midX + 130, y + 14, { width: R - midX - 130, align: 'right' });
    doc.text(`Fecha de Vto. de CAE:  ${this.fechaLarga(comprobante.caeVencimiento)}`, midX + 130, y + 28, { width: R - midX - 130, align: 'right' });

    doc.end();
    return done;
  }

  /** Payload del QR según RG 4892 (idéntico al de la web de ARCA). */
  qrPayload(comprobante: Comprobante, s: any): string {
    const cliente = s.cliente || {};
    const detalle = s.detalle || {};
    const f = String(s.fechaEmision || '');
    const data = {
      ver: 1,
      fecha: f.length === 8 ? `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6, 8)}` : f,
      cuit: Number(String(s.empresa?.cuit || '').replace(/\D/g, '')),
      ptoVta: Number(comprobante.puntoVenta),
      tipoCmp: Number(comprobante.tipoComprobante),
      nroCmp: Number(comprobante.nroComprobante),
      importe: Number(Number(detalle.impTotal || 0).toFixed(2)),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: Number(cliente.docTipo ?? 99),
      nroDocRec: Number(cliente.docNro ?? 0),
      tipoCodAut: 'E',
      codAut: Number(comprobante.cae || 0),
    };
    return `https://www.arca.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify(data)).toString('base64')}`;
  }

  private fila(doc: any, x: number, y: number, label: string, value: string, width: number, valueSize = 8.5) {
    doc.font('Helvetica-Bold').fontSize(8.5);
    const lw = doc.widthOfString(label);
    doc.text(label, x, y);
    doc.font('Helvetica').fontSize(valueSize).text(value || '', x + lw, y, { width: Math.max(width - lw, 20) });
  }

  private totalRow(doc: any, right: number, y: number, label: string, value: string, size = 8.5) {
    const valueW = 90;
    const gap = 8;
    const labelW = 260;
    doc.font('Helvetica-Bold').fontSize(size);
    doc.text(value, right - valueW, y, { width: valueW, align: 'right' });
    doc.text(label, right - valueW - gap - labelW, y, { width: labelW, align: 'right' });
  }

  private fechaCorta(fecha: string): string {
    if (!fecha || fecha.length !== 8) return fecha || '';
    return `${fecha.slice(6, 8)}/${fecha.slice(4, 6)}/${fecha.slice(0, 4)}`;
  }

  private fechaLarga(fecha?: string): string {
    if (!fecha) return '';
    if (/^\d{8}$/.test(fecha)) return this.fechaCorta(fecha);
    const m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : fecha;
  }

  private etiquetaPago(tipoPago?: string): string {
    const map: Record<string, string> = {
      'tarjeta-credito': 'Tarjeta de Crédito',
      'tarjeta-debito': 'Tarjeta de Débito',
      efectivo: 'Contado',
      'transferencia-qr': 'Transferencia Bancaria',
      'cuenta-corriente': 'Cuenta Corriente',
    };
    return map[tipoPago || ''] || 'Contado';
  }
}
