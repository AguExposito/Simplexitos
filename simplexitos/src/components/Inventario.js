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
} from '@chakra-ui/react';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockBajo: 0,
    stockAlto: 0,
    valorTotal: 0
  });
  const toast = useToast();

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await fetch('http://localhost:3001/inventario');
      const data = await response.json();
      setInventario(data);
      
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

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading mb={6}>Inventario</Heading>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <Stat>
          <StatLabel>Total Productos</StatLabel>
          <StatNumber>{stats.totalProductos}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            En inventario
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Stock Bajo</StatLabel>
          <StatNumber>{stats.stockBajo}</StatNumber>
          <StatHelpText>
            <StatArrow type="decrease" />
            Necesitan reposición
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Stock Alto</StatLabel>
          <StatNumber>{stats.stockAlto}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            Bien abastecidos
          </StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Valor Total</StatLabel>
          <StatNumber>${stats.valorTotal.toFixed(2)}</StatNumber>
          <StatHelpText>
            En inventario
          </StatHelpText>
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
              <Th>Lote Óptimo</Th>
              <Th>Estado</Th>
              <Th>Modelo</Th>
            </Tr>
          </Thead>
          <Tbody>
            {inventario.map((item) => {
              const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido);
              return (
                <Tr key={item.idinventario}>
                  <Td>{item.idinventario}</Td>
                  <Td>{item.idproducto}</Td>
                  <Td>{item.stock}</Td>
                  <Td>{item.stockseguridad}</Td>
                  <Td>{item.puntopedido}</Td>
                  <Td>{item.loteoptimo}</Td>
                  <Td>
                    <Badge colorScheme={status.color}>
                      {status.text}
                    </Badge>
                  </Td>
                  <Td>{item.modeloinventario}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
} 