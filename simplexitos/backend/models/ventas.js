import {DataTypes} from 'sequelize'
import db from '../db/connection.js'
import inventario from './inventario.js'
import demandahistorica from './demanda.js'


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

venta.belongsTo(demandahistorica,{
    foreignKey: 'iddemanda',
});

demandahistorica.hasMany(venta,{
    foreignKey:'iddemanda',
});

export default venta