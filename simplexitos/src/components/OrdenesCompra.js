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
  Select,
  useToast,
  Heading,
  HStack,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Container,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { AddIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [productosPorProveedor, setProductosPorProveedor] = useState([]);
  const [proveedoresPorProducto, setProveedoresPorProducto] = useState([]);
  const [seleccionInicial, setSeleccionInicial] = useState('proveedor'); // 'proveedor' o 'producto'
  const [ordenesActivas, setOrdenesActivas] = useState([]);
  const [sugerencias, setSugerencias] = useState({
    proveedorPredeterminado: null,
    loteOptimo: 0,
    precioUnitario: 0,
    productosPredeterminados: [],
    productosConInventario: [],
    productoRecomendado: null
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    idinventario: '',
    idproveedor: '',
    descripcionordendecompra: '',
    cantidadsolicitada: 1
  });

  useEffect(() => {
    fetchOrdenes();
    fetchProveedores();
    fetchInventario();
  }, []);

  // Cargar productos por proveedor cuando se selecciona un proveedor
  useEffect(() => {
    if (formData.idproveedor && seleccionInicial === 'proveedor') {
      fetchProductosPorProveedor(formData.idproveedor);
    }
  }, [formData.idproveedor, seleccionInicial]);

  // Cargar proveedores cuando se selecciona un producto
  useEffect(() => {
    if (formData.idinventario && seleccionInicial === 'producto') {
      fetchProveedoresPorProducto(formData.idinventario);
      verificarOrdenesActivas(formData.idinventario);
    }
  }, [formData.idinventario, seleccionInicial]);

  // Cargar sugerencias cuando se cargan los proveedores por producto
  useEffect(() => {
    if (proveedoresPorProducto.length > 0 && formData.idinventario && seleccionInicial === 'producto') {
      obtenerSugerencias(formData.idinventario);
    }
  }, [proveedoresPorProducto, formData.idinventario, seleccionInicial]);

  // Cargar sugerencias cuando se selecciona un proveedor
  useEffect(() => {
    if (formData.idproveedor && seleccionInicial === 'proveedor' && productosPorProveedor.length > 0) {
      obtenerSugerenciasPorProveedor(formData.idproveedor, productosPorProveedor);
    }
  }, [formData.idproveedor, seleccionInicial, productosPorProveedor]);

  const fetchOrdenes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra`);
      const data = await response.json();
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes de compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor`);
      const data = await response.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchInventario = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventario`);
      const data = await response.json();
      setInventario(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del inventario',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProductosPorProveedor = async (idproveedor) => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedor-producto/proveedor/${idproveedor}`);
      if (response.ok) {
        const data = await response.json();
        setProductosPorProveedor(data);
        
        // Obtener sugerencias para el proveedor seleccionado
        if (data.length > 0) {
          obtenerSugerenciasPorProveedor(idproveedor, data);
        }
        
        if (data.length === 0) {
          toast({
            title: 'Sin productos',
            description: 'Este proveedor no tiene productos asignados',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching products by provider:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del proveedor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchProveedoresPorProducto = async (idinventario) => {
    try {
      // Obtener el idproducto del inventario
      const inventarioItem = inventario.find(item => item.idinventario === parseInt(idinventario));
      if (inventarioItem) {
        const response = await fetch(`${API_BASE_URL}/proveedor-producto/producto/${inventarioItem.idproducto}`);
        if (response.ok) {
          const data = await response.json();
          setProveedoresPorProducto(data);
          if (data.length === 0) {
            toast({
              title: 'Sin proveedores',
              description: 'Este producto no tiene proveedores asignados',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching providers by product:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores del producto',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const verificarOrdenesActivas = async (idinventario) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra/activas/${idinventario}`);
      if (response.ok) {
        const data = await response.json();
        setOrdenesActivas(data);
        
        // Mostrar notificación si hay órdenes activas
        if (data.length > 0) {
          const ordenesPendientes = data.filter(o => o.estadoorden === 'PENDIENTE').length;
          const ordenesEnviadas = data.filter(o => o.estadoorden === 'ENVIADA').length;
          
          let descripcion = `Este producto tiene ${data.length} orden(es) activa(s): `;
          if (ordenesPendientes > 0) {
            descripcion += `${ordenesPendientes} pendiente(s)`;
          }
          if (ordenesEnviadas > 0) {
            if (ordenesPendientes > 0) descripcion += ', ';
            descripcion += `${ordenesEnviadas} enviada(s)`;
          }
          descripcion += '. Se le pedirá confirmación antes de crear una nueva orden.';
          
          toast({
            title: 'Órdenes Activas Detectadas',
            description: descripcion,
            status: 'warning',
            duration: 6000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error verificando órdenes activas:', error);
      // No mostrar error al usuario ya que es una verificación automática
    }
  };

  const obtenerSugerencias = async (idinventario) => {
    try {
      const inventarioItem = inventario.find(item => item.idinventario === parseInt(idinventario));
      if (inventarioItem && proveedoresPorProducto.length > 0) {
        // Buscar el proveedor predeterminado
        const proveedorPredeterminado = proveedoresPorProducto.find(p => p.proveedor_predeterminado);
        
        setSugerencias({
          proveedorPredeterminado: proveedorPredeterminado || null,
          loteOptimo: inventarioItem.loteoptimo || 0,
          precioUnitario: proveedorPredeterminado?.preciounitario || 0,
          productosPredeterminados: [],
          productosConInventario: [],
          productoRecomendado: null
        });

        // Si hay proveedor predeterminado, sugerirlo automáticamente
        if (proveedorPredeterminado) {
          setFormData(prev => ({
            ...prev,
            idproveedor: proveedorPredeterminado.idproveedor,
            cantidadsolicitada: inventarioItem.loteoptimo || 1
          }));
        }
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    }
  };

  const obtenerSugerenciasPorProveedor = async (idproveedor, productosData) => {
    try {
      // Buscar productos donde este proveedor es predeterminado
      const productosPredeterminados = productosData.filter(p => p.proveedor_predeterminado);
      
      // Obtener información del inventario para todos los productos
      const productosConInventario = productosData.map(producto => {
        const inventarioItem = inventario.find(item => item.idproducto === producto.idproducto);
        return {
          ...producto,
          inventario: inventarioItem,
          esPredeterminado: producto.proveedor_predeterminado
        };
      });

      // Encontrar el primer producto predeterminado o el primero disponible
      const productoRecomendado = productosPredeterminados.length > 0 
        ? productosPredeterminados[0] 
        : productosData[0];

      const inventarioItem = inventario.find(item => item.idproducto === productoRecomendado.idproducto);
      
      setSugerencias({
        proveedorPredeterminado: null,
        loteOptimo: inventarioItem?.loteoptimo || 0,
        precioUnitario: productoRecomendado?.preciounitario || 0,
        productosPredeterminados: productosPredeterminados,
        productosConInventario: productosConInventario,
        productoRecomendado: productoRecomendado
      });

      // Si hay un producto predeterminado, sugerir automáticamente el lote óptimo
      if (inventarioItem?.loteoptimo) {
        setFormData(prev => ({
          ...prev,
          cantidadsolicitada: inventarioItem.loteoptimo
        }));
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias por proveedor:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar la selección dependiente cuando cambia la selección inicial
    if (name === 'idproveedor' && seleccionInicial === 'proveedor') {
      setFormData(prev => ({ ...prev, idinventario: '' }));
      setOrdenesActivas([]); // Limpiar órdenes activas al cambiar proveedor
    } else if (name === 'idinventario' && seleccionInicial === 'producto') {
      setFormData(prev => ({ ...prev, idproveedor: '' }));
      setOrdenesActivas([]); // Limpiar órdenes activas al cambiar producto
    }

    // Si se selecciona un producto y es predeterminado, sugerir el lote óptimo
    if (name === 'idinventario' && seleccionInicial === 'proveedor' && value) {
      const inventarioItem = inventario.find(item => item.idinventario === parseInt(value));
      if (inventarioItem) {
        const productoSeleccionado = productosPorProveedor.find(p => p.idproducto === inventarioItem.idproducto);
        if (productoSeleccionado?.proveedor_predeterminado && inventarioItem.loteoptimo) {
          setFormData(prev => ({
            ...prev,
            cantidadsolicitada: inventarioItem.loteoptimo
          }));
        }
        
        // Verificar órdenes activas cuando se selecciona un producto en el flujo "Proveedor Primero"
        verificarOrdenesActivas(value);
      }
    }
    
    // Verificar órdenes activas también para el flujo "Producto Primero"
    if (name === 'idinventario' && seleccionInicial === 'producto' && value) {
      verificarOrdenesActivas(value);
    }
  };

  const handleSeleccionInicialChange = (tipo) => {
    setSeleccionInicial(tipo);
    // Limpiar ambos campos cuando cambia el tipo de selección
    setFormData(prev => ({
      ...prev,
      idinventario: '',
      idproveedor: ''
    }));
    setProductosPorProveedor([]);
    setProveedoresPorProducto([]);
    setOrdenesActivas([]); // Limpiar órdenes activas al cambiar tipo de selección
    setSugerencias({
      proveedorPredeterminado: null,
      loteOptimo: 0,
      precioUnitario: 0,
      productosPredeterminados: [],
      productosConInventario: [],
      productoRecomendado: null
    });
  };

  const aplicarSugerencias = () => {
    if (seleccionInicial === 'producto' && sugerencias.proveedorPredeterminado) {
      setFormData(prev => ({
        ...prev,
        idproveedor: sugerencias.proveedorPredeterminado.idproveedor,
        cantidadsolicitada: sugerencias.loteOptimo
      }));
    } else if (seleccionInicial === 'proveedor' && sugerencias.productoRecomendado) {
      const inventarioItem = inventario.find(item => item.idproducto === sugerencias.productoRecomendado.idproducto);
      setFormData(prev => ({
        ...prev,
        idinventario: inventarioItem?.idinventario || '',
        cantidadsolicitada: sugerencias.loteOptimo
      }));
    } else if (sugerencias.loteOptimo > 0) {
      setFormData(prev => ({
        ...prev,
        cantidadsolicitada: sugerencias.loteOptimo
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar si hay órdenes activas y mostrar confirmación
    if (ordenesActivas.length > 0) {
      const confirmar = window.confirm(
        `⚠️ ADVERTENCIA: Este producto tiene ${ordenesActivas.length} orden(es) activa(s).\n\n` +
        `¿Está seguro de que desea crear una nueva orden de compra?\n\n` +
        `Órdenes activas:\n` +
        ordenesActivas.map(orden => 
          `- Orden #${orden.idorden_compra}: ${orden.cantidadsolicitada} unidades (${orden.estadoorden})`
        ).join('\n')
      );
      
      if (!confirmar) {
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Orden de compra creada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchOrdenes();
        onClose();
        setFormData({
          idinventario: '',
          idproveedor: '',
          descripcionordendecompra: '',
          cantidadsolicitada: 1
        });
        setProductosPorProveedor([]);
        setProveedoresPorProducto([]);
        setOrdenesActivas([]);
        setSugerencias({
          proveedorPredeterminado: null,
          loteOptimo: 0,
          precioUnitario: 0,
          productosPredeterminados: [],
          productosConInventario: [],
          productoRecomendado: null
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la orden de compra');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al crear la orden de compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getProveedorNombre = (idproveedor) => {
    const proveedor = proveedores.find(p => p.idproveedor === idproveedor);
    return proveedor ? proveedor.nombreprove : 'N/A';
  };

  const getProductoNombre = (idinventario) => {
    const item = inventario.find(i => i.idinventario === idinventario);
    return item ? `${item.nombreproducto || 'N/A'} (ID: ${item.idinventario})` : 'N/A';
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'PENDIENTE': { color: 'yellow', text: 'Pendiente' },
      'ENVIADA': { color: 'blue', text: 'Enviada' },
      'FINALIZADA': { color: 'green', text: 'Finalizada' },
      'CANCELADA': { color: 'red', text: 'Cancelada' }
    };
    const estadoInfo = estados[estado] || { color: 'gray', text: estado };
    return <Badge colorScheme={estadoInfo.color}>{estadoInfo.text}</Badge>;
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Está seguro de eliminar todo el historial de órdenes de compra? Esta acción no se puede deshacer.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/orden-compra/all`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Historial de órdenes de compra eliminado correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          fetchOrdenes();
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Hubo un error al eliminar el historial de órdenes de compra',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEnviarOrden = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orden-compra/${id}/recibir`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Orden de compra enviada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchOrdenes();
      } else {
        toast({
          title: 'Error',
          description: data.details || data.error || 'Error al enviar la orden de compra',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al enviar la orden de compra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancelarOrden = async (id) => {
    if (window.confirm('¿Está seguro de cancelar esta orden de compra?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/orden-compra/${id}/cancelar`, {
          method: 'PUT',
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Orden de compra cancelada correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          fetchOrdenes();
        } else {
          toast({
            title: 'Error',
            description: data.details || data.error || 'Error al cancelar la orden de compra',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al cancelar la orden de compra',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleFinalizarOrden = async (id) => {
    if (window.confirm('¿Está seguro de finalizar esta orden de compra? Esto actualizará el inventario.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/orden-compra/${id}/finalizar`, {
          method: 'PUT',
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Éxito',
            description: 'Orden de compra finalizada correctamente',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Mostrar advertencia si el stock no supera el punto de pedido
          if (data.advertencia) {
            toast({
              title: 'Advertencia',
              description: data.advertencia.mensaje,
              status: 'warning',
              duration: 8000,
              isClosable: true,
            });
          }
          
          fetchOrdenes();
        } else {
          toast({
            title: 'Error',
            description: data.details || data.error || 'Error al finalizar la orden de compra',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al finalizar la orden de compra',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box maxW="7xl" mx="auto" pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Container maxW="container.xl">
        <HStack justify="space-between" mb={6}>
          <Heading>Órdenes de Compra</Heading>
          <HStack spacing={4}>
            <Button colorScheme="red" onClick={handleDeleteAll}>
              Eliminar Historial
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
              Nueva Orden
            </Button>
          </HStack>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Producto</Th>
                <Th>Proveedor</Th>
                <Th>Cantidad</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>Descripción</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {ordenes.map((orden) => (
                <Tr key={orden.idorden_compra}>
                  <Td>{orden.idorden_compra}</Td>
                  <Td>{getProductoNombre(orden.idinventario)}</Td>
                  <Td>{getProveedorNombre(orden.idproveedor)}</Td>
                  <Td>{orden.cantidadsolicitada}</Td>
                  <Td>{getEstadoBadge(orden.estadoorden)}</Td>
                  <Td>{new Date(orden.fechaorden).toLocaleDateString()}</Td>
                  <Td>{orden.descripcionordendecompra || 'N/A'}</Td>
                  <Td>
                    <HStack spacing={2}>
                      {orden.estadoorden === 'PENDIENTE' && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEnviarOrden(orden.idorden_compra)}
                          >
                            Enviar
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleCancelarOrden(orden.idorden_compra)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {orden.estadoorden === 'ENVIADA' && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleFinalizarOrden(orden.idorden_compra)}
                        >
                          Finalizar
                        </Button>
                      )}
                      {(orden.estadoorden === 'FINALIZADA' || orden.estadoorden === 'CANCELADA') && (
                        <Text fontSize="sm" color="gray.500">
                          Sin acciones disponibles
                        </Text>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nueva Orden de Compra</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form onSubmit={handleSubmit}>
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Selección Dependiente</Text>
                    <Text fontSize="sm">
                      Elige si quieres seleccionar primero el proveedor o el producto. 
                      Luego solo se mostrarán las opciones disponibles.
                    </Text>
                  </VStack>
                </Alert>

                <HStack spacing={4} mb={4}>
                  <Button
                    size="sm"
                    colorScheme={seleccionInicial === 'proveedor' ? 'blue' : 'gray'}
                    onClick={() => handleSeleccionInicialChange('proveedor')}
                  >
                    Seleccionar Proveedor Primero
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={seleccionInicial === 'producto' ? 'blue' : 'gray'}
                    onClick={() => handleSeleccionInicialChange('producto')}
                  >
                    Seleccionar Producto Primero
                  </Button>
                </HStack>

                {seleccionInicial === 'proveedor' ? (
                  <>
                    <FormControl mb={4}>
                      <FormLabel>Proveedor</FormLabel>
                      <Select
                        name="idproveedor"
                        value={formData.idproveedor}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccione un proveedor</option>
                        {proveedores.map((proveedor) => (
                          <option key={proveedor.idproveedor} value={proveedor.idproveedor}>
                            {proveedor.nombreprove}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>Producto (disponible para el proveedor seleccionado)</FormLabel>
                      <Select
                        name="idinventario"
                        value={formData.idinventario}
                        onChange={handleInputChange}
                        required
                        isDisabled={!formData.idproveedor}
                      >
                        <option value="">
                          {formData.idproveedor 
                            ? productosPorProveedor.length > 0
                              ? `Seleccione un producto (${productosPorProveedor.length} disponibles)`
                              : 'Este proveedor no tiene productos asignados'
                            : 'Primero seleccione un proveedor'
                          }
                        </option>
                        {productosPorProveedor.map((producto) => {
                          const inventarioItem = inventario.find(item => item.idproducto === producto.idproducto);
                          const esPredeterminado = producto.proveedor_predeterminado;
                          const loteOptimo = inventarioItem?.loteoptimo;
                          return inventarioItem ? (
                            <option key={inventarioItem.idinventario} value={inventarioItem.idinventario}>
                              {esPredeterminado ? '⭐ ' : ''}{producto.nombreproducto} - ${producto.preciounitario}
                              {esPredeterminado ? ' (Predeterminado)' : ''}
                              {loteOptimo ? ` - Lote: ${loteOptimo}` : ''}
                            </option>
                          ) : null;
                        })}
                      </Select>
                      {formData.idproveedor && productosPorProveedor.length === 0 && (
                        <Text fontSize="sm" color="orange.500" mt={1}>
                          ⚠️ Este proveedor no tiene productos asignados. Asigna productos al proveedor desde la sección "Proveedores".
                        </Text>
                      )}
                    </FormControl>
                  </>
                ) : (
                  <>
                    <FormControl mb={4}>
                      <FormLabel>Producto</FormLabel>
                      <Select
                        name="idinventario"
                        value={formData.idinventario}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccione un producto</option>
                        {inventario.map((item) => (
                          <option key={item.idinventario} value={item.idinventario}>
                            {item.nombreproducto ? `${item.nombreproducto} (ID: ${item.idinventario})` : `Producto ${item.idinventario}`}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>Proveedor (que suministra el producto seleccionado)</FormLabel>
                      <Select
                        name="idproveedor"
                        value={formData.idproveedor}
                        onChange={handleInputChange}
                        required
                        isDisabled={!formData.idinventario}
                      >
                        <option value="">
                          {formData.idinventario 
                            ? proveedoresPorProducto.length > 0
                              ? `Seleccione un proveedor (${proveedoresPorProducto.length} disponibles)`
                              : 'Este producto no tiene proveedores asignados'
                            : 'Primero seleccione un producto'
                          }
                        </option>
                        {proveedoresPorProducto.map((proveedor) => (
                          <option key={proveedor.idproveedor} value={proveedor.idproveedor}>
                            {proveedor.nombreprove} - ${proveedor.preciounitario}
                          </option>
                        ))}
                      </Select>
                      {formData.idinventario && proveedoresPorProducto.length === 0 && (
                        <Text fontSize="sm" color="orange.500" mt={1}>
                          ⚠️ Este producto no tiene proveedores asignados. Asigna proveedores al producto desde la sección "Productos".
                        </Text>
                      )}
                    </FormControl>
                  </>
                )}

                <FormControl mb={4}>
                  <FormLabel>Cantidad</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.cantidadsolicitada}
                    onChange={(value) => setFormData(prev => ({ ...prev, cantidadsolicitada: value }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  {sugerencias.loteOptimo > 0 && (
                    <Text fontSize="sm" color="blue.600" mt={1}>
                      💡 Lote óptimo sugerido: {sugerencias.loteOptimo} unidades
                    </Text>
                  )}
                </FormControl>

                {/* Mostrar sugerencias */}
                {(sugerencias.proveedorPredeterminado || sugerencias.loteOptimo > 0 || sugerencias.productosPredeterminados.length > 0) && (
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Sugerencias del Sistema</AlertTitle>
                      <AlertDescription>
                        <VStack align="start" spacing={2} mt={2}>
                          {seleccionInicial === 'producto' && sugerencias.proveedorPredeterminado && (
                            <Text>
                              <strong>Proveedor predeterminado:</strong> {sugerencias.proveedorPredeterminado.nombreprove} 
                              (${sugerencias.proveedorPredeterminado.preciounitario})
                            </Text>
                          )}
                          
                          {seleccionInicial === 'proveedor' && sugerencias.productosPredeterminados.length > 0 && (
                            <Box>
                              <Text fontWeight="bold" mb={2}>
                                ⭐ Productos donde este proveedor es predeterminado:
                              </Text>
                              {sugerencias.productosPredeterminados.map((producto, index) => {
                                const inventarioItem = inventario.find(item => item.idproducto === producto.idproducto);
                                return (
                                  <Box key={index} p={2} bg="blue.50" borderRadius="md" mb={1}>
                                    <Text fontSize="sm">
                                      <strong>{producto.nombreproducto}</strong> - ${producto.preciounitario}
                                    </Text>
                                    <Text fontSize="xs" color="blue.600">
                                      Lote óptimo: {inventarioItem?.loteoptimo || 'N/A'} unidades
                                    </Text>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                          
                          {seleccionInicial === 'proveedor' && sugerencias.productosPredeterminados.length === 0 && sugerencias.productoRecomendado && (
                            <Text>
                              <strong>Producto recomendado:</strong> {sugerencias.productoRecomendado.nombreproducto} 
                              (${sugerencias.productoRecomendado.preciounitario})
                            </Text>
                          )}
                          
                          {sugerencias.loteOptimo > 0 && (
                            <Text>
                              <strong>Lote óptimo calculado:</strong> {sugerencias.loteOptimo} unidades
                            </Text>
                          )}
                          
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={aplicarSugerencias}
                          >
                            Aplicar Sugerencias
                          </Button>
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Mostrar advertencia de órdenes activas */}
                {ordenesActivas.length > 0 && (
                  <Alert status="warning" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>⚠️ Órdenes Activas Detectadas</AlertTitle>
                      <AlertDescription>
                        <VStack align="start" spacing={2} mt={2}>
                          <Text>
                            Este producto tiene <strong>{ordenesActivas.length} orden(es) activa(s)</strong>:
                          </Text>
                          {ordenesActivas.map((orden, index) => (
                            <Box key={index} p={2} bg="yellow.50" borderRadius="md" w="100%">
                              <Text fontSize="sm">
                                <strong>Orden #{orden.idorden_compra}</strong> - {orden.cantidadsolicitada} unidades 
                                <Badge ml={2} colorScheme={orden.estadoorden === 'ENVIADA' ? 'green' : 'yellow'}>
                                  {orden.estadoorden}
                                </Badge>
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Fecha: {new Date(orden.fechaorden).toLocaleDateString()}
                              </Text>
                            </Box>
                          ))}
                          <Text fontSize="sm" color="orange.600">
                            Se le pedirá confirmación antes de crear la nueva orden.
                          </Text>
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <FormControl mb={4}>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    name="descripcionordendecompra"
                    value={formData.descripcionordendecompra}
                    onChange={handleInputChange}
                    placeholder="Descripción de la orden de compra"
                  />
                </FormControl>

                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    type="submit"
                    isDisabled={!formData.idinventario || !formData.idproveedor}
                  >
                    Crear Orden
                  </Button>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
} 