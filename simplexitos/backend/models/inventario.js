import { DataTypes } from 'sequelize';
import db from "../db/connection.js";
import productos from "./productos.js";


const inventario = db.define('inventario',
    {
        idinventario:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, references: {model: 'inventario', key: 'idinventario',},},
        stock: {type: DataTypes.INTEGER},
        frecuenciadereabastecimiento: {type: DataTypes.INTEGER},
        costocompra: {type: DataTypes.DOUBLE},
        costopedido: {type: DataTypes.DOUBLE},
        costoalmacenamiento: {type: DataTypes.DOUBLE},
        demanda: {type: DataTypes.DOUBLE},
        cgi: {type: DataTypes.DOUBLE},
        loteoptimo: {type: DataTypes.DOUBLE},
        stockseguridad: {type: DataTypes.DOUBLE},
        puntopedido: {type: DataTypes.DOUBLE},
        modeloinventario: {type: DataTypes.STRING}
    },
    {
        timestamps: false,
        tableName:'inventario',
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

inventario.belongsTo(productos,{
    foreignKey: 'idproducto'
})

productos.hasMany(inventario,{
    foreignKey: 'idproducto'
})

export default inventario