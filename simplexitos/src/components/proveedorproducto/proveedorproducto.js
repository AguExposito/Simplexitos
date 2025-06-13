import React, { useState, useEffect } from "react";
import axios from "axios";
import serverFront from "../../apiConfig";


const ProveedorProducto = () => {
    const [proveedorarticulo,setProveedorArticulo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mostrarProveedorArticulo, setMostrarProveedorArticulo] = useState(false)

useEffect(() => {
    fetchProveedorArticulo();
}, []);

    const fetchProveedorArticulo = () => {
        setLoading(true);
        setError(null);
        axios.get(`${serverFront}/proveedorarticulo`)
          .then(response => {
            setProveedorArticulo(response.data);
            setLoading(false);
            setMostrarProveedorArticulo(true);
          })
          .catch(error => {
            console.error('Error fetching the pronostico:', error);
            setError('Error fetching the pronostico');
            setLoading(false);
          });
      };

     const toggleMostrarProveedorArticulo = () => {
    if (mostrarProveedorArticulo) {
      setProveedorArticulo([]);
    } else {
      fetchProveedorArticulo();
    }
    setMostrarProveedorArticulo(!mostrarProveedorArticulo);
  };
  return (
    <div>
    <h1>Lista de ProveedroArticulo</h1>
    <button onClick={toggleMostrarProveedorArticulo}>
        {mostrarProveedorArticulo ? "Ocultar ProveedorArticulo" : "Mostrar ProveedorArticulo"}
    </button>
    {loading && <p>Cargando...</p>}
    {error && <p>{error}</p>}
    {mostrarProveedorArticulo && (
        <>
            <ul>
                {proveedorarticulo.map(proveearti => (
                    <li key={proveearti.idproveedorarticulo}>
                        <p><strong>ID: </strong>{proveearti.idproveedorarticulo}</p>
                        <p><strong>ID Articulo: </strong>{proveearti.idarticulos}</p>
                        <p><strong>ID Proveedor: </strong>{proveearti.idproveedor}</p>
                        <p><strong>Costo Pedido: </strong>{proveearti.costopedido}</p>
                        <p><strong>Costo Almacenamiento: </strong>{proveearti.costoalmacenamiento}</p>
                        <p><strong>Precio unitario Articulo: </strong>{proveearti.preciounitario}</p>
                        <p><strong>Tiempo envio Proveedor: </strong>{proveearti.tiempoenvio}</p>
                    </li>
                ))}
            </ul>
        </>
    )}
    </div>
    );
};

export default ProveedorProducto