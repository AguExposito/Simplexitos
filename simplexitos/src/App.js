import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Inventario from './components/inventario/inventario';
import Navbar from './components/Navbar.js';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="App-main">
          <Routes>
            
            <Route path="/inventario" element={<Inventario />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
