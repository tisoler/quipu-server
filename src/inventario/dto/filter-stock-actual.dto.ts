import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { TipoArticulo } from '../../entities/movimiento.types';
import { Type } from 'class-transformer';

export class FilterStockActualDto {
    @ApiProperty({ enum: TipoArticulo, required: false })
    @IsEnum(TipoArticulo)
    @IsOptional()
    tipoArticulo?: TipoArticulo;

    @ApiProperty({ type: [Number], required: false })
    @IsArray()
    @Type(() => Number)
    @IsOptional()
    idAlmacenes?: number[];

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search?: string;
}
