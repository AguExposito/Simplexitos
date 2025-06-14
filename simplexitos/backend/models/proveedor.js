import { DataTypes } from "sequelize";
import db from "../db/connection.js";

const proveedor = db.define('proveedor', {
    idproveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreprove: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    cuit: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    localidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fechaaltaproveedor: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'proveedor'
});

export default proveedor;
