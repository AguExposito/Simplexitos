import { DataTypes } from 'sequelize';
import db from '../db/connection.mjs';
import producto from './producto.mjs';

const venta = db.define('venta', {
    idventa: {
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
    cantidadventa: {
        type: DataTypes.INTEGER
    },
    preciototal: {
        type: DataTypes.DOUBLE
    },
    fechaaltaventa: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'venta'
});

venta.belongsTo(producto, {
    foreignKey: 'idproducto'
});

export default venta; 