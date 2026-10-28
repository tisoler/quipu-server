import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const PREFIJO_FACTURAS = 'quipu/facturas/';

/**
 * Subida de PDFs de facturas a DigitalOcean Spaces para compartirlos
 * por WhatsApp. La key es determinística por comprobante, así que
 * republicar sobrescribe el mismo objeto (idempotente, sin migración).
 */
@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('DO_SPACES_ENDPOINT');
    const region = config.get<string>('DO_SPACES_REGION', 'nyc3');
    const key = config.get<string>('DO_SPACES_KEY');
    const secret = config.get<string>('DO_SPACES_SECRET');
    this.bucket = config.get<string>('DO_SPACES_BUCKET');

    if (endpoint && key && secret && this.bucket) {
      this.client = new S3Client({
        endpoint,
        region,
        forcePathStyle: false,
        credentials: {
          accessKeyId: key,
          secretAccessKey: secret,
        },
      });
    } else {
      this.client = null;
    }

    this.publicBaseUrl =
      config.get<string>('DO_SPACES_PUBLIC_URL') ??
      `https://${this.bucket}.${region}.digitaloceanspaces.com`;
  }

  /** Sube el PDF de una factura con ACL público y devuelve la URL pública. */
  async subirFacturaPdf(idEmpresa: number, nombreArchivo: string, buffer: Buffer): Promise<string> {
    if (!this.client) {
      throw new BadRequestException(
        'Almacenamiento de PDFs no configurado (faltan variables DO_SPACES_*)',
      );
    }
    const key = `${PREFIJO_FACTURAS}${idEmpresa}/${nombreArchivo}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
        ACL: 'public-read',
      }),
    );
    this.logger.log(`PDF publicado: ${key}`);
    return `${this.publicBaseUrl}/${key}`;
  }
}
