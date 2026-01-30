import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { TipoMovimiento, TipoArticulo } from '../../entities/movimiento.entity';

export class CreateMovimientoDto {
  @ApiProperty({ enum: TipoArticulo })
  @IsEnum(TipoArticulo)
  @IsNotEmpty()
  tipoArticulo: TipoArticulo;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idArticulo: number;

  @ApiProperty({ enum: TipoMovimiento })
  @IsEnum(TipoMovimiento)
  @IsNotEmpty()
  tipoMovimiento: TipoMovimiento;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  cantidad: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  precio: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  total: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idAlmacen: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fecha?: string;
}
