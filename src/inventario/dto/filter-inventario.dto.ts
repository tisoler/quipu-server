import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsArray, IsIn } from 'class-validator';
import { TipoArticulo } from '../../entities/movimiento.entity';
import { Type } from 'class-transformer';

export enum AgruparPor {
  ARTICULO = 'articulo',
  ALMACEN = 'almacen',
}

export class FilterInventarioDto {
  @ApiProperty({ enum: TipoArticulo, required: false })
  @IsEnum(TipoArticulo)
  @IsOptional()
  tipoArticulo?: TipoArticulo;

  @ApiProperty({ enum: AgruparPor, required: false, default: AgruparPor.ARTICULO })
  @IsEnum(AgruparPor)
  @IsOptional()
  agruparPor?: AgruparPor = AgruparPor.ARTICULO;

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @Type(() => Number)
  @IsOptional()
  idArticulos?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @Type(() => Number)
  @IsOptional()
  idAlmacenes?: number[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;
}
