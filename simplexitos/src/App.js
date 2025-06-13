import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ArticulosList from './components/producto/producto.js';
import DemandaList from './components/demandas/demandalist.js';
import PronosticoList from './components/pronostico/pronosticolist.js';
import ErrorPronosticoList from './components/errorpronostico/errorpronostico.js';
import './App.css';
import ProveedorArticuloList from './components/proveedorproducto/proveedorproducto.js';
import VentasList from './components/venta/venta.js';
import ProveedoresList from './components/proveedor/proveedor.js';
import OrdenCompraList from './components/ordendecompra/ordendecompra.js';
import Inventory from './components/inventario/inventario.js';
import Navbar from './components/Navbar.js'; // Asegúrate de que la ruta del Navbar sea correcta
import Footer from './Footer.js';
function App() {
  return (
    <Router>
      <div className="App">
      
        <Navbar />
        <main className="App-main">
          <Routes>
            <Route path="/articulos" element={<ArticulosList />} />
            <Route path="/demanda" element={<DemandaList />} />
            <Route path="/pronostico" element={<PronosticoList />} />
            <Route path="/errorpronostico" element={<ErrorPronosticoList />} />
            <Route path="/proveedorarticulo" element={<ProveedorArticuloList />} />
            <Route path="/ventas" element={<VentasList />} />
            <Route path="/proveedores" element={<ProveedoresList />} />
            <Route path="/ordencompra" element={<OrdenCompraList />} />
            <Route path="/inventario" element={<Inventory />} />
          </Routes>
        </main>
        <Footer />

      </div>
    </Router>
  );
}

export default App;
