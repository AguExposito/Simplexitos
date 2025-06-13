import { DataTypes } from 'sequelize';
import db from '../db/connection.js';

const Productos = db.define('productos', {
    idproductos: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    codigoproducto: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    nombreproducto: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcionproducto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default productos;
