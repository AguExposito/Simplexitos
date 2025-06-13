import { DataTypes } from "sequelize";
import db from "../db/connection.js";

const proveedores = db.define('proveedores', {
    idproveedor:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, references: {model: 'proveedores', key:'idproveedor',},},
    cuit: {type: DataTypes.INTEGER},
    nombreprove: {type: DataTypes.STRING},
    localidad: {type: DataTypes.STRING},
    fechaaltaproveedor: {type: DataTypes.DATE}
},
{
    timestamps:false,
    tableName:'proveedores',
});

export default proveedores;
