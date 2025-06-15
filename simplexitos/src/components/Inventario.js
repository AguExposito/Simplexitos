import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Heading,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Container,
  Button,
  HStack,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';
import InventarioForm from './InventarioForm';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockBajo: 0,
    stockAlto: 0,
    valorTotal: 0
  });
  const [selectedInventario, setSelectedInventario] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario`);
      const data = await response.json();
      setInventario(Array.isArray(data) ? data : []);
      
      // Calculate statistics
      const totalProductos = data.length;
      const stockBajo = data.filter(item => item.stock < item.stockseguridad).length;
      const stockAlto = data.filter(item => item.stock > item.puntopedido).length;
      const valorTotal = data.reduce((sum, item) => sum + (item.stock * item.costocompra), 0);

      setStats({
        totalProductos,
        stockBajo,
        stockAlto,
        valorTotal
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStockStatus = (stock, stockSeguridad, puntoPedido) => {
    if (stock <= 0) {
      return { color: 'red', text: 'Sin Stock' };
    } else if (stock < stockSeguridad) {
      return { color: 'orange', text: 'Stock Bajo' };
    } else if (stock > puntoPedido) {
      return { color: 'green', text: 'Stock Alto' };
    } else {
      return { color: 'blue', text: 'Stock Normal' };
    }
  };

  const handleEdit = (item) => {
    setSelectedInventario(item);
    setIsEditModalOpen(true);
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <Heading mb={6}>Inventario</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }} mb={8}>
          <Stat>
            <StatLabel>Total Productos</StatLabel>
            <StatNumber>{stats.totalProductos}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Stock Bajo</StatLabel>
            <StatNumber>{stats.stockBajo}</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Necesitan reabastecimiento
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Stock Alto</StatLabel>
            <StatNumber>{stats.stockAlto}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Stock suficiente
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Valor Total</StatLabel>
            <StatNumber>${stats.valorTotal.toFixed(2)}</StatNumber>
          </Stat>
        </SimpleGrid>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Producto</Th>
                <Th>Stock</Th>
                <Th>Stock Seguridad</Th>
                <Th>Punto Pedido</Th>
                <Th>Estado</Th>
                <Th>Modelo</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventario.map((item) => {
                const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido);
                return (
                  <Tr key={item.idinventario}>
                    <Td>{item.idinventario}</Td>
                    <Td>{item.nombreproducto || 'N/A'}</Td>
                    <Td>{item.stock}</Td>
                    <Td>{item.stockseguridad}</Td>
                    <Td>{item.puntopedido}</Td>
                    <Td>
                      <Badge colorScheme={status.color}>{status.text}</Badge>
                    </Td>
                    <Td>{item.modeloinventario || 'N/A'}</Td>
                    <Td>
                      <Button
                        size="sm"
                        leftIcon={<EditIcon />}
                        onClick={() => handleEdit(item)}
                      >
                        Editar
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Container>

      <InventarioForm 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        inventarioId={selectedInventario?.idinventario}
        onInventarioUpdated={fetchInventario}
      />
    </Box>
  );
} 