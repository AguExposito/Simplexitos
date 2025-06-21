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
  useDisclosure,
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
  Select,
  useToast,
  Heading,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';
import InventarioForm from './InventarioForm';
import ProveedoresProducto from './ProveedoresProducto';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    codproducto: '',
    nombreproducto: '',
    modeloproducto: 'LOTE_FIJO',
    descripcionproducto: '',
    estadoproducto: 'ACTIVO',
    demanda: '',
    stockseguridad: '',
  });

  const [showProveedores, setShowProveedores] = useState(false);
  const [selectedProductForProveedores, setSelectedProductForProveedores] = useState(null);
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/producto`);
      if (!response.ok) {
        console.error('Error HTTP:', response.status, response.statusText);
        setProductos([]);
        return;
      }
      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setProductos([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedProducto
        ? `${API_BASE_URL}/producto/${selectedProducto.idproducto}`
        : `${API_BASE_URL}/producto`;
      
      const method = selectedProducto ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          demanda: parseFloat(formData.demanda) || 0,
          stockseguridad: parseInt(formData.stockseguridad) || 0
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: `Producto ${selectedProducto ? 'actualizado' : 'creado'} correctamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchProductos();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al procesar la solicitud',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setFormData({
      codproducto: producto.codproducto,
      nombreproducto: producto.nombreproducto,
      modeloproducto: producto.modeloproducto || 'LOTE_FIJO',
      descripcionproducto: producto.descripcionproducto || '',
      estadoproducto: producto.estadoproducto,
      demanda: producto.demanda?.toFixed(2) || '0.00',
      stockseguridad: producto.stockseguridad || 0
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    try {
      // Primero verificar el estado del producto
      const statusResponse = await fetch(`${API_BASE_URL}/producto/${id}/status`);
      const statusData = await statusResponse.json();
      
      if (!statusData.canDelete) {
        let message = `No se puede eliminar el producto "${statusData.producto.nombreproducto}":\n\n`;
        
        if (statusData.reasons.hasStock) {
          message += `• Tiene ${statusData.stock} unidades en stock\n`;
        }
        
        if (statusData.reasons.hasActiveOrders) {
          message += `• Tiene ${statusData.ordenesPendientes.length} orden(es) pendiente(s)\n`;
          message += `• Tiene ${statusData.ordenesEnviadas.length} orden(es) enviada(s)\n`;
        }
        
        message += '\nDebe resolver estos problemas antes de eliminar el producto.';
        
        toast({
          title: 'No se puede eliminar',
          description: message,
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
        return;
      }
      
      // Si puede eliminarse, confirmar
      if (window.confirm(`¿Está seguro de eliminar el producto "${statusData.producto.nombreproducto}"?`)) {
        const response = await fetch(`${API_BASE_URL}/producto/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Producto eliminado correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          fetchProductos();
        } else {
          // Manejar errores específicos de validación
          const errorData = await response.json();
          toast({
            title: 'Error',
            description: errorData.details || errorData.error || 'Hubo un error al eliminar el producto',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error al verificar estado del producto:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al verificar el estado del producto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNew = () => {
    setSelectedProducto(null);
    setFormData({
      codproducto: '',
      nombreproducto: '',
      modeloproducto: 'LOTE_FIJO',
      descripcionproducto: '',
      estadoproducto: 'ACTIVO',
      demanda: '',
      stockseguridad: '',
    });
    onOpen();
  };

  const getStockBadge = (stock) => {
    if (stock > 0) {
      return <Badge colorScheme="green">{stock} unidades</Badge>;
    } else {
      return <Badge colorScheme="gray">Sin stock</Badge>;
    }
  };

  const handleDetailClick = (producto) => {
    setSelectedProducto(producto);
    setShowProveedores(true);
  };

  const handleProveedoresClick = (producto) => {
    setSelectedProductForProveedores(producto);
    setIsProveedoresModalOpen(true);
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <HStack justify="space-between" mb={6}>
        <Heading>Productos</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleNew}>
          Nuevo Producto
        </Button>
      </HStack>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Código</Th>
              <Th>Nombre</Th>
              <Th>Modelo</Th>
              <Th>Demanda Anual</Th>
              <Th>Stock Seguridad</Th>
              <Th>Stock Actual</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {productos.map((producto) => (
              <Tr key={producto.idproducto}>
                <Td>{producto.codproducto}</Td>
                <Td>{producto.nombreproducto}</Td>
                <Td>{producto.modeloproducto}</Td>
                <Td>{producto.demanda?.toFixed(2) || '0.00'} unidades/año</Td>
                <Td>{producto.stockseguridad}</Td>
                <Td>{getStockBadge(producto.stockactual)}</Td>
                <Td>{producto.estadoproducto}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<EditIcon />}
                      onClick={() => handleEdit(producto)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => handleProveedoresClick(producto)}
                    >
                      Proveedores
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<DeleteIcon />}
                      colorScheme={producto.stockactual > 0 ? "gray" : "red"}
                      onClick={() => handleDelete(producto.idproducto)}
                      title={producto.stockactual > 0 ? "No se puede eliminar: tiene stock" : "Eliminar producto"}
                    >
                      Eliminar
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Código</FormLabel>
                <Input
                  name="codproducto"
                  value={formData.codproducto}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Nombre</FormLabel>
                <Input
                  name="nombreproducto"
                  value={formData.nombreproducto}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Modelo</FormLabel>
                <Select
                  name="modeloproducto"
                  value={formData.modeloproducto}
                  onChange={handleInputChange}
                >
                  <option value="LOTE_FIJO">Lote Fijo</option>
                  <option value="PERIODO_FIJO">Periodo Fijo</option>
                </Select>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Descripción</FormLabel>
                <Input
                  name="descripcionproducto"
                  value={formData.descripcionproducto}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Estado</FormLabel>
                <Select
                  name="estadoproducto"
                  value={formData.estadoproducto}
                  onChange={handleInputChange}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </Select>
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Demanda Anual</FormLabel>
                <Input
                  name="demanda"
                  value={formData.demanda}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Stock de Seguridad</FormLabel>
                <Input
                  name="stockseguridad"
                  value={formData.stockseguridad}
                  onChange={handleInputChange}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" type="submit">
                {selectedProducto ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {showProveedores && selectedProducto && (
        <Box mt={4}>
          <ProveedoresProducto 
            productoId={selectedProducto.idproducto}
            nombreProducto={selectedProducto.nombreproducto}
          />
        </Box>
      )}

      {isProveedoresModalOpen && selectedProductForProveedores && (
        <Modal isOpen={isProveedoresModalOpen} onClose={() => setIsProveedoresModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Proveedores para {selectedProductForProveedores.nombreproducto}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <ProveedoresProducto 
                productoId={selectedProductForProveedores.idproducto}
                nombreProducto={selectedProductForProveedores.nombreproducto}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
} 