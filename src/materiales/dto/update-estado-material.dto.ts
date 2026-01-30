import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoMaterial } from '../../entities/material.entity';

export class UpdateEstadoMaterialDto {
  @ApiProperty({ enum: EstadoMaterial })
  @IsEnum(EstadoMaterial)
  @IsNotEmpty()
  estado: EstadoMaterial;
}
