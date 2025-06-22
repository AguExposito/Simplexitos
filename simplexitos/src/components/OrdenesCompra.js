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
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../config';

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [productosPorProveedor, setProductosPorProveedor] = useState([]);
  const [proveedoresPorProducto, setProveedoresPorProducto] = useState([]);
  const [seleccionInicial, setSeleccionInicial] = useState('proveedor'); // 'proveedor' o 'producto'
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

  // Cargar proveedores por producto cuando se selecciona un producto
  useEffect(() => {
    if (formData.idinventario && seleccionInicial === 'producto') {
      fetchProveedoresPorProducto(formData.idinventario);
    }
  }, [formData.idinventario, seleccionInicial]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar la selección dependiente cuando cambia la selección inicial
    if (name === 'idproveedor' && seleccionInicial === 'proveedor') {
      setFormData(prev => ({ ...prev, idinventario: '' }));
    } else if (name === 'idinventario' && seleccionInicial === 'producto') {
      setFormData(prev => ({ ...prev, idproveedor: '' }));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      'ABIERTA': { color: 'yellow', text: 'Abierta' },
      'RECIBIDA': { color: 'green', text: 'Recibida' },
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
                          return inventarioItem ? (
                            <option key={inventarioItem.idinventario} value={inventarioItem.idinventario}>
                              {producto.nombreproducto} - ${producto.preciounitario}
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
                </FormControl>

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