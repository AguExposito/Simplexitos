import { DataTypes } from "sequelize";
import db from "../db/connection.js";
import inventario from "./inventario.js";
import proveedor from "./proveedor.js";

const ordencompra = db.define('orden_compra',
    {
        idorden_compra: {
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true
        },
        idinventario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'inventario',
                key: 'idinventario'
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
        descripcionordendecompra: {
            type: DataTypes.STRING(255)
        },
        estadoorden: {
            type: DataTypes.ENUM('ABIERTA', 'RECIBIDA', 'CANCELADA'),
            defaultValue: 'ABIERTA'
        },
        cantidadsolicitada: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        fechaorden: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        tableName: 'orden_compra'
    }
);

ordencompra.belongsTo(inventario, {
    foreignKey: 'idinventario'
});

ordencompra.belongsTo(proveedor, {
    foreignKey: 'idproveedor'
});

export default ordencompra;