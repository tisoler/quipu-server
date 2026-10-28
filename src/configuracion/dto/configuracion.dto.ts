import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEmpresaFiscalDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razonSocial?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  localidad?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cuit?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  condicionIva?: string;

  @ApiProperty({ required: false, description: 'Fecha de inicio de actividades (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  fechaInicioActividades?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  iibb?: string;
}

export class CreatePuntoVentaDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  numero: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  predeterminado?: boolean;
}

export class UpdatePuntoVentaDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  numero?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  predeterminado?: boolean;
}
