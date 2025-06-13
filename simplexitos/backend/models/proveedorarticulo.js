import { DataTypes } from "sequelize";
import db from "../db/connection.js";
import Articulos from "./articulos.js";
import proveedores from "./proveedor.js"

const proveedorarticulo = db.define('proveedorarticulo',
    {
        idproveedorarticulo:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, references: {model: 'proveedorarticulo', key: 'idproveedorarticulo',},},
        costopedido: {type: DataTypes.DOUBLE},
        costoalmacenamiento: {type: DataTypes.DOUBLE},
        preciounitario: {type: DataTypes.DOUBLE},
        tiempoenvio: {type: DataTypes.INTEGER}
    },
    {
        timestamps: false,
        tableName: 'proveedorarticulo',
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

proveedorarticulo.belongsTo(Articulos,{
    foreignKey: 'idarticulos'
})
Articulos.hasMany(proveedorarticulo,{
    foreignKey: 'idarticulos'
})

proveedorarticulo.belongsTo(proveedores,{
    foreignKey: 'idproveedor'
})

proveedores.hasMany(proveedorarticulo,{
    foreignKey: 'idproveedor'
})

export default proveedorarticulo