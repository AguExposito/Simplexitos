import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link to="/articulos" className="navbar-link">Artículos</Link>
        </li>
        <li className="navbar-item">
          <Link to="/demanda" className="navbar-link">Demanda</Link>
        </li>
        <li className="navbar-item">
          <Link to="/pronostico" className="navbar-link">Pronóstico</Link>
        </li>
        <li className="navbar-item">
          <Link to="/errorpronostico" className="navbar-link">Error Pronóstico</Link>
        </li>
        <li className="navbar-item">
          <Link to="/proveedorarticulo" className="navbar-link">Artículo Proveedor</Link>
        </li>
        <li className="navbar-item">
          <Link to="/ventas" className="navbar-link">Ventas</Link>
        </li>
        <li className="navbar-item">
          <Link to="/proveedores" className="navbar-link">Proveedores</Link>
        </li>
        <li className="navbar-item">
          <Link to="/ordencompra" className="navbar-link">Orden de Compra</Link>
        </li>
        <li className="navbar-item">
          <Link to="/inventario" className="navbar-link">Inventario</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
