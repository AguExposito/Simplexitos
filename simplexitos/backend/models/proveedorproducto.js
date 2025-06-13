import { DataTypes } from "sequelize";
import db from "../db/connection.js";
import productos from "./productos.js";
import proveedores from "./proveedor.js"

const proveedorproducto = db.define('proveedorproducto',
    {
        idproveedorproducto:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, references: {model: 'proveedorproducto', key: 'idproveedorproducto',},},
        costopedido: {type: DataTypes.DOUBLE},
        costoalmacenamiento: {type: DataTypes.DOUBLE},
        preciounitario: {type: DataTypes.DOUBLE},
        tiempoenvio: {type: DataTypes.INTEGER}
    },
    {
        timestamps: false,
        tableName: 'proveedorproducto',
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] } // Excluir por defecto
        },
        scopes: {
            withTimestamps: {
                attributes: { include: ['createdAt', 'updatedAt'] } // Incluir si se especifica
            }
        }
    },
)

proveedorproducto.belongsTo(productos,{
    foreignKey: 'idproducto'
})
productos.hasMany(proveedorproducto,{
    foreignKey: 'idproducto'
})

proveedorproducto.belongsTo(proveedores,{
    foreignKey: 'idproveedor'
})

proveedores.hasMany(proveedorproducto,{
    foreignKey: 'idproveedor'
})

export default proveedorproducto