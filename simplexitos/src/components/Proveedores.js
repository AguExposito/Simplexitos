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
  useToast,
  Heading,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    nombreprove: '',
    cuit: '',
    localidad: ''
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`);
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
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
      const url = selectedProveedor
        ? `${API_BASE_URL}/proveedores/${selectedProveedor.idproveedor}`
        : `${API_BASE_URL}/proveedores`;
      
      const method = selectedProveedor ? 'PUT' : 'POST';
      
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
          description: `Proveedor ${selectedProveedor ? 'actualizado' : 'creado'} correctamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchProveedores();
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

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      nombreprove: proveedor.nombreprove,
      cuit: proveedor.cuit,
      localidad: proveedor.localidad
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Proveedor eliminado correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          fetchProveedores();
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Hubo un error al eliminar el proveedor',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleNew = () => {
    setSelectedProveedor(null);
    setFormData({
      nombreprove: '',
      cuit: '',
      localidad: ''
    });
    onOpen();
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <HStack justify="space-between" mb={6}>
        <Heading>Proveedores</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleNew}>
          Nuevo Proveedor
        </Button>
      </HStack>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>CUIT</Th>
              <Th>Localidad</Th>
              <Th>Fecha Alta</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {proveedores.map((proveedor) => (
              <Tr key={proveedor.idproveedor}>
                <Td>{proveedor.nombreprove}</Td>
                <Td>{proveedor.cuit}</Td>
                <Td>{proveedor.localidad}</Td>
                <Td>{new Date(proveedor.fechaaltaproveedor).toLocaleDateString()}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<EditIcon />}
                      onClick={() => handleEdit(proveedor)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDelete(proveedor.idproveedor)}
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
            {selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Nombre</FormLabel>
                <Input
                  name="nombreprove"
                  value={formData.nombreprove}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>CUIT</FormLabel>
                <Input
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  type="number"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Localidad</FormLabel>
                <Input
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleInputChange}
                  type="number"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" type="submit">
                {selectedProveedor ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
} 