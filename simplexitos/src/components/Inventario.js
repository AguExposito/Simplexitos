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
  Flex,
  Icon
} from '@chakra-ui/react';
import { EditIcon, AddIcon, TimeIcon, RepeatIcon, ViewIcon, SearchIcon } from '@chakra-ui/icons';
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
    // Ejecutar recálculo automático al acceder a la sección
    recalcularInventarioAutomatico();
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

  // Función para recargar todos los datos necesarios
  const recargarTodosLosDatos = async () => {
    await Promise.all([
      fetchInventario(),
      fetchProductos(),
      fetchValorTotal()
    ]);
  };

  const recalcularInventarioAutomatico = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario/recalcular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Recálculo automático completado:', data);
        
        // Recargar todos los datos después del recálculo
        await recargarTodosLosDatos();
        
        toast({
          title: 'Recálculo Completado',
          description: `Se actualizaron ${data.productosActualizados} productos. ${data.productosSinProveedor} productos sin proveedor.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Error en el recálculo');
      }
    } catch (error) {
      console.error('Error en recálculo automático:', error);
      toast({
        title: 'Error en Recálculo',
        description: 'No se pudo completar el recálculo automático',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStockStatus = (stock, stockSeguridad, puntoPedido, modeloproducto) => {
    if (stock <= stockSeguridad) {
      return { color: 'red', text: 'Bajo' };
    } else if (modeloproducto === 'PERIODO_FIJO') {
      // Para PERIODO_FIJO: estado medio entre stock de seguridad y lote óptimo
      // El punto de pedido en PERIODO_FIJO es igual al stock de seguridad
      if (stock <= stockSeguridad * 2) {
        return { color: 'yellow', text: 'Medio' };
      } else {
        return { color: 'green', text: 'Óptimo' };
      }
    } else {
      // Para LOTE_FIJO: estado medio entre stock de seguridad y punto de pedido
      if (stock <= puntoPedido) {
        return { color: 'yellow', text: 'Medio' };
      } else {
        return { color: 'green', text: 'Óptimo' };
      }
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
        const producto = productos.find(p => p.idproducto === item.idproducto);
        const modeloproducto = producto?.modeloproducto || 'LOTE_FIJO';
        
        switch (filtroStock) {
          case 'SIN_STOCK':
            return item.stock === 0;
          case 'STOCK_BAJO':
            return item.stock > 0 && item.stock <= item.stockseguridad;
          case 'STOCK_MEDIO':
            if (modeloproducto === 'PERIODO_FIJO') {
              return item.stock > item.stockseguridad && item.stock <= item.stockseguridad * 2;
            } else {
              return item.stock > item.stockseguridad && item.stock <= item.puntopedido;
            }
          case 'STOCK_ALTO':
            if (modeloproducto === 'PERIODO_FIJO') {
              return item.stock > item.stockseguridad * 2;
            } else {
              return item.stock > item.puntopedido;
            }
          default:
            return true;
        }
      });
    }
    
    return inventarioFiltrado;
  };

  // Función para separar inventario por modelo
  const getInventarioPorModelo = () => {
    const inventarioFiltrado = getInventarioFiltrado();
    const loteFijo = [];
    const periodoFijo = [];

    inventarioFiltrado.forEach(item => {
      const producto = productos.find(p => p.idproducto === item.idproducto);
      if (producto && producto.modeloproducto === 'PERIODO_FIJO') {
        periodoFijo.push(item);
      } else {
        loteFijo.push(item);
      }
    });

    // Debug: mostrar información sobre la separación
    console.log('Separación por modelo:', {
      totalInventario: inventarioFiltrado.length,
      loteFijo: loteFijo.length,
      periodoFijo: periodoFijo.length,
      productos: productos.length
    });

    return { loteFijo, periodoFijo };
  };

  // Función para calcular estadísticas de stock
  const getEstadisticasStock = () => {
    const inventarioFiltrado = getInventarioFiltrado();
    let stockInsuficiente = 0;
    let stockSuficiente = 0;

    inventarioFiltrado.forEach(item => {
      const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido, item.modeloproducto);
      if (status.text === 'Bajo') {
        stockInsuficiente++;
      } else {
        stockSuficiente++;
      }
    });

    return { stockInsuficiente, stockSuficiente };
  };

  // Función para calcular el valor total del inventario
  const calcularValorTotal = () => {
    const inventarioFiltrado = getInventarioFiltrado();
    let valorTotal = 0;

    inventarioFiltrado.forEach(item => {
      const producto = productos.find(p => p.idproducto === item.idproducto);
      if (producto && item.stock > 0) {
        // Buscar el precio unitario del proveedor más barato
        const precioUnitario = item.preciounitario || 0;
        valorTotal += item.stock * precioUnitario;
      }
    });

    return valorTotal;
  };

  const handleFiltroChange = (nuevoFiltro) => {
    setFiltroEstado(nuevoFiltro);
  };

  const handleFiltroStockChange = (nuevoFiltro) => {
    setFiltroStock(nuevoFiltro);
  };

  const handleExportar = () => {
    const { loteFijo, periodoFijo } = getInventarioPorModelo();
    
    // Crear datos para exportar con campos diferenciados por modelo
    const datosExportar = [];
    
    // Agregar productos LOTE_FIJO
    loteFijo.forEach(item => {
      const producto = productos.find(p => p.idproducto === item.idproducto);
      const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido, item.modeloproducto);
      
      datosExportar.push({
        ID: item.idinventario,
        Producto: producto?.nombreproducto || 'N/A',
        Modelo: 'LOTE_FIJO',
        Estado_Producto: producto?.estadoproducto || 'N/A',
        Stock: item.stock,
        Estado_Stock: status.text,
        Punto_Pedido: item.puntopedido,
        Frecuencia_Reabastecimiento: '0.00', // No aplica para LOTE_FIJO
        Stock_Seguridad: item.stockseguridad,
        Lote_Optimo: item.loteoptimo,
        Costo_Compra: item.costocompra || 0,
        Costo_Pedido: item.costopedido || 0,
        Costo_Almacenamiento: item.costoalmacenamiento || 0,
        CGI: item.cgi || 0
      });
    });
    
    // Agregar productos PERIODO_FIJO
    periodoFijo.forEach(item => {
      const producto = productos.find(p => p.idproducto === item.idproducto);
      const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido, item.modeloproducto);
      // Usar la frecuencia de reabastecimiento calculada por el backend
      const frecuenciaReabastecimiento = item.frecuenciaReabastecimiento || '0.00';
      
      datosExportar.push({
        ID: item.idinventario,
        Producto: producto?.nombreproducto || 'N/A',
        Modelo: 'PERIODO_FIJO',
        Estado_Producto: producto?.estadoproducto || 'N/A',
        Stock: item.stock,
        Estado_Stock: status.text,
        Punto_Pedido: '0', // No aplica para PERIODO_FIJO
        Frecuencia_Reabastecimiento: frecuenciaReabastecimiento,
        Stock_Seguridad: item.stockseguridad,
        Lote_Optimo: item.loteoptimo,
        Costo_Compra: item.costocompra || 0,
        Costo_Pedido: item.costopedido || 0,
        Costo_Almacenamiento: item.costoalmacenamiento || 0,
        CGI: item.cgi || 0
      });
    });

    if (datosExportar.length === 0) {
      toast({
        title: 'No hay datos',
        description: 'No hay productos para exportar con los filtros aplicados',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const csvContent = [
      Object.keys(datosExportar[0]).join(','),
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
      console.log('Analizando producto:', item.idinventario);
      const response = await fetch(`${API_BASE_URL}/inventario/${item.idinventario}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      const productoInfo = productos.find(p => p.idproducto === item.idproducto);
      setAnalisisProducto({
        ...data,
        nombreproducto: productoInfo?.nombreproducto || 'Producto'
      });
      console.log('Datos de análisis cargados:', data);
    } catch (error) {
      console.error('Error al obtener análisis del producto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el análisis del producto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCrearOrdenAutomatica = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra/automatica/${item.idinventario}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Orden Automática Creada',
          description: data.motivo,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Recargar el inventario para reflejar los cambios
        fetchInventario();
      } else {
        toast({
          title: 'No se pudo crear la orden automática',
          description: data.details || data.error,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error al crear orden automática:', error);
      toast({
        title: 'Error',
        description: 'Error al crear la orden automática',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para verificar si hay órdenes activas para un producto
  const [ordenesActivas, setOrdenesActivas] = useState({});

  const verificarOrdenesActivas = async (idinventario) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra/activas/${idinventario}`);
      if (response.ok) {
        const data = await response.json();
        setOrdenesActivas(prev => ({
          ...prev,
          [idinventario]: data.length
        }));
      }
    } catch (error) {
      console.error('Error verificando órdenes activas:', error);
    }
  };

  // Verificar órdenes activas al cargar el inventario
  useEffect(() => {
    inventario.forEach(item => {
      if (item.stock <= item.puntopedido && item.modeloproducto === 'LOTE_FIJO') {
        verificarOrdenesActivas(item.idinventario);
      }
    });
  }, [inventario]);

  // Componente del gráfico mejorado
  const CostChart = ({ data }) => {
    const totalCost = (data.costocompra || 0) + (data.costopedido || 0) + (data.costoalmacenamiento || 0);
    
    const getPercentage = (value) => {
      if (totalCost === 0) return 0;
      return ((value || 0) / totalCost) * 100;
    };

    const costs = [
      { 
        name: 'Costo de Compra', 
        value: data.costocompra || 0, 
        color: 'blue.400',
        description: 'Demanda anual × Precio unitario'
      },
      { 
        name: 'Costo de Pedido', 
        value: data.costopedido || 0, 
        color: 'green.400',
        description: '(Demanda / Lote óptimo) × Costo por pedido'
      },
      { 
        name: 'Costo de Almacenamiento', 
        value: data.costoalmacenamiento || 0, 
        color: 'yellow.400',
        description: '(Lote óptimo / 2) × Costo de almacenamiento'
      }
    ];

    return (
      <Box>
        <VStack spacing={4} align="stretch">
          {costs.map((cost, index) => (
            <Box key={index} p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="md" fontWeight="bold" color="gray.700">
                  {cost.name}
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={cost.color}>
                  ${cost.value.toFixed(2)}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.500" mb={2}>
                {cost.description}
              </Text>
              <Box mb={2}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs" color="gray.600">
                    Porcentaje del total
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">
                    {getPercentage(cost.value).toFixed(1)}%
                  </Text>
                </Flex>
                <Progress
                  value={getPercentage(cost.value)}
                  colorScheme={cost.color.split('.')[0]}
                  size="md"
                  borderRadius="full"
                  bg="gray.100"
                />
              </Box>
            </Box>
          ))}
          <Box p={4} bg="green.50" borderRadius="md" border="2px solid" borderColor="green.200">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold" color="green.700">
                Costo Total (CGI)
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                ${totalCost.toFixed(2)}
              </Text>
            </Flex>
            <Text fontSize="sm" color="green.600" mt={1}>
              Costo General de Inventario = Compra + Pedido + Almacenamiento
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <Heading mb={6}>Inventario</Heading>
        
        {/* Mensaje informativo sobre recálculo automático */}
        <Box mb={4} p={3} bg="green.50" borderRadius="md">
          <Text fontSize="sm" color="green.700">
            <strong>Recálculo Automático:</strong> Los valores de lote óptimo, stock de seguridad y punto de pedido 
            se calculan automáticamente al acceder a esta sección y cuando se crean/modifican productos.
          </Text>
        </Box>
        
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
              <Button
                size="sm"
                colorScheme="blue"
                onClick={recalcularInventarioAutomatico}
                title="Recalcular automáticamente todos los valores del inventario"
              >
                Recalcular
              </Button>
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
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={{ base: 5, lg: 8 }} mb={8}>
          <Stat>
            <StatLabel>Total Productos</StatLabel>
            <StatNumber>{getInventarioFiltrado().length}</StatNumber>
            <StatHelpText>
              <Icon as={ViewIcon} color="blue.500" mr={1} />
              Productos en inventario
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Stock Insuficiente</StatLabel>
            <StatNumber color="red.500">{getEstadisticasStock().stockInsuficiente}</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              Stock bajo
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Stock Suficiente</StatLabel>
            <StatNumber color="green.500">{getEstadisticasStock().stockSuficiente}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Stock óptimo/alto
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Lote Fijo</StatLabel>
            <StatNumber>{getInventarioPorModelo().loteFijo.length}</StatNumber>
            <StatHelpText>
              <Icon as={RepeatIcon} color="blue.500" mr={1} />
              Cantidad fija
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Período Fijo</StatLabel>
            <StatNumber>{getInventarioPorModelo().periodoFijo.length}</StatNumber>
            <StatHelpText>
              <Icon as={TimeIcon} color="green.500" mr={1} />
              Tiempo fijo
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Valor Total</StatLabel>
            <StatNumber>${valorTotal.valor_total.toFixed(2)}</StatNumber>
            <StatHelpText>
              Valor del inventario
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box overflowX="auto">
          {/* Tabla para LOTE_FIJO */}
          <Box mb={8}>
            <Heading size="md" mb={4} color="blue.600">
              <Icon as={RepeatIcon} mr={2} />
              Modelo Lote Fijo (EOQ) - {getInventarioPorModelo().loteFijo.length} productos
            </Heading>
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
                  <Th>Lote Óptimo</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getInventarioPorModelo().loteFijo.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">
                        No hay productos con modelo Lote Fijo que coincidan con los filtros aplicados
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  getInventarioPorModelo().loteFijo.map((item) => {
                    const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido, item.modeloproducto);
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
                        <Td>{item.loteoptimo}</Td>
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
                            leftIcon={<SearchIcon />}
                            onClick={() => handleAnalizarProducto(item)}
                          >
                            Analizar
                          </Button>
                          {item.stock <= item.puntopedido && item.modeloproducto === 'LOTE_FIJO' && 
                           (!ordenesActivas[item.idinventario] || ordenesActivas[item.idinventario] === 0) && (
                            <Button
                              size="sm"
                              colorScheme="orange"
                              leftIcon={<AddIcon />}
                              onClick={() => handleCrearOrdenAutomatica(item)}
                              title="Crear orden automática - Stock bajo"
                            >
                              Orden Auto
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>

          {/* Tabla para PERIODO_FIJO */}
          <Box>
            <Heading size="md" mb={4} color="green.600">
              <Icon as={TimeIcon} mr={2} />
              Modelo Período Fijo - {getInventarioPorModelo().periodoFijo.length} productos
            </Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Producto</Th>
                  <Th>Estado Producto</Th>
                  <Th>Stock</Th>
                  <Th>Estado</Th>
                  <Th>Frecuencia Reabastecimiento</Th>
                  <Th>Stock Seguridad</Th>
                  <Th>Lote Óptimo</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getInventarioPorModelo().periodoFijo.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">
                        No hay productos con modelo Período Fijo que coincidan con los filtros aplicados
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  getInventarioPorModelo().periodoFijo.map((item) => {
                    const status = getStockStatus(item.stock, item.stockseguridad, item.puntopedido, item.modeloproducto);
                    const producto = productos.find(p => p.idproducto === item.idproducto);
                    // Usar la frecuencia de reabastecimiento calculada por el backend
                    const frecuenciaReabastecimiento = item.frecuenciaReabastecimiento || '0.00';
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
                        <Td>{frecuenciaReabastecimiento} pedidos/año</Td>
                        <Td>{item.stockseguridad}</Td>
                        <Td>{item.loteoptimo}</Td>
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
                            leftIcon={<SearchIcon />}
                            onClick={() => handleAnalizarProducto(item)}
                          >
                            Analizar
                          </Button>
                          {item.stock <= item.stockseguridad && item.modeloproducto === 'PERIODO_FIJO' && 
                           (!ordenesActivas[item.idinventario] || ordenesActivas[item.idinventario] === 0) && (
                            <Button
                              size="sm"
                              colorScheme="orange"
                              leftIcon={<AddIcon />}
                              onClick={() => handleCrearOrdenAutomatica(item)}
                              title="Crear orden manual - Stock bajo"
                            >
                              Orden Manual
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
          <Text fontSize="xs" color="gray.500" mt={2}>
            * Valores calculados automáticamente según las fórmulas del modelo de inventario
          </Text>
        </Box>

        <InventarioForm 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          inventarioId={selectedInventario?.idinventario}
          onInventarioUpdated={recargarTodosLosDatos}
        />

        {analisisProducto && (
          <Modal isOpen={true} onClose={() => setAnalisisProducto(null)} size="6xl">
            <ModalOverlay />
            <ModalContent maxH="90vh" overflow="hidden">
              <ModalHeader>
                <Heading size="lg">Análisis Detallado de {analisisProducto.nombreproducto}</Heading>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6} overflowY="auto">
                {/* Información general del producto */}
                <Box p={6} borderRadius="lg" bg={bgGray} mb={6}>
                  <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                        Modelo de Inventario
                      </Text>
                      <Badge 
                        colorScheme={analisisProducto.modeloinventario === 'LOTE_FIJO' ? 'blue' : 'green'} 
                        fontSize="md" 
                        p={2}
                      >
                        {analisisProducto.modeloinventario}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color="purple.600" mb={2}>
                        Lote Óptimo
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {analisisProducto.loteoptimo?.toFixed(0) || '0'} unidades
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color="orange.600" mb={2}>
                        Costo Total (CGI)
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.600">
                        ${analisisProducto.cgi?.toFixed(2) || '0.00'}
                      </Text>
                    </Box>
                  </Grid>
                </Box>

                {/* Layout principal con 3 columnas */}
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  {/* Columna 1: Costos y Análisis Financiero */}
                  <GridItem>
                    <VStack align="stretch" spacing={6}>
                      {/* Gráfica de Costos Mejorada */}
                      <Box p={6} borderRadius="lg" bg={bgBlue} boxShadow="md">
                        <Text fontSize="lg" fontWeight="bold" mb={4} color="blue.700">
                          Análisis de Costos
                        </Text>
                        <CostChart data={analisisProducto} />
                      </Box>

                      {/* Información de Stock */}
                      <Box p={6} borderRadius="lg" bg={bgPurple} boxShadow="md">
                        <Text fontSize="lg" fontWeight="bold" mb={4} color="purple.700">
                          Estado del Stock
                        </Text>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Stock Actual:</Text>
                            <Badge 
                              colorScheme={analisisProducto.stock > (analisisProducto.stockseguridad || 0) ? 'green' : 'red'}
                              fontSize="md"
                              p={2}
                            >
                              {analisisProducto.stock || 0} unidades
                            </Badge>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Stock de Seguridad:</Text>
                            <Text fontWeight="bold">{analisisProducto.stockseguridad || 0} unidades</Text>
                          </Flex>
                          {analisisProducto.modeloinventario === 'LOTE_FIJO' ? (
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="medium">Punto de Pedido:</Text>
                              <Text fontWeight="bold">{analisisProducto.puntopedido || 0} unidades</Text>
                            </Flex>
                          ) : (
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="medium">Frecuencia Reabastecimiento:</Text>
                              <Text fontWeight="bold">
                                {analisisProducto.frecuenciaReabastecimiento || '0.00'} pedidos/año
                              </Text>
                            </Flex>
                          )}
                        </VStack>
                      </Box>
                    </VStack>
                  </GridItem>

                  {/* Columna 2: Historial y Métricas */}
                  <GridItem>
                    <VStack align="stretch" spacing={6}>
                      {/* Historial de Pedidos Mejorado */}
                      <Box p={6} borderRadius="lg" bg={bgGreen} boxShadow="md">
                        <Text fontSize="lg" fontWeight="bold" mb={4} color="green.700">
                          Historial de Pedidos
                        </Text>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Total Órdenes:</Text>
                            <Badge colorScheme="blue" fontSize="md" p={2}>
                              {analisisProducto.frecuenciaHistorica?.totalOrdenes || 0}
                            </Badge>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Frecuencia Promedio:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.frecuenciaHistorica?.frecuencia || 0} pedidos/año
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Período Promedio:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.frecuenciaHistorica?.periodoPromedio || 0} días
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Cantidad Promedio:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.frecuenciaHistorica?.cantidadPromedio || 0} unidades
                            </Text>
                          </Flex>
                          {analisisProducto.frecuenciaHistorica?.totalOrdenes === 0 && (
                            <Box p={3} bg="gray.100" borderRadius="md">
                              <Text fontSize="sm" color="gray.600" textAlign="center">
                                No hay órdenes de compra históricas para este producto
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </Box>

                      {/* Métricas de Rendimiento */}
                      <Box p={6} borderRadius="lg" bg={bgGray} boxShadow="md">
                        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
                          Métricas de Rendimiento
                        </Text>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Eficiencia de Stock:</Text>
                            <Badge 
                              colorScheme={
                                analisisProducto.stock > (analisisProducto.stockseguridad || 0) ? 'green' : 
                                analisisProducto.stock > 0 ? 'yellow' : 'red'
                              }
                              fontSize="md"
                            >
                              {analisisProducto.stock > (analisisProducto.stockseguridad || 0) ? 'Óptima' : 
                               analisisProducto.stock > 0 ? 'Media' : 'Baja'}
                            </Badge>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Rotación Anual:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.demanda && analisisProducto.stock > 0 
                                ? (analisisProducto.demanda / analisisProducto.stock).toFixed(2) 
                                : '0.00'} veces
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Cobertura de Stock:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.demanda && analisisProducto.stock > 0 
                                ? (analisisProducto.stock / (analisisProducto.demanda / 365)).toFixed(1) 
                                : '0.0'} días
                            </Text>
                          </Flex>
                        </VStack>
                      </Box>
                    </VStack>
                  </GridItem>

                  {/* Columna 3: Últimas Órdenes y Acciones */}
                  <GridItem>
                    <VStack align="stretch" spacing={6}>
                      {/* Últimas Órdenes de Compra */}
                      {analisisProducto.ultimasOrdenes && analisisProducto.ultimasOrdenes.length > 0 ? (
                        <Box p={6} borderRadius="lg" bg={bgBlue} boxShadow="md">
                          <Text fontSize="lg" fontWeight="bold" mb={4} color="blue.700">
                            Últimas Órdenes de Compra ({analisisProducto.ultimasOrdenes.length})
                          </Text>
                          <VStack align="stretch" spacing={3}>
                            {analisisProducto.ultimasOrdenes.map((orden, index) => (
                              <Box key={index} p={4} bg="white" borderRadius="md" boxShadow="sm">
                                <Flex justify="space-between" align="center" mb={2}>
                                  <Text fontSize="md" fontWeight="bold">
                                    Orden #{orden.idorden_compra}
                                  </Text>
                                  <Badge 
                                    colorScheme={
                                      orden.estadoorden === 'FINALIZADA' ? 'green' :
                                      orden.estadoorden === 'ENVIADA' ? 'blue' : 
                                      orden.estadoorden === 'PENDIENTE' ? 'yellow' : 'red'
                                    }
                                    size="sm"
                                  >
                                    {orden.estadoorden}
                                  </Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.600" mb={1}>
                                  {new Date(orden.fechaorden).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Text>
                                <Text fontSize="sm" mb={1}>
                                  <strong>Cantidad:</strong> {orden.cantidadsolicitada} unidades
                                </Text>
                                <Text fontSize="sm" mb={1}>
                                  <strong>Proveedor:</strong> {orden.nombreprove}
                                </Text>
                                {orden.descripcionordendecompra && (
                                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                    {orden.descripcionordendecompra}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      ) : (
                        <Box p={6} borderRadius="lg" bg={bgGray} boxShadow="md">
                          <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
                            Órdenes de Compra
                          </Text>
                          <Box p={4} bg="white" borderRadius="md">
                            <Text fontSize="sm" color="gray.600" textAlign="center">
                              No hay órdenes de compra registradas para este producto
                            </Text>
                          </Box>
                        </Box>
                      )}

                      {/* Información del Proveedor */}
                      <Box p={6} borderRadius="lg" bg={bgPurple} boxShadow="md">
                        <Text fontSize="lg" fontWeight="bold" mb={4} color="purple.700">
                          Información del Proveedor
                        </Text>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Precio Unitario:</Text>
                            <Text fontWeight="bold">
                              ${analisisProducto.preciounitario?.toFixed(2) || '0.00'}
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Costo de Pedido:</Text>
                            <Text fontWeight="bold">
                              ${analisisProducto.costopedido?.toFixed(2) || '0.00'}
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium">Tiempo de Envío:</Text>
                            <Text fontWeight="bold">
                              {analisisProducto.tiempoenvio || 0} días
                            </Text>
                          </Flex>
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