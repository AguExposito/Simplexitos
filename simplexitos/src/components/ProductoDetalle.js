import React, { useState, useEffect } from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, Heading } from '@chakra-ui/react';
import { API_BASE_URL } from '../config';
import InventarioForm from './InventarioForm';
import ProveedoresProducto from './ProveedoresProducto';

export default function ProductoDetalle({ productoId }) {
  const [producto, setProducto] = useState(null);
  
  useEffect(() => {
    if (productoId) {
      fetchProducto();
    }
  }, [productoId]);

  const fetchProducto = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/producto/${productoId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProducto(data);
    } catch (error) {
      console.error('Error fetching producto:', error);
    }
  };

  if (!producto) {
    return <Box>Cargando...</Box>;
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>{producto.nombreproducto}</Heading>
      
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Información</Tab>
          <Tab>Inventario</Tab>
          <Tab>Proveedores</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Box>
              <p><strong>Código:</strong> {producto.codproducto}</p>
              <p><strong>Descripción:</strong> {producto.descripcionproducto || 'N/A'}</p>
              <p><strong>Modelo:</strong> {producto.modeloproducto}</p>
              <p><strong>Demanda:</strong> {producto.demanda || 'N/A'}</p>
              <p><strong>Estado:</strong> {producto.estadoproducto}</p>
            </Box>
          </TabPanel>
          
          <TabPanel>
            <InventarioForm productId={productoId} onInventarioUpdated={fetchProducto} />
          </TabPanel>
          
          <TabPanel>
            <ProveedoresProducto 
              productoId={productoId} 
              nombreProducto={producto.nombreproducto} 
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}