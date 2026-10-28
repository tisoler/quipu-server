export enum TipoMovimiento {
    VENTA = 'venta',
    COMPRA = 'compra',
    CONSUMO = 'consumo',
    PRODUCCION = 'produccion',
    TRANSFERENCIA = 'transferencia',
}

export enum TipoArticulo {
    PRODUCTO = 'producto',
    MATERIAL = 'material',
}

export enum EstadoMovimiento {
    ACTIVO = 'activo',
    ELIMINADO = 'eliminado',
}

export enum TipoPago {
    TARJETA_CREDITO = 'tarjeta-credito',
    TARJETA_DEBITO = 'tarjeta-debito',
    EFECTIVO = 'efectivo',
    TRANSFERENCIA_QR = 'transferencia-qr',
    CUENTA_CORRIENTE = 'cuenta-corriente',
}
