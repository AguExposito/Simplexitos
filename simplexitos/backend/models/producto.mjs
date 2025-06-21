import { DataTypes } from 'sequelize';
import db from '../db/connection.mjs';

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
        type: DataTypes.ENUM('LOTE_FIJO', 'PERIODO_FIJO'),
        defaultValue: 'LOTE_FIJO'
    },
    descripcionproducto: {
        type: DataTypes.STRING(300)
    },
    costoalmacenamiento: {
        type: DataTypes.DOUBLE
    },
    demanda: {
        type: DataTypes.DOUBLE
    },
    desviacionestandardemanda: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    stockseguridad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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