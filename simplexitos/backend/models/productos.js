import { DataTypes } from 'sequelize';
import db from '../db/connection.js';

const productos = db.define('productos', {
    idproducto: {
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
    modeloproducto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // estadoproducto: {
    //     type: DataTypes.ENUM,
    //     allowNull: true,
    // },
    fechaaltaproducto: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: false,
});

export default productos;
