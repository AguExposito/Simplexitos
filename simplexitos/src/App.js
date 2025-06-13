import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Inventario from './components/inventario/inventario.js';

function App() {
  return (
    <Router>
      <div className="App">
      
        <Navbar />
        <main className="App-main">
          <Switch>
            <Route path="/inventario" element={<Inventario />} />
          </Switch>
        </main>
        <Footer />

      </div>
    </Router>
  );
}

export default App;
