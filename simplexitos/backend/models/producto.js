import { DataTypes } from 'sequelize';
import db from '../db/connection.js';

const producto = db.define('producto', {
    idproducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codproducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    nombreproducto: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    modeloproducto: {
        type: DataTypes.STRING(100)
    },
    descripcionproducto: {
        type: DataTypes.STRING(300)
    },
    estadoproducto: {
        type: DataTypes.ENUM('ACTIVO', 'INACTIVO'),
        defaultValue: 'ACTIVO'
    },
    fechaaltaproducto: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fechabajaproducto: {
        type: DataTypes.DATE
    },
    fechamodificacionproducto: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'producto',
    timestamps: false
});

export default producto; 