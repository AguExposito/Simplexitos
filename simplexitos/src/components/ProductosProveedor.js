import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  useToast,
  Heading,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function ProductosProveedor({ proveedorId, nombreProveedor }) {
  const [productos, setProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    idproducto: '',
    costopedido: 0,
    costocompra: 0,
    preciounitario: 0,
    tiempoenvio: 0
  });

  useEffect(() => {
    if (proveedorId) {
      fetchProductosProveedor();
      fetchProductosDisponibles();
    }
  }, [proveedorId]);

  const fetchProductosProveedor = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor-producto/proveedor/${proveedorId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error fetching productos del proveedor:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del proveedor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProductosDisponibles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/producto`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProductosDisponibles(data);
    } catch (error) {
      console.error('Error fetching productos disponibles:', error);
    }
  };

  const handleInputChange = (e) => {
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
      
      const submitData = {
        ...formData,
        idproveedor: proveedorId
      };
      
      const url = selectedProducto
        ? `${API_BASE_URL}/proveedor-producto/${selectedProducto.idproveedorproducto}`
        : `${API_BASE_URL}/proveedor-producto`;
      
      const method = selectedProducto ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      toast({
        title: 'Éxito',
        description: `Producto ${selectedProducto ? 'actualizado' : 'asignado'} correctamente`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProductosProveedor();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `Error: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta relación proveedor-producto?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/proveedor-producto/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        toast({
          title: 'Éxito',
          description: 'Producto desvinculado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchProductosProveedor();
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'Error al desvincular el producto',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setFormData({
      idproducto: producto.idproducto,
      costopedido: producto.costopedido || 0,
      costocompra: producto.costocompra || 0,
      preciounitario: producto.preciounitario || 0,
      tiempoenvio: producto.tiempoenvio || 0
    });
    onOpen();
  };

  const handleNew = () => {
    setSelectedProducto(null);
    resetForm();
    onOpen();
  };

  const resetForm = () => {
    setFormData({
      idproducto: '',
      costopedido: 0,
      costocompra: 0,
      preciounitario: 0,
      tiempoenvio: 0
    });
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading size="md" mb={4}>Productos de {nombreProveedor}</Heading>
      
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleNew} mb={4}>
        Asignar Producto
      </Button>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Producto</Th>
            <Th>Precio Unitario</Th>
            <Th>Tiempo Envío (días)</Th>
            <Th>Costo Pedido</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {productos.map((prod) => (
            <Tr key={prod.idproveedorproducto}>
              <Td>{prod.nombreproducto}</Td>
              <Td>${prod.preciounitario}</Td>
              <Td>{prod.tiempoenvio}</Td>
              <Td>${prod.costopedido}</Td>
              <Td>
                <Button
                  size="sm"
                  leftIcon={<EditIcon />}
                  mr={2}
                  onClick={() => handleEdit(prod)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  leftIcon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDelete(prod.idproveedorproducto)}
                >
                  Eliminar
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProducto ? 'Editar Producto' : 'Asignar Producto'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {!selectedProducto && (
                <FormControl mb={4}>
                  <FormLabel>Producto</FormLabel>
                  <select
                    name="idproducto"
                    value={formData.idproducto}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <option value="">Seleccionar Producto</option>
                    {productosDisponibles.map(producto => (
                      <option key={producto.idproducto} value={producto.idproducto}>
                        {producto.nombreproducto}
                      </option>
                    ))}
                  </select>
                </FormControl>
              )}
              
              <FormControl mb={4}>
                <FormLabel>Costo de Pedido</FormLabel>
                <NumberInput 
                  min={0}
                  value={formData.costopedido}
                  onChange={(value) => handleNumberChange('costopedido', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Precio Unitario</FormLabel>
                <NumberInput 
                  min={0}
                  value={formData.preciounitario}
                  onChange={(value) => handleNumberChange('preciounitario', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Tiempo de Envío (días)</FormLabel>
                <NumberInput 
                  min={1}
                  value={formData.tiempoenvio}
                  onChange={(value) => handleNumberChange('tiempoenvio', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="blue" 
                type="submit"
                isLoading={loading}
              >
                Guardar
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
} 