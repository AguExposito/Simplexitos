import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Container,
  Heading,
  Text,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaBox, FaTruck, FaShoppingCart, FaClipboardList } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalProveedores: 0,
    totalVentas: 0,
    totalOrdenes: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productosRes, proveedoresRes, ventasRes, ordenesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/productos`).then(res => res.json()),
        fetch(`${API_BASE_URL}/proveedores`).then(res => res.json()),
        fetch(`${API_BASE_URL}/ventas`).then(res => res.json()),
        fetch(`${API_BASE_URL}/ordenes-compra`).then(res => res.json())
      ]);
      
      const productos = Array.isArray(productosRes) ? productosRes : [];
      const proveedores = Array.isArray(proveedoresRes) ? proveedoresRes : [];
      const ventas = Array.isArray(ventasRes) ? ventasRes : [];
      const ordenes = Array.isArray(ordenesRes) ? ordenesRes : [];

      setStats({
        totalProductos: productos.length,
        totalProveedores: proveedores.length,
        totalVentas: ventas.length,
        totalOrdenes: ordenes.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // En caso de error, mantener los valores actuales
      setStats(prevStats => ({
        ...prevStats
      }));
    }
  };

  const StatCard = ({ title, stat, icon, helpText }) => (
    <Stat
      px={{ base: 2, md: 4 }}
      py="5"
      shadow="xl"
      border="1px solid"
      borderColor="gray.200"
      rounded="lg"
    >
      <Flex justifyContent="space-between">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="medium">
            {stat}
          </StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {helpText}
          </StatHelpText>
        </Box>
        <Box
          my="auto"
          color="gray.500"
          alignContent="center"
        >
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Flex>
    </Stat>
  );

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <Heading mb={6}>Dashboard</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }}>
          <StatCard
            title="Productos"
            stat={stats.totalProductos}
            icon={FaBox}
            helpText="En inventario"
          />
          <StatCard
            title="Proveedores"
            stat={stats.totalProveedores}
            icon={FaTruck}
            helpText="Activos"
          />
          <StatCard
            title="Ventas"
            stat={stats.totalVentas}
            icon={FaShoppingCart}
            helpText="Realizadas"
          />
          <StatCard
            title="Órdenes de Compra"
            stat={stats.totalOrdenes}
            icon={FaClipboardList}
            helpText="Pendientes"
          />
        </SimpleGrid>

        <Box mt={10}>
          <Heading size="md" mb={4}>Bienvenido al Sistema de Gestión</Heading>
          <Text>
            Este sistema le permite gestionar su inventario, proveedores, ventas y órdenes de compra.
            Utilice el menú de navegación para acceder a las diferentes secciones.
          </Text>
        </Box>
      </Container>
    </Box>
  );
} 