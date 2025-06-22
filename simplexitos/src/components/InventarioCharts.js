import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Select,
  useColorModeValue,
  Grid,
  Heading,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { API_BASE_URL } from '../config';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function InventarioCharts({ analisisProducto, ultimasOrdenes = [] }) {
  const [tipoGrafico, setTipoGrafico] = useState('line');
  const [ejeX, setEjeX] = useState('tiempo');
  const [ejeY, setEjeY] = useState('stock');
  const [productosReales, setProductosReales] = useState([]);
  const [proveedoresReales, setProveedoresReales] = useState([]);
  const [inventarioReal, setInventarioReal] = useState([]);
  
  const bgBlue = useColorModeValue('blue.50', 'blue.900');

  // Cargar datos reales al montar el componente
  useEffect(() => {
    fetchDatosReales();
  }, []);

  const fetchDatosReales = async () => {
    try {
      // Cargar productos
      const productosResponse = await fetch(`${API_BASE_URL}/producto`);
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        setProductosReales(productosData);
      }

      // Cargar proveedores
      const proveedoresResponse = await fetch(`${API_BASE_URL}/proveedor`);
      if (proveedoresResponse.ok) {
        const proveedoresData = await proveedoresResponse.json();
        setProveedoresReales(proveedoresData);
      }

      // Cargar inventario
      const inventarioResponse = await fetch(`${API_BASE_URL}/inventario`);
      if (inventarioResponse.ok) {
        const inventarioData = await inventarioResponse.json();
        setInventarioReal(inventarioData);
      }
    } catch (error) {
      console.error('Error cargando datos reales:', error);
    }
  };

  // Opciones para los ejes - Etiquetas simplificadas y significativas
  const opcionesEjeX = [
    { value: 'tiempo', label: 'Días', desc: 'Evolución temporal de los datos' },
    { value: 'meses', label: 'Meses', desc: 'Comparación mensual del comportamiento' },
    { value: 'productos', label: 'Productos', desc: 'Comparación entre diferentes productos' },
    { value: 'proveedores', label: 'Proveedores', desc: 'Análisis por proveedor' },
    { value: 'modelos', label: 'Modelos', desc: 'Comparación Lote Fijo vs Período Fijo' }
  ];

  const opcionesEjeY = [
    { value: 'stock', label: 'Stock', desc: 'Cantidad de unidades en inventario' },
    { value: 'demanda', label: 'Demanda', desc: 'Unidades demandadas por período' },
    { value: 'costos', label: 'Costos', desc: 'Gastos totales del inventario' },
    { value: 'frecuencia', label: 'Pedidos', desc: 'Número de pedidos realizados' },
    { value: 'cantidadOrdenes', label: 'Cantidad Pedida', desc: 'Unidades solicitadas por pedido' }
  ];

  // Generar datos simulados para el gráfico si no hay datos reales
  const datosSimulados = useMemo(() => {
    // Si hay órdenes reales, usarlas para generar datos más realistas
    if (ultimasOrdenes && ultimasOrdenes.length > 0) {
      const datos = [];
      const dias = 30;
      
      // Crear un mapa de fechas con datos de órdenes
      const ordenesPorFecha = {};
      ultimasOrdenes.forEach(orden => {
        const fecha = new Date(orden.fechaorden).toISOString().split('T')[0];
        if (!ordenesPorFecha[fecha]) {
          ordenesPorFecha[fecha] = [];
        }
        ordenesPorFecha[fecha].push(orden);
      });
      
      for (let i = 0; i < dias; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - (dias - i));
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Buscar órdenes para esta fecha
        const ordenesDelDia = ordenesPorFecha[fechaStr] || [];
        const cantidadTotal = ordenesDelDia.reduce((sum, orden) => sum + orden.cantidadsolicitada, 0);
        
        // Simular variaciones en el stock basadas en las órdenes
        const stockBase = analisisProducto?.stock || 100;
        const variacion = Math.sin(i * 0.3) * 20 + Math.random() * 10;
        const stock = Math.max(0, stockBase + variacion);
        
        // Simular demanda
        const demanda = Math.max(0, (analisisProducto?.demanda || 1000) / 365 + Math.random() * 5);
        
        // Simular costos
        const costoBase = analisisProducto?.cgi || 1000;
        const costoVariacion = Math.random() * 200;
        const costo = costoBase + costoVariacion;
        
        datos.push({
          dia: i + 1,
          fecha: fechaStr,
          stock: Math.round(Number(stock) || 0),
          demanda: Math.round(Number(demanda) || 0),
          costo: Math.round(Number(costo) || 0),
          ordenes: Number(ordenesDelDia.length) || 0,
          cantidadOrdenes: Number(cantidadTotal) || 0
        });
      }
      
      return datos;
    }
    
    // Datos simulados si no hay órdenes reales
    const dias = 30;
    const datos = [];
    
    for (let i = 0; i < dias; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - (dias - i));
      
      // Simular variaciones en el stock
      const stockBase = analisisProducto?.stock || 100;
      const variacion = Math.sin(i * 0.3) * 20 + Math.random() * 10;
      const stock = Math.max(0, stockBase + variacion);
      
      // Simular demanda
      const demanda = Math.max(0, (analisisProducto?.demanda || 1000) / 365 + Math.random() * 5);
      
      // Simular costos
      const costoBase = analisisProducto?.cgi || 1000;
      const costoVariacion = Math.random() * 200;
      const costo = costoBase + costoVariacion;
      
      datos.push({
        dia: i + 1,
        fecha: fecha.toISOString().split('T')[0],
        stock: Math.round(Number(stock) || 0),
        demanda: Math.round(Number(demanda) || 0),
        costo: Math.round(Number(costo) || 0),
        ordenes: Number(Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0),
        cantidadOrdenes: Number(Math.random() > 0.8 ? Math.floor(Math.random() * 50) + 10 : 0)
      });
    }
    
    return datos;
  }, [analisisProducto, ultimasOrdenes]);

  // Preparar datos para el gráfico
  const datosGrafico = useMemo(() => {
    let labels = [];
    let data = [];

    switch (ejeX) {
      case 'productos':
        // Usar productos reales
        labels = productosReales.map(p => p.nombreproducto || `Prod ${p.codproducto}`);
        data = productosReales.map(producto => {
          const inventarioItem = inventarioReal.find(i => i.idproducto === producto.idproducto);
          let valor = 0;
          switch (ejeY) {
            case 'stock':
              valor = inventarioItem?.stock || 0;
              break;
            case 'demanda':
              valor = producto.demanda || 0;
              break;
            case 'costos':
              valor = inventarioItem?.cgi || 0;
              break;
            case 'frecuencia':
              valor = inventarioItem?.frecuenciaReabastecimiento || 0;
              break;
            case 'cantidadOrdenes':
              valor = inventarioItem?.loteoptimo || 0;
              break;
          }
          return valor;
        });
        break;

      case 'proveedores':
        // Usar proveedores reales
        labels = proveedoresReales.map(p => p.nombreprove || `Prov ${p.cuit}`);
        data = proveedoresReales.map(proveedor => {
          // Calcular métricas por proveedor
          let valor = 0;
          switch (ejeY) {
            case 'stock':
              // Sumar stock de productos de este proveedor
              valor = inventarioReal
                .filter(i => {
                  const producto = productosReales.find(p => p.idproducto === i.idproducto);
                  return producto; // Aquí podrías filtrar por proveedor si tuvieras esa relación
                })
                .reduce((sum, i) => sum + (i.stock || 0), 0);
              break;
            case 'demanda':
              // Sumar demanda de productos de este proveedor
              valor = productosReales
                .reduce((sum, p) => sum + (p.demanda || 0), 0);
              break;
            case 'costos':
              // Sumar costos de productos de este proveedor
              valor = inventarioReal
                .reduce((sum, i) => sum + (i.cgi || 0), 0);
              break;
            case 'frecuencia':
              valor = 12; // Valor promedio
              break;
            case 'cantidadOrdenes':
              valor = inventarioReal
                .reduce((sum, i) => sum + (i.loteoptimo || 0), 0);
              break;
          }
          return valor;
        });
        break;

      case 'modelos':
        // Comparación específica entre modelos de inventario
        labels = ['Lote Fijo', 'Período Fijo'];
        const loteFijoProductos = productosReales.filter(p => p.modeloproducto === 'LOTE_FIJO');
        const periodoFijoProductos = productosReales.filter(p => p.modeloproducto === 'PERIODO_FIJO');
        
        const loteFijoInventario = inventarioReal.filter(i => {
          const producto = productosReales.find(p => p.idproducto === i.idproducto);
          return producto?.modeloproducto === 'LOTE_FIJO';
        });
        
        const periodoFijoInventario = inventarioReal.filter(i => {
          const producto = productosReales.find(p => p.idproducto === i.idproducto);
          return producto?.modeloproducto === 'PERIODO_FIJO';
        });

        data = [
          // Datos para Lote Fijo
          (() => {
            switch (ejeY) {
              case 'stock':
                return loteFijoInventario.reduce((sum, i) => sum + (i.stock || 0), 0);
              case 'demanda':
                return loteFijoProductos.reduce((sum, p) => sum + (p.demanda || 0), 0);
              case 'costos':
                return loteFijoInventario.reduce((sum, i) => sum + (i.cgi || 0), 0);
              case 'frecuencia':
                return loteFijoInventario.length > 0 ? 
                  loteFijoInventario.reduce((sum, i) => sum + (i.frecuenciaReabastecimiento || 0), 0) / loteFijoInventario.length : 0;
              case 'cantidadOrdenes':
                return loteFijoInventario.reduce((sum, i) => sum + (i.loteoptimo || 0), 0);
              default:
                return 0;
            }
          })(),
          // Datos para Período Fijo
          (() => {
            switch (ejeY) {
              case 'stock':
                return periodoFijoInventario.reduce((sum, i) => sum + (i.stock || 0), 0);
              case 'demanda':
                return periodoFijoProductos.reduce((sum, p) => sum + (p.demanda || 0), 0);
              case 'costos':
                return periodoFijoInventario.reduce((sum, i) => sum + (i.cgi || 0), 0);
              case 'frecuencia':
                return periodoFijoInventario.length > 0 ? 
                  periodoFijoInventario.reduce((sum, i) => sum + (i.frecuenciaReabastecimiento || 0), 0) / periodoFijoInventario.length : 0;
              case 'cantidadOrdenes':
                return periodoFijoInventario.reduce((sum, i) => sum + (i.loteoptimo || 0), 0);
              default:
                return 0;
            }
          })()
        ];
        break;

      case 'meses':
        // Datos temporales por meses
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        labels = meses;
        data = meses.map((mes, index) => {
          const datosMes = datosSimulados.filter((_, i) => i % 12 === index);
          let valor = 0;
          switch (ejeY) {
            case 'stock':
              valor = datosMes.reduce((sum, d) => sum + (d.stock || 0), 0) / Math.max(datosMes.length, 1);
              break;
            case 'demanda':
              valor = datosMes.reduce((sum, d) => sum + (d.demanda || 0), 0) / Math.max(datosMes.length, 1);
              break;
            case 'costos':
              valor = datosMes.reduce((sum, d) => sum + (d.costo || 0), 0) / Math.max(datosMes.length, 1);
              break;
            case 'frecuencia':
              valor = datosMes.reduce((sum, d) => sum + (d.ordenes || 0), 0);
              break;
            case 'cantidadOrdenes':
              valor = datosMes.reduce((sum, d) => sum + (d.cantidadOrdenes || 0), 0);
              break;
          }
          return valor;
        });
        break;

      case 'tiempo':
      default:
        // Datos temporales por días
        labels = datosSimulados.map(item => `Día ${item.dia}`);
        data = datosSimulados.map(item => {
          let valor = 0;
          switch (ejeY) {
            case 'demanda':
              valor = Number(item.demanda) || 0;
              break;
            case 'stock':
              valor = Number(item.stock) || 0;
              break;
            case 'costos':
              valor = Number(item.costo) || 0;
              break;
            case 'frecuencia':
              valor = Number(item.ordenes) || 0;
              break;
            case 'cantidadOrdenes':
              valor = Number(item.cantidadOrdenes) || 0;
              break;
            default:
              valor = Number(item.stock) || 0;
          }
          return valor;
        });
        break;
    }

    return {
      labels: labels,
      datasets: [
        {
          label: `${opcionesEjeY.find(opt => opt.value === ejeY)?.label || 'Valor'}`,
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: tipoGrafico === 'line',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [datosSimulados, ejeX, ejeY, tipoGrafico, productosReales, proveedoresReales, inventarioReal]);

  // Obtener descripción de la comparación actual
  const getDescripcionComparacion = () => {
    const ejeXDesc = opcionesEjeX.find(opt => opt.value === ejeX)?.desc || '';
    const ejeYDesc = opcionesEjeY.find(opt => opt.value === ejeY)?.desc || '';
    
    const comparaciones = {
      'stock-tiempo': 'Muestra la evolución del inventario a lo largo del tiempo para identificar patrones de consumo y momentos críticos.',
      'demanda-tiempo': 'Revela las fluctuaciones de la demanda para optimizar la planificación de compras y evitar desabastecimiento.',
      'costos-tiempo': 'Permite identificar tendencias en los gastos para detectar oportunidades de ahorro y optimización.',
      'stock-productos': `Compara los niveles de inventario entre ${productosReales.length} productos para equilibrar el stock y priorizar reposiciones.`,
      'costos-proveedores': `Evalúa la rentabilidad de ${proveedoresReales.length} proveedores para tomar decisiones informadas sobre las compras.`,
      'stock-modelos': 'Compara la eficiencia entre modelos de inventario para elegir la estrategia más adecuada.',
      'demanda-modelos': 'Analiza cómo cada modelo maneja la demanda para optimizar la gestión del inventario.',
      'costos-modelos': 'Evalúa el impacto financiero de cada modelo de inventario en los costos totales.'
    };
    
    const key = `${ejeY}-${ejeX}`;
    return comparaciones[key] || `Análisis de ${ejeYDesc} vs ${ejeXDesc} para optimizar la gestión del inventario.`;
  };

  // Opciones del gráfico
  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${opcionesEjeY.find(opt => opt.value === ejeY)?.label} vs ${opcionesEjeX.find(opt => opt.value === ejeX)?.label}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
            return `${label}: ${numericValue.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: opcionesEjeX.find(opt => opt.value === ejeX)?.label || 'Eje X'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: opcionesEjeY.find(opt => opt.value === ejeY)?.label || 'Eje Y'
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Gráfico de distribución de costos
  const datosCostos = useMemo(() => {
    const costos = [
      { nombre: 'Compra', valor: Number(analisisProducto?.costocompra) || 0, color: 'rgba(54, 162, 235, 0.8)' },
      { nombre: 'Pedido', valor: Number(analisisProducto?.costopedido) || 0, color: 'rgba(75, 192, 192, 0.8)' },
      { nombre: 'Almacenamiento', valor: Number(analisisProducto?.costoalmacenamiento) || 0, color: 'rgba(255, 206, 86, 0.8)' }
    ];

    return {
      labels: costos.map(c => c.nombre),
      datasets: [
        {
          label: 'Distribución de Costos',
          data: costos.map(c => c.valor),
          backgroundColor: costos.map(c => c.color),
          borderColor: costos.map(c => c.color.replace('0.8', '1')),
          borderWidth: 2
        }
      ]
    };
  }, [analisisProducto]);

  const opcionesCostos = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Costos',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
            const numericTotal = typeof total === 'number' ? total : parseFloat(total) || 1;
            const porcentaje = ((numericValue / numericTotal) * 100).toFixed(1);
            return `${label}: $${numericValue.toFixed(2)} (${porcentaje}%)`;
          }
        }
      }
    }
  };

  // Gráfico de evolución del stock
  const datosStock = useMemo(() => {
    const datos = datosSimulados;
    const stockSeguridad = Number(analisisProducto?.stockseguridad) || 0;
    const puntoPedido = Number(analisisProducto?.puntopedido) || 0;
    
    return {
      labels: datos.map(item => `Día ${item.dia}`),
      datasets: [
        {
          label: 'Stock Actual',
          data: datos.map(item => Number(item.stock) || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Stock Seguridad',
          data: datos.map(() => stockSeguridad),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Punto Pedido',
          data: datos.map(() => puntoPedido),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0
        }
      ]
    };
  }, [datosSimulados, analisisProducto]);

  const opcionesStock = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolución del Stock',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
            return `${label}: ${numericValue.toFixed(0)} unidades`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Días'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Unidades'
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <Box p={6} borderRadius="lg" bg={bgBlue} boxShadow="md">
      <VStack align="stretch" spacing={6}>
        <Heading size="md" color="blue.700">
          📊 Análisis Gráfico del Inventario
        </Heading>

        {/* Comentario informativo sobre la comparación */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" fontSize="sm">Análisis Actual:</Text>
            <Text fontSize="sm">{getDescripcionComparacion()}</Text>
          </Box>
        </Alert>

        {/* Controles del gráfico */}
        <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
          <VStack spacing={4}>
            <Text fontWeight="bold" color="gray.700">
              Configuración del Gráfico
            </Text>
            <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Tipo</Text>
                <Select
                  value={tipoGrafico}
                  onChange={(e) => setTipoGrafico(e.target.value)}
                  size="sm"
                >
                  <option value="line">Líneas</option>
                  <option value="bar">Barras</option>
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Eje X</Text>
                <Select
                  value={ejeX}
                  onChange={(e) => setEjeX(e.target.value)}
                  size="sm"
                >
                  {opcionesEjeX.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Eje Y</Text>
                <Select
                  value={ejeY}
                  onChange={(e) => setEjeY(e.target.value)}
                  size="sm"
                >
                  {opcionesEjeY.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>
            </Grid>
          </VStack>
        </Box>

        {/* Gráficos en layout horizontal */}
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* Gráfico principal */}
          <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
            <Box h="350px">
              {tipoGrafico === 'line' ? (
                <Line data={datosGrafico} options={opcionesGrafico} />
              ) : (
                <Bar data={datosGrafico} options={opcionesGrafico} />
              )}
            </Box>
          </Box>

          {/* Gráfico de distribución de costos */}
          <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
            <Text fontWeight="bold" mb={4} color="gray.700">
              Distribución de Costos
            </Text>
            <Box h="350px">
              <Bar data={datosCostos} options={opcionesCostos} />
            </Box>
          </Box>
        </Grid>

        {/* Gráfico de evolución del stock - Ocupa todo el ancho */}
        <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
          <Text fontWeight="bold" mb={4} color="gray.700">
            Evolución del Stock
          </Text>
          <Box h="300px">
            <Line data={datosStock} options={opcionesStock} />
          </Box>
        </Box>

        {/* Información adicional */}
        <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
          <VStack align="stretch" spacing={3}>
            <Text fontWeight="bold" color="gray.700">
              Métricas del Gráfico
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Box>
                <Text fontSize="sm" color="gray.600">Promedio:</Text>
                <Text fontWeight="bold">
                  {datosGrafico.datasets[0].data.length > 0 
                    ? (datosGrafico.datasets[0].data.reduce((sum, val) => sum + val, 0) / datosGrafico.datasets[0].data.length).toFixed(2)
                    : '0.00'
                  }
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Máximo:</Text>
                <Text fontWeight="bold">
                  {datosGrafico.datasets[0].data.length > 0 
                    ? Math.max(...datosGrafico.datasets[0].data).toFixed(2)
                    : '0.00'
                  }
                </Text>
              </Box>
            </Grid>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
} 