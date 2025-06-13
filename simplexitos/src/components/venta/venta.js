import React, { useState, useEffect } from "react";
import axios from "axios";
import serverFront from "../../apiConfig";

const Venta = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editandoVenta, setEditandoVenta] = useState(null);
  const [mostrarVentas, setMostrarVentas] = useState(false);

  const [idArticulo, setIdArticulo] = useState("");
  const [cantidadVenta, setCantidadVenta] = useState("");

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = () => {
    setLoading(true);
    setError(null);
    axios.get(`${serverFront}/ventas`)
      .then(response => {
        setVentas(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching the sales:', error);
        setError('Error fetching the sales');
        setLoading(false);
      });
  };

  const handleCargarVenta = () => {
    const data = {
      idArticulo: parseInt(idArticulo), // Asegúrate de convertir el valor a número
      cantidadVenta: parseInt(cantidadVenta) // Asegúrate de convertir el valor a número
    };

    axios.post(`${serverFront}/cargar-venta`, data)
      .then(response => {
        console.log(response.data);
        fetchVentas(); // Refresh the list after loading the sale
      })
      .catch(error => {
        console.error('Error loading the sale:', error);
        setError('Error loading the sale');
      });
  };

  const editarVenta = async (id, ventaActualizada) => {
    try {
      await axios.patch(`${serverFront}/editar-venta/${id}`, ventaActualizada);
      fetchVentas();
      setEditandoVenta(null); // Limpiar el estado de edición
    } catch (error) {
      console.error('Error editing sale:', error);
      setError('Error editing the sale');
    }
  };

  const eliminarVenta = async (id) => {
    try {
      await axios.delete(`${serverFront}/borrar-venta/${id}`);
      fetchVentas();
    } catch (error) {
      console.error('Error deleting sale:', error);
      setError('Error deleting the sale');
    }
  };

  const iniciarEdicion = (venta) => {
    setEditandoVenta(venta);
  };

  const cancelarEdicion = () => {
    setEditandoVenta(null);
  };

  const toggleMostrarVentas = () => {
    setMostrarVentas(!mostrarVentas);
  };

  return (
    <div>
      <h1>Lista de Ventas</h1>
      <button onClick={toggleMostrarVentas}>
        {mostrarVentas ? "Ocultar Ventas" : "Mostrar Ventas"}
      </button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {mostrarVentas && (
        <ul>
          {ventas.map(venta => (
            <li key={venta.idventa}>
              <p><strong>ID: </strong>{venta.idventa}</p>
              <p><strong>Cantidad: </strong>{venta.cantidadventa}</p>
              <p><strong>Precio Total: </strong>{venta.preciototal}</p>
              <button onClick={() => iniciarEdicion(venta)}>Editar</button>
              <button onClick={() => eliminarVenta(venta.idventa)}>Eliminar</button>
              {editandoVenta && editandoVenta.idventa === venta.idventa && (
                <div>
                  <h3>Editar venta con ID: {venta.idventa}</h3>
                  <input
                    type="number"
                    name="cantidadventa"
                    placeholder="Nueva cantidad"
                    value={editandoVenta.cantidadventa}
                    onChange={(e) => setEditandoVenta({
                      ...editandoVenta,
                      cantidadventa: e.target.value
                    })}
                  />
                  <input
                    type="number"
                    name="preciototal"
                    placeholder="Nuevo precio total"
                    value={editandoVenta.preciototal}
                    onChange={(e) => setEditandoVenta({
                      ...editandoVenta,
                      preciototal: e.target.value
                    })}
                  />
                  <button onClick={() => editarVenta(editandoVenta.idventa, editandoVenta)}>Guardar Cambios</button>
                  <button onClick={cancelarEdicion}>Cancelar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div>
        <h2>Cargar Venta</h2>
        <form>
          <label>
            ID del Artículo:
            <input type="number" value={idArticulo} onChange={(e) => setIdArticulo(e.target.value)} />
          </label>
          <br />
          <label>
            Cantidad de Venta:
            <input type="number" value={cantidadVenta} onChange={(e) => setCantidadVenta(e.target.value)} />
          </label>
          <br />
          <button type="button" onClick={handleCargarVenta}>Cargar Venta</button>
        </form>
      </div>
    </div>
  );
};

export default Ventas;
