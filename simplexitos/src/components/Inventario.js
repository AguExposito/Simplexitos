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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Grid,
  GridItem,
  Divider,
  useColorModeValue,
  Progress,
  Flex
} from '@chakra-ui/react';
import { EditIcon, AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';
import InventarioForm from './InventarioForm';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [valorTotal, setValorTotal] = useState({
    valor_total: 0,
    total_productos: 0,
    total_unidades: 0
  });
  const [selectedInventario, setSelectedInventario] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroStock, setFiltroStock] = useState('TODOS');
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
    cgi: 0
  });
  const [analisisProducto, setAnalisisProducto] = useState(null);

  // Mover los useColorModeValue al nivel superior
  const bgGray = useColorModeValue('gray.50', 'gray.700');
  const bgBlue = useColorModeValue('blue.50', 'blue.900');
  const bgGreen = useColorModeValue('green.50', 'green.900');
  const bgPurple = useColorModeValue('purple.50', 'purple.900');
  const textGray = useColorModeValue('gray.600', 'gray.300');

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

  // Función para filtrar inventario por estado del producto
  const getInventarioFiltrado = () => {
    let inventarioFiltrado = inventario;
    
    // Filtro por estado del producto
    if (filtroEstado !== 'TODOS') {
      inventarioFiltrado = inventarioFiltrado.filter(item => {
        const producto = productos.find(p => p.idproducto === item.idproducto);
        return producto && producto.estadoproducto === filtroEstado;
      });
    }
    
    // Filtro por stock
    if (filtroStock !== 'TODOS') {
      inventarioFiltrado = inventarioFiltrado.filter(item => {
        switch (filtroStock) {
          case 'SIN_STOCK':
            return item.stock === 0;
          case 'STOCK_BAJO':
            return item.stock > 0 && item.stock < item.stockseguridad;
          case 'STOCK_MEDIO':
            return item.stock >= item.stockseguridad && item.stock <= item.puntopedido;
          case 'STOCK_ALTO':
            return item.stock > item.puntopedido;
          default:
            return true;
        }
      });
    }
    
    return inventarioFiltrado;
  };

  const handleFiltroChange = (nuevoFiltro) => {
    setFiltroEstado(nuevoFiltro);
  };

  const handleFiltroStockChange = (nuevoFiltro) => {
    setFiltroStock(nuevoFiltro);
  };

  const handleExportar = () => {
    const inventarioFiltrado = getInventarioFiltrado();
    const datosExportar = inventarioFiltrado.map(item => {
      const producto = productos.find(p => p.idproducto === item.idproducto);
      const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido);
      
      return {
        ID: item.idinventario,
        Producto: producto?.nombreproducto || 'N/A',
        Estado_Producto: producto?.estadoproducto || 'N/A',
        Stock: item.stock,
        Estado_Stock: status.text,
        Punto_Pedido: item.puntopedido,
        Stock_Seguridad: item.stockseguridad,
        Lote_Optimo: item.loteoptimo,
        Costo_Compra: item.costocompra || 0,
        Costo_Pedido: item.costopedido || 0,
        Costo_Almacenamiento: item.costoalmacenamiento || 0,
        CGI: item.cgi || 0
      };
    });

    const csvContent = [
      Object.keys(datosExportar[0] || {}).join(','),
      ...datosExportar.map(row => Object.values(row).join(','))
    ].join('\n');

    // Crear nombre del archivo con información de filtros
    let nombreArchivo = 'inventario';
    if (filtroEstado !== 'TODOS') {
      nombreArchivo += `_${filtroEstado.toLowerCase()}`;
    }
    if (filtroStock !== 'TODOS') {
      nombreArchivo += `_${filtroStock.toLowerCase()}`;
    }
    nombreArchivo += `_${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (item) => {
    setSelectedInventario(item);
    setIsEditModalOpen(true);
  };

  const handleAnalizarProducto = async (item) => {
    try {
      const response = await fetch(`http://localhost:1234/api/inventario/${item.idinventario}`);
      const data = await response.json();
      const productoInfo = productos.find(p => p.idproducto === item.idproducto);
      setAnalisisProducto({
        ...data,
        nombreproducto: productoInfo?.nombreproducto || 'Producto'
      });
    } catch (error) {
      console.error('Error al obtener análisis del producto:', error);
    }
  };

  // Componente del gráfico
  const CostChart = ({ data }) => {
    const totalCost = (data.costocompra || 0) + (data.costopedido || 0) + (data.costoalmacenamiento || 0);
    
    const getPercentage = (value) => {
      if (totalCost === 0) return 0;
      return ((value || 0) / totalCost) * 100;
    };

    const costs = [
      { name: 'Compra', value: data.costocompra || 0, color: 'blue.400' },
      { name: 'Pedido', value: data.costopedido || 0, color: 'green.400' },
      { name: 'Almacenamiento', value: data.costoalmacenamiento || 0, color: 'yellow.400' }
    ];

    return (
      <Box>
        <VStack spacing={4} align="stretch">
          {costs.map((cost, index) => (
            <Box key={index}>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm">{cost.name}</Text>
                <Text fontSize="sm" fontWeight="bold">
                  ${cost.value.toFixed(2)} ({getPercentage(cost.value).toFixed(1)}%)
                </Text>
              </Flex>
              <Progress
                value={getPercentage(cost.value)}
                colorScheme={cost.color.split('.')[0]}
                size="sm"
                borderRadius="full"
              />
            </Box>
          ))}
          <Divider my={2} />
          <Flex justify="space-between" fontWeight="bold">
            <Text>Total (CGI)</Text>
            <Text>${totalCost.toFixed(2)}</Text>
          </Flex>
        </VStack>
      </Box>
    );
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <Heading mb={6}>Inventario</Heading>
        
        {/* Indicador del filtro activo */}
        {(filtroEstado !== 'TODOS' || filtroStock !== 'TODOS') && (
          <Box mb={4} p={3} bg="blue.50" borderRadius="md">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                {filtroEstado !== 'TODOS' && (
                  <Text fontSize="sm" fontWeight="bold" color="blue.700">
                    Estado: {filtroEstado === 'ACTIVO' ? 'Productos activos' : 'Productos inactivos'}
                  </Text>
                )}
                {filtroStock !== 'TODOS' && (
                  <Text fontSize="sm" fontWeight="bold" color="blue.700">
                    Stock: {
                      filtroStock === 'SIN_STOCK' ? 'Sin stock' :
                      filtroStock === 'STOCK_BAJO' ? 'Stock bajo' :
                      filtroStock === 'STOCK_MEDIO' ? 'Stock medio' :
                      filtroStock === 'STOCK_ALTO' ? 'Stock alto' : 'Todos'
                    }
                  </Text>
                )}
              </VStack>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  handleFiltroChange('TODOS');
                  handleFiltroStockChange('TODOS');
                }}
                color="blue.700"
              >
                Limpiar filtros
              </Button>
            </HStack>
          </Box>
        )}
        
        {/* Botones de filtro por estado */}
        <Box mb={6}>
          <HStack spacing={4} justify="space-between">
            <HStack spacing={4}>
              <Text fontWeight="bold">Filtrar por estado:</Text>
              <Button
                size="sm"
                colorScheme={filtroEstado === 'TODOS' ? 'blue' : 'gray'}
                onClick={() => handleFiltroChange('TODOS')}
              >
                Todos ({inventario.length})
              </Button>
              <Button
                size="sm"
                colorScheme={filtroEstado === 'ACTIVO' ? 'green' : 'gray'}
                onClick={() => handleFiltroChange('ACTIVO')}
              >
                Activos ({inventario.filter(item => {
                  const producto = productos.find(p => p.idproducto === item.idproducto);
                  return producto && producto.estadoproducto === 'ACTIVO';
                }).length})
              </Button>
              <Button
                size="sm"
                colorScheme={filtroEstado === 'INACTIVO' ? 'red' : 'gray'}
                onClick={() => handleFiltroChange('INACTIVO')}
              >
                Inactivos ({inventario.filter(item => {
                  const producto = productos.find(p => p.idproducto === item.idproducto);
                  return producto && producto.estadoproducto === 'INACTIVO';
                }).length})
              </Button>
            </HStack>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Mostrando {getInventarioFiltrado().length} de {inventario.length} productos
              </Text>
              {getInventarioFiltrado().length > 0 && (
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={handleExportar}
                >
                  Exportar CSV
                </Button>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Botones de filtro por stock */}
        <Box mb={6}>
          <HStack spacing={4}>
            <Text fontWeight="bold">Filtrar por stock:</Text>
            <Button
              size="sm"
              colorScheme={filtroStock === 'TODOS' ? 'blue' : 'gray'}
              onClick={() => handleFiltroStockChange('TODOS')}
            >
              Todos ({inventario.length})
            </Button>
            <Button
              size="sm"
              colorScheme={filtroStock === 'SIN_STOCK' ? 'red' : 'gray'}
              onClick={() => handleFiltroStockChange('SIN_STOCK')}
            >
              Sin Stock ({inventario.filter(item => item.stock === 0).length})
            </Button>
            <Button
              size="sm"
              colorScheme={filtroStock === 'STOCK_BAJO' ? 'orange' : 'gray'}
              onClick={() => handleFiltroStockChange('STOCK_BAJO')}
            >
              Stock Bajo ({inventario.filter(item => item.stock > 0 && item.stock < item.stockseguridad).length})
            </Button>
            <Button
              size="sm"
              colorScheme={filtroStock === 'STOCK_MEDIO' ? 'yellow' : 'gray'}
              onClick={() => handleFiltroStockChange('STOCK_MEDIO')}
            >
              Stock Medio ({inventario.filter(item => item.stock >= item.stockseguridad && item.stock <= item.puntopedido).length})
            </Button>
            <Button
              size="sm"
              colorScheme={filtroStock === 'STOCK_ALTO' ? 'green' : 'gray'}
              onClick={() => handleFiltroStockChange('STOCK_ALTO')}
            >
              Stock Alto ({inventario.filter(item => item.stock > item.puntopedido).length})
            </Button>
          </HStack>
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }} mb={8}>
          <Stat>
            <StatLabel>Total Productos</StatLabel>
            <StatNumber>{getInventarioFiltrado().length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Stock Bajo</StatLabel>
            <StatNumber>
              {getInventarioFiltrado().filter(item => item.stock < item.stockseguridad).length}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Necesitan reabastecimiento
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Stock Alto</StatLabel>
            <StatNumber>
              {getInventarioFiltrado().filter(item => item.stock > item.puntopedido).length}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Stock suficiente
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Valor Total</StatLabel>
            <StatNumber>${valorTotal.valor_total.toFixed(2)}</StatNumber>
          </Stat>
        </SimpleGrid>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Producto</Th>
                <Th>Estado Producto</Th>
                <Th>Stock</Th>
                <Th>Estado</Th>
                <Th>Punto de Pedido</Th>
                <Th>Stock Seguridad</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getInventarioFiltrado().length === 0 ? (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={8}>
                    <Text color="gray.500">
                      {filtroEstado === 'TODOS' && filtroStock === 'TODOS'
                        ? 'No hay productos en el inventario' 
                        : `No hay productos que coincidan con los filtros aplicados${
                            filtroEstado !== 'TODOS' ? ` (Estado: ${filtroEstado})` : ''
                          }${
                            filtroStock !== 'TODOS' ? ` (Stock: ${
                              filtroStock === 'SIN_STOCK' ? 'Sin stock' :
                              filtroStock === 'STOCK_BAJO' ? 'Stock bajo' :
                              filtroStock === 'STOCK_MEDIO' ? 'Stock medio' :
                              filtroStock === 'STOCK_ALTO' ? 'Stock alto' : ''
                            })` : ''
                          }`
                      }
                    </Text>
                  </Td>
                </Tr>
              ) : (
                getInventarioFiltrado().map((item) => {
                  const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido);
                  const producto = productos.find(p => p.idproducto === item.idproducto);
                  return (
                    <Tr key={item.idinventario}>
                      <Td>{item.idinventario}</Td>
                      <Td>{producto?.nombreproducto || 'N/A'}</Td>
                      <Td>
                        <Badge 
                          colorScheme={producto?.estadoproducto === 'ACTIVO' ? 'green' : 'red'}
                        >
                          {producto?.estadoproducto || 'N/A'}
                        </Badge>
                      </Td>
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
                        <Button
                          size="sm"
                          leftIcon={<EditIcon />}
                          onClick={() => handleAnalizarProducto(item)}
                        >
                          Analizar
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        <InventarioForm 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          inventarioId={selectedInventario?.idinventario}
          onInventarioUpdated={fetchInventario}
        />

        {analisisProducto && (
          <Modal isOpen={true} onClose={() => setAnalisisProducto(null)} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Heading size="md">Análisis de {analisisProducto.nombreproducto}</Heading>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <GridItem colSpan={2}>
                    <Box p={4} borderRadius="lg" bg={bgGray}>
                      <Text fontSize="lg" fontWeight="bold" mb={2}>
                        Modelo de Inventario: {analisisProducto.modeloinventario}
                      </Text>
                      <Text fontSize="md" color={textGray}>
                        Lote Óptimo: {analisisProducto.loteoptimo?.toFixed(2) || '0.00'} unidades
                      </Text>
                    </Box>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="stretch" spacing={4}>
                      <Box p={4} borderRadius="lg" bg={bgBlue}>
                        <Text fontWeight="bold" mb={2}>Costos</Text>
                        <CostChart data={analisisProducto} />
                      </Box>

                      {analisisProducto.modeloinventario === 'PERIODO_FIJO' && (
                        <Box p={4} borderRadius="lg" bg={bgGreen}>
                          <Text fontWeight="bold" mb={2}>Frecuencia de Pedidos</Text>
                          <Text>
                            {(1 / analisisProducto.tiempoOptimo)?.toFixed(2) || '0.00'} pedidos por año
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </GridItem>

                  <GridItem colSpan={1}>
                    <VStack align="stretch" spacing={4}>
                      <Box p={4} borderRadius="lg" bg={bgPurple}>
                        <Text fontWeight="bold" mb={2}>Stock</Text>
                        <VStack align="stretch" spacing={2}>
                          <Text>Stock Actual: {analisisProducto.stock || 0} unidades</Text>
                          <Text>Punto de Pedido: {analisisProducto.puntopedido || 0} unidades</Text>
                          <Text>Stock de Seguridad: {analisisProducto.stockseguridad || 0} unidades</Text>
                        </VStack>
                      </Box>
                    </VStack>
                  </GridItem>
                </Grid>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </Box>
  );
} 