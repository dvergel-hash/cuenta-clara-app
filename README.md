# Cuenta Clara

Plataforma de trazabilidad de compras públicas: licitaciones, ofertas selladas, precios de referencia, presupuesto y un registro de decisiones encadenado con hashes que cualquiera puede verificar.

**Demo:** https://cuenta-clara-app-six.vercel.app/  
**Track:** Social & Sector Público

## El problema

La información de las compras públicas puede existir, pero encontrarla, compararla y convertirla en conclusiones útiles es difícil. Cuenta Clara conecta licitaciones, presupuesto y proveedores para detectar desvíos y señales que merecen revisión, y deja cada decisión registrada de forma verificable.

## Qué hace

- **Licitaciones:** listado con resumen, búsqueda, filtros combinables, orden, paginación y exportación a CSV. Detalle con ofertas, dictamen, señales de alerta e historial.
- **Ofertas selladas:** mientras una licitación está abierta solo se informa la cantidad de ofertas; montos y proveedores se publican al cierre.
- **Registro verificable:** cada decisión se encadena con el hash de la anterior (SHA-256). La pantalla de detalle permite verificar la integridad de la cadena.
- **Señales de alerta** calculadas sobre los datos: concentración de proveedores, oferta única, fraccionamiento y proveedor nuevo.
- **Presupuesto y mapa:** ejecución y proyección por partida, desglose entre estimado, ofertado y adjudicado, y mapa de desvíos.
- **Control ciudadano:** cualquier persona puede observar una compra de forma anónima; cada observación se revisa antes de publicarse.

## Uso de IA

- **Síntesis con IA (funciona):** en el detalle de una licitación cerrada, la administración puede generar una síntesis con un modelo de lenguaje (vía OpenRouter). El agente recibe solo datos ya públicos (ofertas, referencia, desvío y señales), tiene instrucciones de no recomendar aprobar o rechazar, y el resultado se marca como generado por IA.
- **Agentes y flujos (configuración de demostración):** la pantalla `/agentes` muestra dónde se configurarían los agentes de búsqueda de precios por canal (modelo, prompt, fuentes) y los parámetros del flujo. Esa pantalla **no ejecuta agentes ni guarda cambios**; las búsquedas de agentes que se ven en cada licitación son datos de ejemplo.

## Cuentas de demostración

El acceso es de demostración, no autenticación de producción (usuarios fijos y cookie firmada).

| Rol | Correo | Clave | Puede |
|---|---|---|---|
| Administración | `admin@cuentaclara.demo` | `cuentaclara` | Crear y cerrar licitaciones, ver `/agentes`, generar síntesis con IA |
| Proveedor | `proveedor@cuentaclara.demo` | `cuentaclara` | Cotizar desde el portal |
| Ciudadanía | `ciudadano@cuentaclara.demo` | `cuentaclara` | Rol de demostración; observar una compra no requiere ingresar |

La consulta pública (licitaciones, presupuesto, mapa, proveedores) no requiere ingresar. Los datos de la demo son sintéticos.

## Stack

Next.js (App Router), React 19, Tailwind CSS 4, Postgres en Neon, Leaflet para el mapa y Zod para validar.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (Neon). Esquema en `db/schema.sql`. |
| `SEED_TOKEN` | Protege `POST /api/seed`, que carga los datos de ejemplo. |
| `OPENROUTER_API_KEY` | Habilita la síntesis con IA. Sin ella el botón muestra un aviso. |
| `OPENROUTER_MODEL` | Modelo a usar (por defecto `anthropic/claude-sonnet-4.5`). |
| `DEMO_PASSWORD`, `SESSION_SECRET` | Opcionales: clave de las cuentas de demo y secreto de la cookie. Tienen valores por defecto públicos, solo aptos para demostración. |

## Desarrollo

```bash
pnpm install
pnpm dev
```

Sin `DATABASE_URL`, en desarrollo se usan datos sintéticos locales.

## Limitaciones conocidas

- El login es de demostración.
- La pantalla de agentes es una vista de configuración, no un orquestador.
- El sistema todavía no registra qué persona ejecutó cada acción.
- No hay carga de documentación adjunta del pliego.
