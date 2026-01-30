import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { EstadoProducto } from '../../entities/producto.entity';

export class CreateProductoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

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
}
