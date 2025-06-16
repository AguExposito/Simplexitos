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
  const [valorTotal, setValorTotal] = useState({
    valor_total: 0,
    total_productos: 0,
    total_unidades: 0
  });
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
  const [analisisProducto, setAnalisisProducto] = useState(null);

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

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <Heading mb={6}>Inventario</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }} mb={8}>
          <Stat>
            <StatLabel>Total Productos</StatLabel>
            <StatNumber>{valorTotal.total_productos}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Stock Bajo</StatLabel>
            <StatNumber>
              {inventario.filter(item => item.stock < item.stockseguridad).length}
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
            <StatNumber>${valorTotal.valor_total.toFixed(2)}</StatNumber>
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

        {analisisProducto && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Análisis de {analisisProducto.nombreproducto}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Modelo de Inventario</h4>
                    <p className="text-gray-600">{analisisProducto.modeloinventario || 'No especificado'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Lote Óptimo</h4>
                    <p className="text-gray-600">{analisisProducto.loteoptimo?.toFixed(2) || '0.00'} unidades</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Costos</h4>
                    <div className="pl-4 space-y-2">
                      <p className="text-gray-600">
                        Costo de Compra: ${analisisProducto.costocompra?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-gray-600">
                        Costo de Pedido: ${analisisProducto.costopedido?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-gray-600">
                        Costo de Almacenamiento: ${analisisProducto.costoalmacenamiento?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-gray-600 font-bold">
                        Costo Total (CGI): ${analisisProducto.cgi?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  {analisisProducto.modeloinventario === 'PERIODO_FIJO' && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Frecuencia de Pedidos</h4>
                      <p className="text-gray-600">
                        {(1 / analisisProducto.tiempoOptimo)?.toFixed(2) || '0.00'} pedidos por año
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-700">Stock Actual</h4>
                    <p className="text-gray-600">{analisisProducto.stock || 0} unidades</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Punto de Pedido</h4>
                    <p className="text-gray-600">{analisisProducto.puntopedido || 0} unidades</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Stock de Seguridad</h4>
                    <p className="text-gray-600">{analisisProducto.stockseguridad || 0} unidades</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setAnalisisProducto(null)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </Box>
  );
} 