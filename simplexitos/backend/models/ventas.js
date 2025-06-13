import {DataTypes} from 'sequelize'
import db from '../db/connection.js'
import inventario from './inventario.js'


const venta = db.define('ventas',{
    idventa:{
        type: DataTypes.INTEGER, 
        primaryKey: true, autoIncrement: true, references: {model: 'venta', key:'idventa',},
    },
    cantidadventa: {
        type: DataTypes.INTEGER,
    },
    preciototal: {
        type: DataTypes.FLOAT,
    },
    fechaaltaventa:{
        type: DataTypes.DATE
    }
},
{
    timestamps:false,
    tableName:'venta',
},
)
venta.belongsTo(inventario,{
    foreignKey: 'idinventario',
});

inventario.hasMany(venta,{
    foreignKey: 'idinventario',
});

export default venta