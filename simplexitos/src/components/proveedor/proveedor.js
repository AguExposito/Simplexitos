import React, { useState, useEffect } from "react";
import axios from "axios";
import serverFront from "../../apiConfig";

const Proveedor = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarProveedores, setMostrarProveedores] = useState(false);
  const [editandoProveedor, setEditandoProveedor] = useState(null);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    cuit: "",
    nombreprove: "",
    localidad: ""
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = () => {
    setLoading(true);
    setError(null);
    axios.get(`${serverFront}/proveedores`)
      .then(response => {
        console.log(response.data);  // Verifica la estructura de los datos aquí
        setProveedores(Array.isArray(response.data) ? response.data : []); // Asegurarse de que la respuesta sea un array
        setLoading(false);
        setMostrarProveedores(true);
      })
      .catch(error => {
        console.error('Error fetching the providers:', error);
        setError('Error fetching the providers');
        setLoading(false);
      });
  };

  const toggleMostrarProveedores = () => {
    if (mostrarProveedores) {
      setProveedores([]);
    } else {
      fetchProveedores();
    }
    setMostrarProveedores(!mostrarProveedores);
  };

  const handleChangeNuevoProveedor = (e) => {
    const { name, value } = e.target;
    setNuevoProveedor(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  const crearProveedor = async () => {
    try {
      const response = await axios.post(`${serverFront}/crear-proveedor`, nuevoProveedor);
      const nuevoProveedorCreado = response.data.proveedor;
      if (nuevoProveedorCreado && nuevoProveedorCreado.idproveedor) {
        setProveedores([...proveedores, nuevoProveedorCreado]);
        setNuevoProveedor({
          cuit: "",
          nombreprove: "",
          localidad: ""
        });
      }
    } catch (error) {
      console.error('Error creando proveedor:', error);
      setError('Error creando el proveedor');
    }
  };

  const editarProveedor = async (id, proveedorActualizado) => {
    try {
      await axios.put(`${serverFront}/editar-proveedor/${id}`, proveedorActualizado);
      setProveedores(proveedores.map(proveedor => 
        proveedor.idproveedor === id ? { ...proveedor, ...proveedorActualizado } : proveedor
      ));
      setEditandoProveedor(null); // Limpiar el estado de edición
    } catch (error) {
      console.error('Error editando proveedor:', error);
      setError('Error editando el proveedor');
    }
  };

  const eliminarProveedor = async (id) => {
    try {
      await axios.delete(`${serverFront}/eliminar-proveedor/${id}`);
      setProveedores(proveedores.filter(proveedor => proveedor.idproveedor !== id));
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      setError('Error eliminando el proveedor');
    }
  };

  const iniciarEdicion = (proveedor) => {
    setEditandoProveedor(proveedor);
  };

  const cancelarEdicion = () => {
    setEditandoProveedor(null);
  };

  return (
    <div>
      <h1>Lista de Proveedores</h1>
      <button onClick={toggleMostrarProveedores}>
        {mostrarProveedores ? "Ocultar Proveedores" : "Mostrar Proveedores"}
      </button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {mostrarProveedores && (
        <>
          <ul>
            {proveedores.map((proveedor) => (
              <li key={proveedor.idproveedor}>
                {proveedor && proveedor.idproveedor !== undefined ? (
                  <>
                    <p><strong>ID: </strong>{proveedor.idproveedor}</p>
                    <p><strong>Cuit: </strong>{proveedor.cuit}</p>
                    <p><strong>Nombre: </strong>{proveedor.nombreprove}</p>
                    <p><strong>Localidad: </strong>{proveedor.localidad}</p>
                    {/* Botones de Editar y Eliminar */}
                    <button onClick={() => iniciarEdicion(proveedor)}>Editar</button>
                    <button onClick={() => eliminarProveedor(proveedor.idproveedor)}>Eliminar</button>
                    {/* Formulario de Edición */}
                    {editandoProveedor && editandoProveedor.idproveedor === proveedor.idproveedor && (
                      <div>
                        <h3>Editar proveedor con ID: {proveedor.idproveedor}</h3>
                        <input
                          type="text"
                          name="cuit"
                          placeholder="Nuevo Cuit"
                          value={editandoProveedor.cuit}
                          onChange={(e) => setEditandoProveedor({
                            ...editandoProveedor,
                            cuit: e.target.value
                          })}
                        />
                        <input
                          type="text"
                          name="nombreprove"
                          placeholder="Nuevo nombre"
                          value={editandoProveedor.nombreprove}
                          onChange={(e) => setEditandoProveedor({
                            ...editandoProveedor,
                            nombreprove: e.target.value
                          })}
                        />
                        <input
                          type="text"
                          name="localidad"
                          placeholder="Nueva localidad"
                          value={editandoProveedor.localidad}
                          onChange={(e) => setEditandoProveedor({
                            ...editandoProveedor,
                            localidad: e.target.value
                          })}
                        />
                        <button onClick={() => editarProveedor(editandoProveedor.idproveedor, editandoProveedor)}>Guardar Cambios</button>
                        <button onClick={cancelarEdicion}>Cancelar</button>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Proveedor sin ID</p>
                )}
              </li>
            ))}
          </ul>
          {/* Formulario para crear un nuevo proveedor */}
          <div>
            <h2>Crear Nuevo Proveedor</h2>
            <input
              type="text"
              name="cuit"
              placeholder="Cuit Proveedor"
              value={nuevoProveedor.cuit}
              onChange={handleChangeNuevoProveedor}
            />
            <input
              type="text"
              name="nombreprove"
              placeholder="Nombre del proveedor"
              value={nuevoProveedor.nombreprove}
              onChange={handleChangeNuevoProveedor}
            />
            <input
              type="text"
              name="localidad"
              placeholder="Localidad del proveedor"
              value={nuevoProveedor.localidad}
              onChange={handleChangeNuevoProveedor}
            />
            <button onClick={crearProveedor}>Crear Proveedor</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Proveedor;


