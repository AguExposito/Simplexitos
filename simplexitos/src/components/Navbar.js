import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link to="/inventario" className="navbar-link">Inventario</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
