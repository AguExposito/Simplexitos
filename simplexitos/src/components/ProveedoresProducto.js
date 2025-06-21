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

export default function ProveedoresProducto({ productoId, nombreProducto }) {
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    idproveedor: '',
    costopedido: 0,
    costocompra: 0,
    preciounitario: 0,
    tiempoenvio: 0,
    frecuenciadereabastecimiento: 0
  });

  useEffect(() => {
    if (productoId) {
      fetchProveedoresProducto();
      fetchProveedoresDisponibles();
    }
  }, [productoId]);

  const fetchProveedoresProducto = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor-producto/producto/${productoId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error('Error fetching proveedores del producto:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores del producto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProveedoresDisponibles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setProveedoresDisponibles(data);
    } catch (error) {
      console.error('Error fetching proveedores disponibles:', error);
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
        idproducto: productoId
      };
      
      const url = selectedProveedor
        ? `${API_BASE_URL}/proveedor-producto/${selectedProveedor.idproveedorproducto}`
        : `${API_BASE_URL}/proveedor-producto`;
      
      const method = selectedProveedor ? 'PUT' : 'POST';
      
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
        description: `Proveedor ${selectedProveedor ? 'actualizado' : 'asignado'} correctamente`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProveedoresProducto();
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
          description: 'Proveedor desvinculado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchProveedoresProducto();
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'Error al desvincular el proveedor',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      idproveedor: proveedor.idproveedor,
      costopedido: proveedor.costopedido || 0,
      costocompra: proveedor.costocompra || 0,
      preciounitario: proveedor.preciounitario || 0,
      tiempoenvio: proveedor.tiempoenvio || 0,
      frecuenciadereabastecimiento: proveedor.frecuenciadereabastecimiento || 0
    });
    onOpen();
  };

  const handleNew = () => {
    setSelectedProveedor(null);
    resetForm();
    onOpen();
  };

  const resetForm = () => {
    setFormData({
      idproveedor: '',
      costopedido: 0,
      costocompra: 0,
      preciounitario: 0,
      tiempoenvio: 0,
      frecuenciadereabastecimiento: 0
    });
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading size="md" mb={4}>Proveedores para {nombreProducto}</Heading>
      
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleNew} mb={4}>
        Asignar Proveedor
      </Button>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Proveedor</Th>
            <Th>Precio Unitario</Th>
            <Th>Tiempo Envío (días)</Th>
            <Th>Costo Pedido</Th>
            <Th>Frecuencia Reabastecimiento</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {proveedores.map((prov) => (
            <Tr key={prov.idproveedorproducto}>
              <Td>{prov.nombreprove}</Td>
              <Td>${prov.preciounitario}</Td>
              <Td>{prov.tiempoenvio}</Td>
              <Td>${prov.costopedido}</Td>
              <Td>{prov.frecuenciadereabastecimiento || '-'}</Td>
              <Td>
                <Button
                  size="sm"
                  leftIcon={<EditIcon />}
                  mr={2}
                  onClick={() => handleEdit(prov)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  leftIcon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDelete(prov.idproveedorproducto)}
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
            {selectedProveedor ? 'Editar Proveedor' : 'Asignar Proveedor'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {!selectedProveedor && (
                <FormControl mb={4}>
                  <FormLabel>Proveedor</FormLabel>
                  <select
                    name="idproveedor"
                    value={formData.idproveedor}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <option value="">Seleccionar Proveedor</option>
                    {proveedoresDisponibles.map(proveedor => (
                      <option key={proveedor.idproveedor} value={proveedor.idproveedor}>
                        {proveedor.nombreprove}
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
              
              <FormControl mb={4}>
                <FormLabel>Frecuencia de Reabastecimiento (días)</FormLabel>
                <NumberInput 
                  min={0}
                  value={formData.frecuenciadereabastecimiento}
                  onChange={(value) => handleNumberChange('frecuenciadereabastecimiento', value)}
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