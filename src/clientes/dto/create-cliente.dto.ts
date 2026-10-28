import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cuit?: string;

  @ApiProperty({ required: false, description: 'Condición frente al IVA (define el tipo de comprobante)' })
  @IsString()
  @IsOptional()
  condicionIva?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  domicilio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
