import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EntornoArca } from '../../entities/credenciales-arca.entity';

export class GuardarCredencialesArcaDto {
  @ApiProperty({ enum: EntornoArca })
  @IsEnum(EntornoArca)
  @IsNotEmpty()
  entorno: EntornoArca;

  @ApiProperty({ description: 'Certificado (.crt/.pem) en texto PEM' })
  @IsString()
  @IsNotEmpty()
  certificado: string;

  @ApiProperty({ description: 'Clave privada (.key) en texto PEM' })
  @IsString()
  @IsNotEmpty()
  clavePrivada: string;
}

export class ProbarConexionDto {
  @ApiProperty({ required: false, enum: EntornoArca })
  @IsEnum(EntornoArca)
  @IsOptional()
  entorno?: EntornoArca;
}
