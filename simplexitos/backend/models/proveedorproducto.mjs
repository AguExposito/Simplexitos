import { DataTypes } from "sequelize";
import db from "../db/connection.mjs";
import proveedor from "./proveedor.mjs";
import producto from "./producto.mjs";

const proveedorproducto = db.define('proveedor_producto', {
    idproveedorproducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idproducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'producto',
            key: 'idproducto'
        }
    },
    idproveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'proveedor',
            key: 'idproveedor'
        }
    },
    costopedido: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    costocompra: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    preciounitario: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    tiempoenvio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    costoalmacenamiento: {
        type: DataTypes.DOUBLE
    },
    frecuenciadereabastecimiento: {
        type: DataTypes.INTEGER
    }
}, {
    timestamps: false,
    tableName: 'proveedor_producto'
});

proveedorproducto.belongsTo(proveedor, {
    foreignKey: 'idproveedor'
});

proveedorproducto.belongsTo(producto, {
    foreignKey: 'idproducto'
});

export default proveedorproducto; 