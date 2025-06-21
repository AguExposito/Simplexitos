CREATE TYPE estado_comun AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_oc    AS ENUM ('ABIERTA','RECIBIDA','CANCELADA');
CREATE TYPE tipo_modelo  AS ENUM ('LOTE_FIJO','PERIODO_FIJO');

CREATE TABLE proveedor (
  idproveedor                   SERIAL PRIMARY KEY,
  nombreprove                   VARCHAR(100) NOT NULL,
  cuit                          INT NOT NULL,
  localidad                     INT NOT NULL,
  fechaaltaproveedor            DATE DEFAULT CURRENT_DATE
);

CREATE TABLE producto (
  idproducto                    SERIAL PRIMARY KEY,
  codproducto                   INTEGER UNIQUE NOT NULL,
  nombreproducto                VARCHAR(100) NOT NULL,
  modeloproducto                tipo_modelo DEFAULT 'LOTE_FIJO',
  descripcionproducto           VARCHAR(300),        
  costoalmacenamiento           DOUBLE PRECISION,
  demanda                       DOUBLE PRECISION,
  stockseguridad                INT NOT NULL,
  estadoproducto                estado_comun DEFAULT 'ACTIVO',
  fechaaltaproducto             DATE DEFAULT CURRENT_DATE,
  fechabajaproducto             DATE,
  fechamodificacionproducto     DATE DEFAULT CURRENT_DATE
);

CREATE TABLE proveedor_producto (
  idproveedorproducto           SERIAL PRIMARY KEY,
  idproducto                    INT REFERENCES producto(idproducto),
  idproveedor                   INT REFERENCES proveedor(idproveedor),
  costopedido                   DOUBLE PRECISION NOT NULL,
  costocompra                   DOUBLE PRECISION NOT NULL,
  preciounitario                DOUBLE PRECISION NOT NULL,
  tiempoenvio                   INT NOT NULL,  
  --frecuenciadereabastecimiento  INT,
  UNIQUE (idproducto, idproveedor)
);

CREATE TABLE inventario (
    idinventario                    SERIAL PRIMARY KEY,
    idproducto                      INT NOT NULL REFERENCES producto(idproducto),
    stock                           INT NOT NULL,
    demanda                         DOUBLE PRECISION,
    costoalmacenamiento             DOUBLE PRECISION,
    costocompra                     DOUBLE PRECISION,
    costopedido                     DOUBLE PRECISION,
    puntopedido                     INT NOT NULL,
    stockseguridad                  INT NOT NULL,
    loteoptimo                      INT NOT NULL,
    modeloinventario                tipo_modelo DEFAULT 'LOTE_FIJO',
    cgi                             DOUBLE PRECISION,
    frecuenciadereabastecimiento    INT
);

CREATE TABLE venta (
    idventa                     SERIAL PRIMARY KEY,
    idproducto                  INT  NOT NULL REFERENCES producto(idproducto),
    cantidadventa               INT,
    preciototal                 DOUBLE PRECISION,
    fechaaltaventa              DATE DEFAULT CURRENT_DATE
);

CREATE TABLE orden_compra (
    idorden_compra                  SERIAL PRIMARY KEY,
    idinventario                    INT NOT NULL REFERENCES inventario(idinventario),
    idproveedor                     INT NOT NULL REFERENCES proveedor(idproveedor),
    descripcionordendecompra        VARCHAR(255),
    estadoorden                     estado_oc DEFAULT 'ABIERTA',
    cantidadsolicitada              INT NOT NULL,
    fechaorden                      DATE DEFAULT CURRENT_DATE
);