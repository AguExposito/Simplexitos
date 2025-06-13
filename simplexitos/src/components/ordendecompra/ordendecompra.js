import React, { useState, useEffect } from "react";
import axios from "axios";
import serverFront from "../../apiConfig";

const Ordendecompra = () => {
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarOrdenesCompra, setMostrarOrdenesCompra] = useState(false);
  const [editandoOrdenCompra, setEditandoOrdenCompra] = useState(null);
  const [idArticulo, setIdArticulo] = useState('');
  const [proveedoresAsociados, setProveedoresAsociados] = useState([]);
  const [idProveedor, setIdProveedor] = useState('');
  const [cantidadSolicitada, setCantidadSolicitada] = useState('');

  useEffect(() => {
    fetchOrdenesCompra();
  }, []);

  const fetchOrdenesCompra = () => {
    setLoading(true);
    setError(null);
    axios.get(`${serverFront}/ordenCompra`)
      .then(response => {
        setOrdenesCompra(response.data);
        setLoading(false);
        setMostrarOrdenesCompra(true);
      })
      .catch(error => {
        console.error('Error fetching the orders:', error);
        setError('Error fetching the orders');
        setLoading(false);
      });
  };

  const fetchProveedoresAsociados = (idArticulo) => {
    setLoading(true);
    setError(null);
    axios.get(`${serverFront}/proveedor-asociado-articulo/${idArticulo}`)
      .then(response => {
        setProveedoresAsociados(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching associated providers:', error);
        setError('Error fetching associated providers');
        setLoading(false);
      });
  };

  const cargarOrdenCompra = () => {
    const nuevaOrden = {
      idArticulo,
      idProveedor,
      cantidadSolicitada
    };
    axios.post(`${serverFront}/cargar-orden`, nuevaOrden)
      .then(response => {
        fetchOrdenesCompra();
        setIdArticulo('');
        setIdProveedor('');
        setCantidadSolicitada('');
      })
      .catch(error => {
        console.error('Error cargando orden de compra:', error);
        setError('Error cargando orden de compra');
      });
  };

  const confirmarOrdenCompra = (idorden) => {
    axios.post(`${serverFront}/confirmar-ordencompra/${idorden}`)
      .then(response => {
        fetchOrdenesCompra();
      })
      .catch(error => {
        console.error('Error confirming the purchase order:', error);
        setError('Error confirming the purchase order');
      });
  };

  const toggleMostrarOrdenesCompra = () => {
    if (mostrarOrdenesCompra) {
      setOrdenesCompra([]);
    } else {
      fetchOrdenesCompra();
    }
    setMostrarOrdenesCompra(!mostrarOrdenesCompra);
  };

  const handleChangeEditandoOrdenCompra = (e) => {
    const { name, value } = e.target;
    setEditandoOrdenCompra(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const editarOrdenCompra = async (id, ordenCompraActualizada) => {
    try {
      await axios.put(`${serverFront}/editar-ordencompra/${id}`, ordenCompraActualizada);
      const index = ordenesCompra.findIndex(orden => orden.idorden === id);
      const nuevasOrdenes = [...ordenesCompra];
      nuevasOrdenes[index] = { ...nuevasOrdenes[index], ...ordenCompraActualizada };
      setOrdenesCompra(nuevasOrdenes);
      setEditandoOrdenCompra(null);
    } catch (error) {
      console.error('Error editando orden de compra:', error);
      setError('Error editando la orden de compra');
    }
  };

  const eliminarOrdenCompra = async (id) => {
    try {
      await axios.delete(`${serverFront}/eliminar-ordencompra/${id}`);
      setOrdenesCompra(ordenesCompra.filter(orden => orden.idorden !== id));
    } catch (error) {
      console.error('Error eliminando orden de compra:', error);
      setError('Error eliminando la orden de compra');
    }
  };

  const iniciarEdicion = (orden) => {
    setEditandoOrdenCompra(orden);
  };

  const cancelarEdicion = () => {
    setEditandoOrdenCompra(null);
  };

  return (
    <div>
      <h1>Lista de Ordenes de Compra</h1>
      <button onClick={toggleMostrarOrdenesCompra}>
        {mostrarOrdenesCompra ? "Ocultar Ordenes de Compra" : "Mostrar Ordenes de Compra"}
      </button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      <div>
        <h2>Cargar Nueva Orden de Compra</h2>
        <input
          type="number"
          placeholder="ID del Artículo"
          value={idArticulo}
          onChange={(e) => setIdArticulo(e.target.value)}
        />
        <button onClick={() => fetchProveedoresAsociados(idArticulo)}>Buscar Proveedores Asociados</button>
        {proveedoresAsociados.length > 0 && (
          <>
            <h3>Proveedores Asociados</h3>
            <select
              value={idProveedor}
              onChange={(e) => setIdProveedor(e.target.value)}
            >
              <option value="">Seleccione un proveedor</option>
              {proveedoresAsociados.map(pa => (
                <option key={pa.id} value={pa.id}>
                  {pa.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cantidad Solicitada"
              value={cantidadSolicitada}
              onChange={(e) => setCantidadSolicitada(e.target.value)}
            />
            <button onClick={cargarOrdenCompra}>Cargar Orden de Compra</button>
          </>
        )}
      </div>
      {mostrarOrdenesCompra && (
        <>
          <ul>
            {ordenesCompra.map(orden => (
              <li key={orden.idorden}>
                <p><strong>ID: </strong>{orden.idorden}</p>
                <p><strong>Estado: </strong>{orden.estadoorden}</p>
                <p><strong>Fecha: </strong>{orden.fechaorden}</p>
                <p><strong>Cantidad Solicitada: </strong>{orden.cantidadsolicitada}</p>
                <button onClick={() => iniciarEdicion(orden)}>Editar</button>
                <button onClick={() => eliminarOrdenCompra(orden.idorden)}>Eliminar</button>
                {orden.estadoorden === 'Pendiente' && (
                  <button onClick={() => confirmarOrdenCompra(orden.idorden)}>Confirmar</button>
                )}
                {editandoOrdenCompra && editandoOrdenCompra.idorden === orden.idorden && (
                  <div>
                    <h3>Editar orden de compra con ID: {orden.idorden}</h3>
                    <input
                      type="text"
                      name="estadoorden"
                      placeholder="Nuevo estado"
                      value={editandoOrdenCompra.estadoorden}
                      onChange={handleChangeEditandoOrdenCompra}
                    />
                    <input
                      type="date"
                      name="fechaorden"
                      placeholder="Nueva fecha"
                      value={editandoOrdenCompra.fechaorden}
                      onChange={handleChangeEditandoOrdenCompra}
                    />
                    <input
                      type="number"
                      name="cantidadsolicitada"
                      placeholder="Nueva cantidad solicitada"
                      value={editandoOrdenCompra.cantidadsolicitada}
                      onChange={handleChangeEditandoOrdenCompra}
                    />
                    <button onClick={() => editarOrdenCompra(editandoOrdenCompra.idorden, editandoOrdenCompra)}>Guardar Cambios</button>
                    <button onClick={cancelarEdicion}>Cancelar</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Ordendecompra;
