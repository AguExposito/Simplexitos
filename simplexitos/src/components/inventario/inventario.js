// Te permite consultar un inventario por ID y ver sus campos.

// Te permite editar y enviar datos actualizados, incluyendo los que se usan para calcular lote óptimo y CGI (que serán calculados en el backend).

// Refleja solo las funcionalidades pedidas en la grilla del maestro de artículos.

import React, { useState } from 'react';
import axios from 'axios';
import { serverFront } from '../../apiConfig';

const Inventario = () => {
    const [showInventory, setShowInventory] = useState(false);
    const [idinventario, setidinventario] = useState('');
    const [inventoryData, setInventoryData] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [formData, setFormData] = useState({
        idinventario: '',
        idproducto: '',
        stock: '',
        demanda: '',
        costoalmacenamiento: '',
        costocompra: '',
        costopedido: '',
        stockseguridad: '',
        modeloinventario: ''
    });
    const [calcMessage, setCalcMessage] = useState('');
    const [calcError, setCalcError] = useState('');

    const handleInputChange = (e) => {
        setidinventario(e.target.value);
    };

    const handleSearch = async () => {
        try {
            const response = await axios.get(`${serverFront}/inventario/${idinventario}`);
            setInventoryData(response.data);
            setSearchError('');
        } catch (err) {
            setSearchError('No se encontró el inventario con el ID proporcionado.');
            setInventoryData(null);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        console.log(formData);
        try {
            await axios.put(`${serverFront}/inventario`, formData);
            setCalcMessage(`Inventario con ID ${formData.idinventario} actualizado con éxito.`);
            setCalcError('');
        } catch (error) {
            setCalcError(error.response?.data?.error || 'Error al actualizar el inventario');
            setCalcMessage('');
        }
    };

    const toggleShowInventory = () => {
        setShowInventory(!showInventory);
        setInventoryData(null);
        setSearchError('');
        setFormData({
            idinventario: '',
            idproducto: '',
            stock: '',
            demanda: '',
            costoalmacenamiento: '',
            costocompra: '',
            costopedido: '',
            stockseguridad: '',
            modeloinventario: ''
        });
        setCalcMessage('');
        setCalcError('');
    };

    return (
        <div>
            <h1>Inventario</h1>
            <button onClick={toggleShowInventory}>
                {showInventory ? "Ocultar Inventario" : "Mostrar Inventario"}
            </button>

            {showInventory && (
                <div className="inventory-container">
                    <div className="inventory-search">
                        <h2>Buscar Inventario</h2>
                        <input 
                            type="text" 
                            placeholder="Ingrese el ID del inventario" 
                            value={idinventario}
                            onChange={handleInputChange}
                        />
                        <button onClick={handleSearch}>Buscar</button>

                        {searchError && <p className="error">{searchError}</p>}

                        {inventoryData && (
                            <div className="inventory-data">
                                <h3>Información del Inventario</h3>
                                <p><strong>ID Inventario:</strong> {inventoryData.idinventario}</p>
                                <p><strong>ID Producto:</strong> {inventoryData.idproducto}</p>
                                <p><strong>Stock:</strong> {inventoryData.stock}</p>
                                <p><strong>Demanda:</strong> {inventoryData.demanda}</p>
                                <p><strong>Modelo de Inventario:</strong> {inventoryData.modeloinventario}</p>
                                <p><strong>Costo de Pedido:</strong> {inventoryData.costopedido}</p>
                                <p><strong>Costo de Depósito:</strong> {inventoryData.costoalmacenamiento}</p>
                                <p><strong>Costo de Venta:</strong> {inventoryData.costocompra}</p>
                                <p><strong>Stock de Seguridad:</strong> {inventoryData.stockseguridad}</p>
                                <p><strong>Punto de Pedido:</strong> {inventoryData.puntopedido}</p>
                                <p><strong>Lote Óptimo:</strong> {inventoryData.loteoptimo}</p>
                                <p><strong>CGI:</strong> {inventoryData.cgi}</p>
                            </div>
                        )}
                    </div>

                    <div className="inventory-calculate">
                        <h2>Actualizar Inventario</h2>
                        <form onSubmit={handleCalculate}>
                            {[
                                { name: "idinventario", label: "ID Inventario" },
                                { name: "idproducto", label: "ID Producto" },
                                { name: "stock", label: "Cantidad en Stock" },
                                { name: "demanda", label: "Demanda Inventario" },
                                { name: "costoalmacenamiento", label: "Costo de Depósito" },
                                { name: "costocompra", label: "Costo de Venta" },
                                { name: "costopedido", label: "Costo de Pedido" },
                                { name: "stockseguridad", label: "Stock de Seguridad" },
                                { name: "modeloinventario", label: "Modelo de Inventario" },
                            ].map(({ name, label }) => (
                                <input
                                    key={name}
                                    type="text"
                                    name={name}
                                    placeholder={label}
                                    value={formData[name]}
                                    onChange={handleFormChange}
                                />
                            ))}
                            <button type="submit">Actualizar Inventario</button>
                        </form>

                        {calcMessage && <p>{calcMessage}</p>}
                        {calcError && <p className="error">{calcError}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;