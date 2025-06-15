import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { EditIcon, AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';
import InventarioForm from './InventarioForm';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [valorTotal, setValorTotal] = useState(null);
  const [selectedInventario, setSelectedInventario] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState({
    idproducto: '',
    stock: 0,
    demanda: 0,
    costoalmacenamiento: 0,
    costocompra: 0,
    costopedido: 0,
    puntopedido: 0,
    stockseguridad: 0,
    loteoptimo: 0,
    modeloinventario: 'LOTE_FIJO',
    cgi: 0,
    frecuenciadereabastecimiento: 0
  });

  useEffect(() => {
    fetchInventario();
    fetchProductos();
    fetchValorTotal();
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario`);
      const data = await response.json();
      setInventario(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/producto`);
      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchValorTotal = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario/total`);
      if (!response.ok) {
        throw new Error('Error al obtener el valor total');
      }
      const data = await response.json();
      setValorTotal(data);
    } catch (error) {
      console.error('Error fetching total value:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener el valor total del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStockStatus = (stock, stockSeguridad, puntoPedido) => {
    if (stock <= stockSeguridad) {
      return { color: 'red', text: 'Bajo' };
    } else if (stock <= puntoPedido) {
      return { color: 'yellow', text: 'Medio' };
    } else {
      return { color: 'green', text: 'Óptimo' };
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
            <StatNumber>{valorTotal?.total_productos || 0}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Stock Bajo</StatLabel>
            <StatNumber>
              {inventario.filter(item => item.stock <= item.stockseguridad).length}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Necesitan reabastecimiento
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Stock Alto</StatLabel>
            <StatNumber>
              {inventario.filter(item => item.stock > item.puntopedido).length}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Stock suficiente
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Valor Total</StatLabel>
            <StatNumber>${valorTotal?.valor_total?.toFixed(2) || '0.00'}</StatNumber>
          </Stat>
        </SimpleGrid>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Producto</Th>
                <Th>Stock</Th>
                <Th>Estado</Th>
                <Th>Punto de Pedido</Th>
                <Th>Stock Seguridad</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventario.map((item) => {
                const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido);
                const producto = productos.find(p => p.idproducto === item.idproducto);
                return (
                  <Tr key={item.idinventario}>
                    <Td>{item.idinventario}</Td>
                    <Td>{producto?.nombreproducto || 'N/A'}</Td>
                    <Td>{item.stock}</Td>
                    <Td>
                      <Badge colorScheme={status.color}>{status.text}</Badge>
                    </Td>
                    <Td>{item.puntopedido}</Td>
                    <Td>{item.stockseguridad}</Td>
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

        <InventarioForm 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          inventarioId={selectedInventario?.idinventario}
          onInventarioUpdated={fetchInventario}
        />
      </Container>
    </Box>
  );
} 