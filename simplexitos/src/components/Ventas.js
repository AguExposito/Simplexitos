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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    idproducto: '',
    cantidadventa: 1
  });

  useEffect(() => {
    fetchVentas();
    fetchProductos();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/venta`);
      if (!response.ok) {
        console.error('Error HTTP:', response.status, response.statusText);
        setVentas([]);
        return;
      }
      const data = await response.json();
      setVentas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ventas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setVentas([]);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/venta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Venta registrada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchVentas();
        onClose();
        setFormData({
          idproducto: '',
          cantidadventa: 1
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al registrar la venta',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getProductoNombre = (idproducto) => {
    const producto = productos.find(p => p.idproducto === idproducto);
    return producto ? producto.nombreproducto : 'N/A';
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Está seguro de eliminar todo el historial de ventas? Esta acción no se puede deshacer.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/venta/all`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Historial de ventas eliminado correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          fetchVentas();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar el historial de ventas');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Hubo un error al eliminar el historial de ventas',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <HStack justify="space-between" mb={6}>
        <Heading>Ventas</Heading>
        <HStack spacing={4}>
          <Button colorScheme="red" onClick={handleDeleteAll}>
            Eliminar Historial
          </Button>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Nueva Venta
          </Button>
        </HStack>
      </HStack>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Producto</Th>
              <Th>Cantidad</Th>
              <Th>Precio Total</Th>
              <Th>Fecha</Th>
            </Tr>
          </Thead>
          <Tbody>
            {ventas.map((venta) => (
              <Tr key={venta.idventa}>
                <Td>{venta.idventa}</Td>
                <Td>{getProductoNombre(venta.idproducto)}</Td>
                <Td>{venta.cantidadventa}</Td>
                <Td>${venta.preciototal?.toFixed(2)}</Td>
                <Td>{new Date(venta.fechaaltaventa).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva Venta</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Producto</FormLabel>
                <Select
                  name="idproducto"
                  value={formData.idproducto}
                  onChange={handleInputChange}
                  placeholder="Seleccione un producto"
                >
                  {productos.map((producto) => (
                    <option key={producto.idproducto} value={producto.idproducto}>
                      {producto.nombreproducto}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Cantidad</FormLabel>
                <NumberInput
                  min={1}
                  value={formData.cantidadventa}
                  onChange={(value) => setFormData(prev => ({ ...prev, cantidadventa: value }))}
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
              <Button colorScheme="blue" type="submit">
                Registrar Venta
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
} 