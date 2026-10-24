-- Esquema de Cuenta Clara (Postgres / Neon).
-- Las fechas que forman parte de un hash (fecha_emision, decisiones.fecha, busquedas.fecha)
-- se guardan como texto ISO para que el valor leído sea idéntico al sellado.

CREATE TABLE IF NOT EXISTS partidas (
  id         text PRIMARY KEY,
  codigo     text NOT NULL UNIQUE,
  nombre     text NOT NULL,
  asignado   double precision NOT NULL CHECK (asignado >= 0),
  ejecutado  double precision NOT NULL DEFAULT 0 CHECK (ejecutado >= 0)
);

CREATE TABLE IF NOT EXISTS proveedores (
  id      text PRIMARY KEY,
  nombre  text NOT NULL,
  cuit    text NOT NULL UNIQUE CHECK (cuit ~ '^[0-9]{11}$'),
  -- Fecha de inscripción del CUIT (YYYY-MM-DD). Alimenta la señal "proveedor nuevo".
  fecha_alta text
);

CREATE TABLE IF NOT EXISTS licitaciones (
  id                       text PRIMARY KEY,
  descripcion              text NOT NULL,
  partida_id               text NOT NULL REFERENCES partidas(id),
  estado                   text NOT NULL DEFAULT 'abierto'
                             CHECK (estado IN ('abierto', 'aprobado', 'observado', 'rechazado')),
  fecha_cierre             text NOT NULL,
  monto_estimado           double precision NOT NULL CHECK (monto_estimado >= 0),
  proveedor_adjudicado_id  text REFERENCES proveedores(id),
  organismo                text,
  rubro                    text
);

-- proveedor_id no referencia proveedores: el portal acepta oferentes aún no registrados.
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                 text PRIMARY KEY,
  hash               text NOT NULL UNIQUE,
  pedido_id          text NOT NULL REFERENCES licitaciones(id),
  proveedor_id       text NOT NULL,
  cuit               text NOT NULL CHECK (cuit ~ '^[0-9]{11}$'),
  fecha_emision      text NOT NULL,
  validez_dias       integer NOT NULL CHECK (validez_dias >= 1),
  moneda             text NOT NULL CHECK (moneda IN ('ARS', 'USD')),
  tipo_cambio_usado  double precision CHECK (tipo_cambio_usado > 0),
  origen             text NOT NULL CHECK (origen IN ('portal', 'agente')),
  fuente             text,
  adjunto_url        text,
  items              jsonb NOT NULL,
  condiciones        jsonb NOT NULL,
  recibida           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cotizaciones_pedido_idx ON cotizaciones (pedido_id);

CREATE TABLE IF NOT EXISTS busquedas (
  id             text PRIMARY KEY,
  pedido_id      text NOT NULL REFERENCES licitaciones(id),
  agente         text NOT NULL,
  fecha          text NOT NULL,
  canal          text NOT NULL CHECK (canal IN ('web', 'correo', 'catalogo', 'mensajeria')),
  consulta       text NOT NULL,
  destino        text,
  resultado      text NOT NULL CHECK (resultado IN ('cotizacion', 'referencia', 'descartada', 'sin_respuesta')),
  precio         double precision,
  cotizacion_id  text,
  nota           text
);

CREATE INDEX IF NOT EXISTS busquedas_pedido_idx ON busquedas (pedido_id);

-- hash_prev UNIQUE garantiza una cadena lineal: dos cierres concurrentes no pueden
-- enlazar con el mismo registro anterior.
CREATE TABLE IF NOT EXISTS decisiones (
  id                     text PRIMARY KEY,
  pedido_id              text NOT NULL UNIQUE REFERENCES licitaciones(id),
  fecha                  text NOT NULL,
  estado                 text NOT NULL CHECK (estado IN ('aprobado', 'observado', 'rechazado')),
  motivo                 text NOT NULL,
  referencia             jsonb NOT NULL,
  saldo_partida_antes    double precision NOT NULL,
  saldo_partida_despues  double precision NOT NULL,
  hash_prev              text NOT NULL UNIQUE,
  hash                   text NOT NULL UNIQUE,
  creada                 timestamptz NOT NULL DEFAULT now()
);

-- Observaciones ciudadanas. La IP nunca se guarda en claro: solo su hash, para el límite de envíos.
CREATE TABLE IF NOT EXISTS observaciones (
  codigo              text PRIMARY KEY CHECK (codigo ~ '^CC-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  licitacion_id       text NOT NULL REFERENCES licitaciones(id),
  categoria           text NOT NULL CHECK (categoria IN ('precio', 'proveedor', 'especificaciones', 'plazo', 'otra')),
  descripcion         text NOT NULL CHECK (char_length(descripcion) BETWEEN 30 AND 2000),
  evidencia_url       text CHECK (evidencia_url ~ '^https?://'),
  contacto            text CHECK (char_length(contacto) <= 120),
  acepta_publicacion  boolean NOT NULL CHECK (acepta_publicacion),
  estado              text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'publicada', 'descartada')),
  ip_hash             text NOT NULL,
  creada              timestamptz NOT NULL DEFAULT now(),
  revisada            timestamptz
);

CREATE INDEX IF NOT EXISTS observaciones_ip_idx ON observaciones (ip_hash, creada);
CREATE INDEX IF NOT EXISTS observaciones_licitacion_idx ON observaciones (licitacion_id, estado);
