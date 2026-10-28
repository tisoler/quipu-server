import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoPago } from '../../entities/movimiento.types';

export class ItemVentaDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idProducto: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  cantidad: number;

  @ApiProperty({ required: false, description: 'Si se omite, se usa el precio del producto' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  precio?: number;
}

export class RegistrarVentasDto {
  @ApiProperty({ enum: TipoPago, description: 'Medio de cobro de la venta' })
  @IsEnum(TipoPago)
  @IsNotEmpty()
  tipoPago: TipoPago;

  @ApiProperty({ type: [ItemVentaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items: ItemVentaDto[];
}
