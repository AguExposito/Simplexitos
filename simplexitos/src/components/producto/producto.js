import React, { useState, useEffect } from "react";
import axios from "axios";
import serverFront from "../../apiConfig";

const Producto = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarArticulos, setMostrarArticulos] = useState(false);
  const [editandoArticulo, setEditandoArticulo] = useState(null);
  const [nuevoArticulo, setNuevoArticulo] = useState({
    codigoarticulo: "",
    nombrearticulo: "",
    descripcionarticulo: ""
  });

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = () => {
    setLoading(true);
    setError(null);
    axios.get(`${serverFront}/articulos`)
      .then(response => {
        setArticulos(response.data);
        setLoading(false);
        setMostrarArticulos(true);
      })
      .catch(error => {
        console.error('Error fetching the articles:', error);
        setError('Error fetching the articles');
        setLoading(false);
      });
  };

  const toggleMostrarArticulos = () => {
    if (mostrarArticulos) {
      setArticulos([]);
    } else {
      fetchArticulos();
    }
    setMostrarArticulos(!mostrarArticulos);
  };

  const handleChangeNuevoArticulo = (e) => {
    const { name, value } = e.target;
    setNuevoArticulo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const crearArticulo = async () => {
    try {
      const response = await axios.post(`${serverFront}/crear-articulo`, nuevoArticulo);
      setArticulos([...articulos, response.data.articulo]);
      setNuevoArticulo({
        codigoarticulo: "",
        nombrearticulo: "",
        descripcionarticulo: ""
      });
      fetchArticulos();
    } catch (error) {
      console.error('Error creando artículo:', error);
      setError('Error creando el artículo');
    }
  };

  const editarArticulo = async (id, articuloActualizado) => {
    try {
      await axios.put(`${serverFront}/editar-articulo/${id}`, articuloActualizado);
      const index = articulos.findIndex(articulo => articulo.idarticulos === id);
      const nuevosArticulos = [...articulos];
      nuevosArticulos[index] = articuloActualizado;
      setArticulos(nuevosArticulos);
      setEditandoArticulo(null); // Limpiar el estado de edición
      fetchArticulos();
    } catch (error) {
      console.error('Error editando artículo:', error);
      setError('Error editando el artículo');
    }
  };

  const eliminarArticulo = async (id) => {
    try {
      await axios.delete(`${serverFront}/eliminar-articulo/${id}`);
      setArticulos(articulos.filter(articulo => articulo.idarticulos !== id));
      fetchArticulos();
    } catch (error) {
      console.error('Error eliminando artículo:', error);
      setError('Error eliminando el artículo');
    }
  };

  const iniciarEdicion = (articulo) => {
    setEditandoArticulo(articulo);
  };

  const cancelarEdicion = () => {
    setEditandoArticulo(null);
  };

  return (
    <div>
      <h1>Lista de Artículos</h1>
      <button onClick={toggleMostrarArticulos}>
        {mostrarArticulos ? "Ocultar Artículos" : "Mostrar Artículos"}
      </button>
      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {mostrarArticulos && (
        <>
          <ul>
            {articulos.map(articulo => (
              <li key={articulo.idarticulos}>
                <p><strong>ID: </strong>{articulo.idarticulos}</p>
                <p><strong>Nombre: </strong>{articulo.nombrearticulo}</p>
                <p><strong>Código: </strong>{articulo.codigoarticulo}</p>
                <p><strong>Descripción: </strong>{articulo.descripcionarticulo}</p>
                {/* Botones de Editar y Eliminar */}
                <button onClick={() => iniciarEdicion(articulo)}>Editar</button>
                <button onClick={() => eliminarArticulo(articulo.idarticulos)}>Eliminar</button>
                {/* Formulario de Edición */}
                {editandoArticulo && editandoArticulo.idarticulos === articulo.idarticulos && (
                  <div>
                    <h3>Editar artículo con ID: {articulo.idarticulos}</h3>
                    <input
                      type="text"
                      name="codigoarticulo"
                      placeholder="Nuevo código"
                      value={editandoArticulo.codigoarticulo}
                      onChange={(e) => setEditandoArticulo({
                        ...editandoArticulo,
                        codigoarticulo: e.target.value
                      })}
                    />
                    <input
                      type="text"
                      name="nombrearticulo"
                      placeholder="Nuevo nombre"
                      value={editandoArticulo.nombrearticulo}
                      onChange={(e) => setEditandoArticulo({
                        ...editandoArticulo,
                        nombrearticulo: e.target.value
                      })}
                    />
                    <input
                      type="text"
                      name="descripcionarticulo"
                      placeholder="Nueva descripción"
                      value={editandoArticulo.descripcionarticulo}
                      onChange={(e) => setEditandoArticulo({
                        ...editandoArticulo,
                        descripcionarticulo: e.target.value
                      })}
                    />
                    <button onClick={() => editarArticulo(editandoArticulo.idarticulos, editandoArticulo)}>Guardar Cambios</button>
                    <button onClick={cancelarEdicion}>Cancelar</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {/* Formulario para crear un nuevo artículo */}
          <div>
            <h2>Crear Nuevo Artículo</h2>
            <input
              type="text"
              name="codigoarticulo"
              placeholder="Código del artículo"
              value={nuevoArticulo.codigoarticulo}
              onChange={handleChangeNuevoArticulo}
            />
            <input
              type="text"
              name="nombrearticulo"
              placeholder="Nombre del artículo"
              value={nuevoArticulo.nombrearticulo}
              onChange={handleChangeNuevoArticulo}
            />
            <input
              type="text"
              name="descripcionarticulo"
              placeholder="Descripción del artículo"
              value={nuevoArticulo.descripcionarticulo}
              onChange={handleChangeNuevoArticulo}
            />
            <button onClick={crearArticulo}>Crear Artículo</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Producto;
