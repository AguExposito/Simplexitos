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
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Container,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    idinventario: '',
    idproveedor: '',
    descripcionordendecompra: '',
    cantidadsolicitada: 1
  });

  useEffect(() => {
    fetchOrdenes();
    fetchProveedores();
    fetchInventario();
  }, []);

  const fetchOrdenes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra`);
      const data = await response.json();
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes de compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor`);
      const data = await response.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchInventario = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario`);
      const data = await response.json();
      setInventario(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
      const response = await fetch(`${API_BASE_URL}/ordenes-compra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Orden de compra creada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchOrdenes();
        onClose();
        setFormData({
          idinventario: '',
          idproveedor: '',
          descripcionordendecompra: '',
          cantidadsolicitada: 1
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al crear la orden de compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getProveedorNombre = (idproveedor) => {
    const proveedor = proveedores.find(p => p.idproveedor === idproveedor);
    return proveedor ? proveedor.nombreprove : 'N/A';
  };

  const getProductoNombre = (idinventario) => {
    const item = inventario.find(i => i.idinventario === idinventario);
    return item ? item.producto?.nombreproducto || 'N/A' : 'N/A';
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'ABIERTA': { color: 'yellow', text: 'Abierta' },
      'RECIBIDA': { color: 'green', text: 'Recibida' },
      'CANCELADA': { color: 'red', text: 'Cancelada' }
    };
    const estadoInfo = estados[estado] || { color: 'gray', text: estado };
    return <Badge colorScheme={estadoInfo.color}>{estadoInfo.text}</Badge>;
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <HStack justify="space-between" mb={6}>
          <Heading>Órdenes de Compra</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Nueva Orden
          </Button>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Producto</Th>
                <Th>Proveedor</Th>
                <Th>Cantidad</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>Descripción</Th>
              </Tr>
            </Thead>
            <Tbody>
              {ordenes.map((orden) => (
                <Tr key={orden.idorden_compra}>
                  <Td>{orden.idorden_compra}</Td>
                  <Td>{getProductoNombre(orden.idinventario)}</Td>
                  <Td>{getProveedorNombre(orden.idproveedor)}</Td>
                  <Td>{orden.cantidadsolicitada}</Td>
                  <Td>{getEstadoBadge(orden.estadoorden)}</Td>
                  <Td>{new Date(orden.fechaorden).toLocaleDateString()}</Td>
                  <Td>{orden.descripcionordendecompra || 'N/A'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nueva Orden de Compra</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form onSubmit={handleSubmit}>
                <FormControl mb={4}>
                  <FormLabel>Producto</FormLabel>
                  <Select
                    name="idinventario"
                    value={formData.idinventario}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccione un producto</option>
                    {inventario.map((item) => (
                      <option key={item.idinventario} value={item.idinventario}>
                        {item.producto?.nombreproducto || `Producto ${item.idinventario}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Proveedor</FormLabel>
                  <Select
                    name="idproveedor"
                    value={formData.idproveedor}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.idproveedor} value={proveedor.idproveedor}>
                        {proveedor.nombreprove}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Cantidad</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.cantidadsolicitada}
                    onChange={(value) => setFormData(prev => ({ ...prev, cantidadsolicitada: value }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    name="descripcionordendecompra"
                    value={formData.descripcionordendecompra}
                    onChange={handleInputChange}
                    placeholder="Descripción de la orden de compra"
                  />
                </FormControl>

                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button colorScheme="blue" type="submit">
                    Crear Orden
                  </Button>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
} 