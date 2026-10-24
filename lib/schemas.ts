import { z } from 'zod'

const numero = (msg = 'Ingresá un número válido') => z.number(msg)

export const itemCotizacionSchema = z.object({
  descripcion: z.string().trim().min(1, 'Describí el ítem'),
  sku_modelo: z.string().trim().optional(),
  cantidad: numero().positive('Debe ser mayor a 0'),
  unidad: z.string().trim().min(1, 'Indicá la unidad'),
  precio_unitario: numero().positive('Debe ser mayor a 0'),
})

export const cotizacionSchema = z
  .object({
    pedido_id: z.string().min(1, 'Seleccioná un pedido abierto'),
    proveedor_id: z.string().min(1),
    cuit: z.string().regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos, sin guiones'),
    fecha_emision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    validez_dias: numero().int('Debe ser un número entero').min(1, 'Mínimo 1 día'),
    moneda: z.enum(['ARS', 'USD']),
    tipo_cambio_usado: numero().positive('Debe ser mayor a 0').optional(),
    origen: z.enum(['portal', 'agente']),
    fuente: z.string().optional(),
    adjunto_url: z.string().optional(),
    items: z.array(itemCotizacionSchema).min(1, 'Agregá al menos un ítem'),
    condiciones: z.object({
      iva_incluido: z.boolean(),
      plazo_entrega_dias: numero().int('Debe ser un número entero').min(0, 'No puede ser negativo'),
      forma_pago: z.string().trim().min(1, 'Indicá la forma de pago'),
      garantia: z.string().trim().min(1, 'Indicá la garantía'),
    }),
  })
  .superRefine((v, ctx) => {
    if (v.moneda === 'USD' && v.tipo_cambio_usado === undefined) {
      ctx.addIssue({ code: 'custom', path: ['tipo_cambio_usado'], message: 'Indicá el tipo de cambio usado' })
    }
  })

export type CotizacionInput = z.infer<typeof cotizacionSchema>
