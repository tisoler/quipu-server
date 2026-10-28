import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum CopiaComprobante {
  ORIGINAL = 'original',
  DUPLICADO = 'duplicado',
  TRIPLICADO = 'triplicado',
}

export class PdfFacturaQueryDto {
  @ApiProperty({ required: false, enum: CopiaComprobante, default: CopiaComprobante.ORIGINAL })
  @IsEnum(CopiaComprobante)
  @IsOptional()
  copia?: CopiaComprobante;
}
