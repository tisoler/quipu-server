import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsIn, IsArray } from 'class-validator';
import { EstadoProducto } from '../../entities/producto.entity';

export class CreateProductoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  presentacion?: string;

  @ApiProperty({ enum: EstadoProducto, default: EstadoProducto.ACTIVO })
  @IsEnum(EstadoProducto)
  @IsOptional()
  estado?: EstadoProducto;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockMinimo?: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  precio?: number;

  @ApiProperty({ required: false, enum: ['A', 'B', 'C'] })
  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  tipoProducto?: string;

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsOptional()
  rubroIds?: number[];
}
