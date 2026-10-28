import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { EstadoCaja } from '../../entities/caja-puesto.entity';

export class FilterCajaDto {
  @ApiProperty({ enum: EstadoCaja, required: false })
  @IsEnum(EstadoCaja)
  @IsOptional()
  estado?: EstadoCaja;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}
