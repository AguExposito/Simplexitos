import { DataTypes } from "sequelize";
import db from "../db/connection.js";
import inventario from "./inventario.js";


const ordencompra = db.define('ordencompra',
    {
        idorden: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, references: {model: 'ordencompra', key: 'idorden',},},
        estadoorden: {type: DataTypes.STRING},
        descripcionordendecompra: {type: DataTypes.STRING},
        fechaorden: {type: DataTypes.DATE},
        cantidadsolicitada: {type: DataTypes.INTEGER}
    },
    {
        timestamps: false,
        tableName:'ordencompra',
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

ordencompra.belongsTo(inventario,{
    foreignKey: 'idinventario'
})

inventario.hasMany(ordencompra,{
    foreignKey: 'idinventario'
})

export default ordencompra