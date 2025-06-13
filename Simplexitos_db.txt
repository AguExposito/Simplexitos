CREATE TYPE estado_comun AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE estado_oc    AS ENUM ('ABIERTA','RECIBIDA','CANCELADA');

CREATE TABLE proveedor (
  id_proveedor                  SERIAL PRIMARY KEY,
  nombreproveedor               VARCHAR(100) NOT NULL,
  estadoproveedor               estado_comun DEFAULT 'ACTIVO',
  fechaaltaproveedor            DATE DEFAULT CURRENT_DATE,
  fechabajaproveedor            DATE,
  fechamodificacionproveedor    DATE DEFAULT CURRENT_DATE
);

CREATE TABLE producto (
  id_producto                   SERIAL PRIMARY KEY,
  codproducto                   INTEGER UNIQUE NOT NULL,
  nombreproducto                VARCHAR(100) NOT NULL,
  modeloproducto                VARCHAR(100),
  descripcionproducto           VARCHAR(300),
  estadoproducto                estado_comun DEFAULT 'ACTIVO',
  fechaaltaproducto             DATE DEFAULT CURRENT_DATE,
  fechabajaproducto             DATE,
  fechamodificacionproducto     DATE DEFAULT CURRENT_DATE
);

CREATE TABLE proveedor_producto (
  id_proveedorproducto          SERIAL PRIMARY KEY,
  id_producto                   INT REFERENCES producto(id_producto),
  id_proveedor                  INT REFERENCES proveedor(id_proveedor),
  costototal                    DOUBLE PRECISION NOT NULL,
  costoporunidad                DOUBLE PRECISION NOT NULL,
  tiempodeenvio                 INT NOT NULL,          
  costodeposito                 DOUBLE PRECISION,
  fechamodificacion             DATE DEFAULT CURRENT_DATE,
  UNIQUE (id_producto, id_proveedor)
);

CREATE TABLE inventario (
    id_inventario                   SERIAL PRIMARY KEY,
    id_producto                     INT NOT NULL REFERENCES producto(id_producto),
    cantidadenstock                 INT NOT NULL,
    nombreinventario                VARCHAR(100),
    costodepositoinventario         DOUBLE PRECISION,
    costoventa                      DOUBLE PRECISION,
    costopedido                     DOUBLE PRECISION,
    puntopedido                     INT NOT NULL,
    modeloinventario                VARCHAR(50),
    cgi                             DOUBLE PRECISION,
    frecuenciadereabastecimiento    INT,
    fechaaltainventario             DATE DEFAULT CURRENT_DATE,
    fechamodificacioninventario     DATE DEFAULT CURRENT_DATE
);

CREATE TABLE venta (
    id_venta                    SERIAL PRIMARY KEY,
    id_producto                 INT  NOT NULL REFERENCES producto(id_producto),
    cantidaddeventa             INT,
    fechaaltaventa              DATE DEFAULT CURRENT_DATE,
    fechamodificacionventa      DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS Ordendecompra
(
    id_ordendecompra integer NOT NULL DEFAULT PRIMARY KEY,
    descripcionordendecompra character varying(255) COLLATE pg_catalog."default",
    estadoordendecompra character varying(50) COLLATE pg_catalog."default",
    id_inventario integer,
    id_proveedor integer,
    fechaaltaordendecompra date,
    fechamodificacionordendecompra date,
    CONSTRAINT ordendecompra_pkey PRIMARY KEY (id_ordendecompra),
    CONSTRAINT ordendecompra_id_inventario_fkey FOREIGN KEY (id_inventario)
        REFERENCES public.inventario (id_inventario) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT ordendecompra_id_proveedor_fkey FOREIGN KEY (id_proveedor)
        REFERENCES public.proveedor (id_proveedor) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);
CREATE TABLE orden_compra (
    id_orden_compra                 SERIAL PRIMARY KEY,
    id_inventario                   INT NOT NULL REFERENCES inventario(id_inventario),
    id_proveedor                    INT NOT NULL REFERENCES proveedor(id_proveedor),
    descripcionordendecompra        VARCHAR(255),
    estadoordendecompra             estado_oc DEFAULT 'ABIERTA',
    fechaaltaordendecompra          DATE DEFAULT CURRENT_DATE,
    fechamodificacionordendecompra  DATE DEFAULT CURRENT_DATE
);