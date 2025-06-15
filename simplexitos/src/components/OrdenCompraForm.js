import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { API_BASE_URL } from '../config';

export default function OrdenCompraForm({ inventarioId, onOrdenCreated }) {
  const [formData, setFormData] = useState({
    idproveedor: '',
    descripcionordendecompra: '',
    cantidadsolicitada: 0
  });
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [producto, setProducto] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (inventarioId) {
      fetchInventarioInfo();
    }
  }, [inventarioId]);

  const fetchInventarioInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario/${inventarioId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      
      // Obtener información del producto
      const productoResponse = await fetch(`${API_BASE_URL}/producto/${data.idproducto}`);
      if (!productoResponse.ok) {
        throw new Error(`Error: ${productoResponse.status}`);
      }
      const productoData = await productoResponse.json();
      setProducto(productoData);
      
      // Obtener proveedores de este producto
      fetchProveedoresProducto(data.idproducto);
    } catch (error) {
      console.error('Error fetching inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProveedoresProducto = async (idproducto) => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor-producto/producto/${idproducto}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores disponibles',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const ordenData = {
        ...formData,
        idinventario: inventarioId
      };
      
      const response = await fetch(`${API_BASE_URL}/orden-compra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast({
        title: 'Éxito',
        description: 'Orden de compra creada correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (onOrdenCreated) {
        onOrdenCreated();
      }
    } catch (error) {
      console.error('Error creating orden compra:', error);
      toast({
        title: 'Error',
        description: `No se pudo crear la orden de compra: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {producto && (
        <Box mb={4}>
          <strong>Producto:</strong> {producto.nombreproducto}
        </Box>
      )}

      {proveedores.length > 0 ? (
        <>
          <Box mb={4}>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Proveedor</Th>
                  <Th>Precio Unitario</Th>
                  <Th>Tiempo de Envío</Th>
                  <Th>Costo de Pedido</Th>
                </Tr>
              </Thead>
              <Tbody>
                {proveedores.map((prov) => (
                  <Tr key={prov.idproveedorproducto}>
                    <Td>{prov.nombreprove}</Td>
                    <Td>${prov.preciounitario}</Td>
                    <Td>{prov.tiempoenvio} días</Td>
                    <Td>${prov.costopedido}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          <form onSubmit={handleSubmit}>
            <FormControl mb={4} isRequired>
              <FormLabel>Seleccionar Proveedor</FormLabel>
              <Select 
                name="idproveedor" 
                value={formData.idproveedor}
                onChange={handleChange}
                placeholder="Seleccione un proveedor"
                required
              >
                {proveedores.map(prov => (
                  <option key={prov.idproveedor} value={prov.idproveedor}>
                    {prov.nombreprove} (${prov.preciounitario})
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Descripción</FormLabel>
              <Textarea
                name="descripcionordendecompra"
                value={formData.descripcionordendecompra}
                onChange={handleChange}
                placeholder="Detalles de la orden"
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Cantidad</FormLabel>
              <NumberInput 
                min={1}
                value={formData.cantidadsolicitada}
                onChange={(value) => handleNumberChange('cantidadsolicitada', value)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <Button 
              colorScheme="blue" 
              type="submit"
              isLoading={loading}
              width="full"
            >
              Crear Orden de Compra
            </Button>
          </form>
        </>
      ) : (
        <Box textAlign="center" py={4}>
          No hay proveedores asignados para este producto. 
          <Button 
            mt={2}
            colorScheme="blue"
            size="sm"
            onClick={() => window.location.href = `/productos/edit/${producto?.idproducto}`}
          >
            Asignar Proveedores
          </Button>
        </Box>
      )}
    </Box>
  );
}