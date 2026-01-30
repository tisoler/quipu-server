import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { EstadoMaterial } from '../../entities/material.entity';

export class CreateMaterialDto {
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

  @ApiProperty({ enum: EstadoMaterial, default: EstadoMaterial.ACTIVO })
  @IsEnum(EstadoMaterial)
  @IsOptional()
  estado?: EstadoMaterial;

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
