import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';
import { TipoMovimiento, TipoArticulo, EstadoMovimiento } from '../../entities/movimiento.entity';
import { Type } from 'class-transformer';

export class FilterMovimientoDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @ApiProperty({ enum: TipoArticulo, required: false })
  @IsEnum(TipoArticulo)
  @IsOptional()
  tipoArticulo?: TipoArticulo;

  @ApiProperty({ enum: TipoMovimiento, required: false })
  @IsEnum(TipoMovimiento)
  @IsOptional()
  tipoMovimiento?: TipoMovimiento;

  @ApiProperty({ enum: EstadoMovimiento, required: false })
  @IsEnum(EstadoMovimiento)
  @IsOptional()
  estado?: EstadoMovimiento;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  idAlmacen?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
