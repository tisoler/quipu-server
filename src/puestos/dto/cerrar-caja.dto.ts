import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CerrarCajaDto {
  @ApiProperty({ description: 'Dinero contado en caja al momento del arqueo' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  montoDeclarado: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
