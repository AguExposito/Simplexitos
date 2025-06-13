import { DataTypes } from 'sequelize';
import db from '../db/connection.js';

const inventario = db.define('inventario', {
    idinventario: {
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
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    demanda: {
        type: DataTypes.DOUBLE
    },
    costoalmacenamiento: {
        type: DataTypes.DOUBLE
    },
    costocompra: {
        type: DataTypes.DOUBLE
    },
    costopedido: {
        type: DataTypes.DOUBLE
    },
    puntopedido: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stockseguridad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    loteoptimo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    modeloinventario: {
        type: DataTypes.STRING(50)
    },
    cgi: {
        type: DataTypes.DOUBLE
    },
    frecuenciadereabastecimiento: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'inventario',
    timestamps: false
});

export default inventario;