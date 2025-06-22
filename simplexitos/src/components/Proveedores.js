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
  Badge,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';
import ProductosProveedor from './ProductosProveedor';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [showProductos, setShowProductos] = useState(false);
  const [selectedProveedorForProductos, setSelectedProveedorForProductos] = useState(null);
  const [isProductosModalOpen, setIsProductosModalOpen] = useState(false);
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
      const response = await fetch(`${API_BASE_URL}/proveedor`);
      if (!response.ok) {
        console.error('Error HTTP:', response.status, response.statusText);
        setProveedores([]);
        return;
      }
      const data = await response.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setProveedores([]);
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
        ? `${API_BASE_URL}/proveedor/${selectedProveedor.idproveedor}`
        : `${API_BASE_URL}/proveedor`;
      
      const method = selectedProveedor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newProveedor = await response.json();
        toast({
          title: 'Éxito',
          description: `Proveedor ${selectedProveedor ? 'actualizado' : 'creado'} correctamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Si es un proveedor nuevo, abrir inmediatamente el modal de productos
        if (!selectedProveedor) {
          setSelectedProveedorForProductos(newProveedor);
          setIsProductosModalOpen(true);
        }
        
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
    try {
      // Primero verificar el estado del proveedor
      const statusResponse = await fetch(`${API_BASE_URL}/proveedor/${id}/status`);
      const statusData = await statusResponse.json();
      
      if (!statusData.canDelete) {
        let message = `No se puede eliminar el proveedor "${statusData.proveedor.nombreprove}":\n\n`;
        
        if (statusData.reasons.hasProducts) {
          message += `• Tiene ${statusData.productosAsignados.length} producto(s) asignado(s)\n`;
        }
        
        if (statusData.reasons.hasActiveOrders) {
          message += `• Tiene ${statusData.ordenesPendientes.length} orden(es) pendiente(s)\n`;
          message += `• Tiene ${statusData.ordenesEnviadas.length} orden(es) enviada(s)\n`;
        }
        
        message += '\nDebe resolver estos problemas antes de eliminar el proveedor.';
        
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
      if (window.confirm(`¿Está seguro de eliminar el proveedor "${statusData.proveedor.nombreprove}"?`)) {
        const response = await fetch(`${API_BASE_URL}/proveedor/${id}`, {
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
        } else {
          // Manejar errores específicos de validación
          const errorData = await response.json();
          toast({
            title: 'Error',
            description: errorData.details || errorData.error || 'Hubo un error al eliminar el proveedor',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error al verificar estado del proveedor:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al verificar el estado del proveedor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const handleProductosClick = (proveedor) => {
    setSelectedProveedorForProductos(proveedor);
    setIsProductosModalOpen(true);
  };

  const getProductosCount = (proveedor) => {
    return proveedor.productos_count || 0;
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
              <Th>Productos</Th>
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
                  <Badge colorScheme="blue">
                    {getProductosCount(proveedor)} productos
                  </Badge>
                </Td>
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
                      colorScheme="teal"
                      onClick={() => handleProductosClick(proveedor)}
                    >
                      Productos
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
              {!selectedProveedor && (
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <Text fontSize="sm">
                    <strong>Importante:</strong> Después de crear el proveedor, deberás asignarle al menos un producto 
                    para que pueda ser utilizado en el sistema.
                  </Text>
                </Alert>
              )}
              
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
                />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Localidad</FormLabel>
                <Input
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleInputChange}
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

      {isProductosModalOpen && selectedProveedorForProductos && (
        <Modal isOpen={isProductosModalOpen} onClose={() => setIsProductosModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Productos de {selectedProveedorForProductos.nombreprove}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <ProductosProveedor 
                proveedorId={selectedProveedorForProductos.idproveedor}
                nombreProveedor={selectedProveedorForProductos.nombreprove}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
} 