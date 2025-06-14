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
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    codproducto: '',
    nombreproducto: '',
    modeloproducto: '',
    descripcionproducto: '',
    estadoproducto: 'ACTIVO'
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos`);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
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
      const url = selectedProducto
        ? `${API_BASE_URL}/productos/${selectedProducto.idproducto}`
        : `${API_BASE_URL}/productos`;
      
      const method = selectedProducto ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      modeloproducto: producto.modeloproducto || '',
      descripcionproducto: producto.descripcionproducto || '',
      estadoproducto: producto.estadoproducto
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
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
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Hubo un error al eliminar el producto',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleNew = () => {
    setSelectedProducto(null);
    setFormData({
      codproducto: '',
      nombreproducto: '',
      modeloproducto: '',
      descripcionproducto: '',
      estadoproducto: 'ACTIVO'
    });
    onOpen();
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
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDelete(producto.idproducto)}
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
                <Input
                  name="modeloproducto"
                  value={formData.modeloproducto}
                  onChange={handleInputChange}
                />
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
    </Box>
  );
} 