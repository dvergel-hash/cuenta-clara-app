import { z } from 'zod'

const numero = (msg = 'Ingresá un número válido') => z.number(msg)

export const CATEGORIAS_OBSERVACION = ['precio', 'proveedor', 'especificaciones', 'plazo', 'otra'] as const

const opcional = (s: z.ZodString) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), s.optional())

export const observacionSchema = z.object({
  licitacion_id: z.string().trim().min(1, 'Elegí la licitación que querés observar'),
  categoria: z.enum(CATEGORIAS_OBSERVACION, 'Elegí una categoría'),
  descripcion: z
    .string()
    .trim()
    .min(30, 'Contá un poco más: al menos 30 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  evidencia_url: opcional(
    z
      .string()
      .trim()
      .url('Ingresá un enlace válido')
      .regex(/^https?:\/\//, 'El enlace debe empezar con http:// o https://'),
  ),
  contacto: opcional(z.string().trim().max(120, 'Máximo 120 caracteres')),
  acepta_publicacion: z.literal(true, 'Necesitamos tu aceptación para poder publicarla'),
  /** Honeypot: invisible para personas; si llega con contenido, el envío se descarta en silencio. */
  sitio_web: z.string().optional(),
})

export type ObservacionInput = z.infer<typeof observacionSchema>

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
