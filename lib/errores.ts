/** Error con código HTTP, pensado para mostrarse tal cual al usuario. */
export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ErrorApi'
  }
}

/** La base (o la API) no respondió. Es la única falla que habilita el respaldo con datos mock en desarrollo. */
export class ErrorConexion extends Error {
  constructor(message = 'No se pudo conectar con la base de datos') {
    super(message)
    this.name = 'ErrorConexion'
  }
}
