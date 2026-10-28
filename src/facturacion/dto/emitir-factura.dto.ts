import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { EntornoArca } from '../../entities/credenciales-arca.entity';

export class EmitirFacturaDto {
  @ApiProperty({ required: false, description: 'Cliente a facturar. Si se omite y la venta no tiene cliente, es consumidor final' })
  @IsNumber()
  @IsOptional()
  idCliente?: number;

  @ApiProperty({ required: false, enum: EntornoArca, description: 'Entorno ARCA (por defecto el configurado en el servidor)' })
  @IsEnum(EntornoArca)
  @IsOptional()
  entorno?: EntornoArca;
}
