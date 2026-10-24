export type Rol = 'admin' | 'proveedor' | 'ciudadano'

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: 'Administración',
  proveedor: 'Proveedor',
  ciudadano: 'Ciudadanía',
}

export interface Usuario {
  email: string
  nombre: string
  rol: Rol
}
