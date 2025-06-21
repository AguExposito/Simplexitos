import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Select,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import { API_BASE_URL } from '../config';

export default function InventarioForm({ isOpen, onClose, inventarioId, productId, onInventarioUpdated }) {
  const [formData, setFormData] = useState({
    stock: 0,
    modeloinventario: 'LOTE_FIJO'
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && (inventarioId || productId)) {
      fetchInventario();
    }
  }, [isOpen, inventarioId, productId]);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const url = inventarioId 
        ? `${API_BASE_URL}/inventario/${inventarioId}`
        : `${API_BASE_URL}/inventario/producto/${productId}`;
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setFormData({
        stock: data.stock || 0,
        modeloinventario: data.modeloinventario || 'LOTE_FIJO'
      });
    } catch (error) {
      console.error('Error fetching inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Ensure we're working with numbers, not strings
      const numericFormData = {
        stock: Number(formData.stock),
        modeloinventario: formData.modeloinventario
      };
      
      const url = inventarioId 
        ? `${API_BASE_URL}/inventario/${inventarioId}`
        : `${API_BASE_URL}/inventario/producto/${productId}`;

      console.log('Sending request to:', url, 'with data:', numericFormData);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numericFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || `Error: ${response.status}`);
      }

      toast({
        title: 'Éxito',
        description: 'Inventario actualizado correctamente. Los valores de lote óptimo, stock de seguridad y punto de pedido se calcularon automáticamente.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      if (onInventarioUpdated) {
        onInventarioUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating inventario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el inventario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modificar Inventario</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Cálculos Automáticos</Text>
                <Text fontSize="sm">
                  Los valores de lote óptimo, stock de seguridad y punto de pedido se calculan automáticamente 
                  basándose en las fórmulas del modelo de inventario seleccionado.
                </Text>
              </Box>
            </Alert>

            <FormControl mb={4}>
              <FormLabel>Modelo de Inventario</FormLabel>
              <Select
                name="modeloinventario"
                value={formData.modeloinventario}
                onChange={handleChange}
              >
                <option value="LOTE_FIJO">Lote Fijo</option>
                <option value="PERIODO_FIJO">Período Fijo</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Stock Actual</FormLabel>
              <NumberInput 
                min={0} 
                value={formData.stock}
                onChange={(value) => handleNumberChange('stock', value)}
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
            <Button colorScheme="blue" mr={3} type="submit" isLoading={loading}>
              Guardar
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 