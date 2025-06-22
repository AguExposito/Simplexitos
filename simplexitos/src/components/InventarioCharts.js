import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Select,
  useColorModeValue,
  Grid,
  Heading
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
  const [ejeY, setEjeY] = useState('cantidad');
  
  const bgBlue = useColorModeValue('blue.50', 'blue.900');

  // Opciones para los ejes
  const opcionesEjeX = [
    { value: 'meses', label: 'Meses del Año' },
    { value: 'productos', label: 'Productos Similares' },
    { value: 'proveedores', label: 'Diferentes Proveedores' },
    { value: 'modelos', label: 'Modelos de Inventario' },
    { value: 'tiempo', label: 'Períodos de Tiempo' }
  ];

  const opcionesEjeY = [
    { value: 'demanda', label: 'Demanda Anual (unidades)' },
    { value: 'stock', label: 'Stock Actual (unidades)' },
    { value: 'costos', label: 'Costos Totales ($)' },
    { value: 'frecuencia', label: 'Frecuencia de Pedidos (pedidos/año)' },
    { value: 'cantidadOrdenes', label: 'Cantidad por Orden (unidades)' }
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
    const datos = datosSimulados;
    
    const ejeXData = datos.map((item, index) => {
      switch (ejeX) {
        case 'meses':
          const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return meses[index % 12];
        case 'productos':
          return `Producto ${index + 1}`;
        case 'proveedores':
          return `Proveedor ${index + 1}`;
        case 'modelos':
          return index % 2 === 0 ? 'Lote Fijo' : 'Período Fijo';
        case 'tiempo':
          return `Período ${index + 1}`;
        default:
          return `Día ${item.dia}`;
      }
    });

    const ejeYData = datos.map(item => {
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

    return {
      labels: ejeXData,
      datasets: [
        {
          label: `${opcionesEjeY.find(opt => opt.value === ejeY)?.label || 'Valor'}`,
          data: ejeYData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: tipoGrafico === 'line',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [datosSimulados, ejeX, ejeY, tipoGrafico]);

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
        text: `Análisis de ${opcionesEjeY.find(opt => opt.value === ejeY)?.label || 'Valor'} vs ${opcionesEjeX.find(opt => opt.value === ejeX)?.label || 'Tiempo'}`,
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
        text: 'Distribución de Costos del Inventario',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
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
          label: 'Stock de Seguridad',
          data: datos.map(() => stockSeguridad),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Punto de Pedido',
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
        text: 'Evolución del Stock en el Tiempo',
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

        {/* Controles del gráfico */}
        <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
          <VStack spacing={4}>
            <Text fontWeight="bold" color="gray.700">
              Configuración del Gráfico
            </Text>
            <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Tipo de Gráfico</Text>
                <Select
                  value={tipoGrafico}
                  onChange={(e) => setTipoGrafico(e.target.value)}
                  size="sm"
                >
                  <option value="line">Gráfico de Líneas</option>
                  <option value="bar">Histograma</option>
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
                <Text fontSize="sm" color="gray.600">Valor Promedio:</Text>
                <Text fontWeight="bold">
                  {datosSimulados.length > 0 
                    ? (datosSimulados.reduce((sum, item) => {
                        let valor = 0;
                        switch (ejeY) {
                          case 'demanda': valor = item.demanda; break;
                          case 'stock': valor = item.stock; break;
                          case 'costos': valor = item.costo; break;
                          case 'frecuencia': valor = item.ordenes; break;
                          case 'cantidadOrdenes': valor = item.cantidadOrdenes; break;
                        }
                        return sum + valor;
                      }, 0) / datosSimulados.length).toFixed(2)
                    : '0.00'
                  }
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Valor Máximo:</Text>
                <Text fontWeight="bold">
                  {datosSimulados.length > 0 
                    ? Math.max(...datosSimulados.map(item => {
                        switch (ejeY) {
                          case 'demanda': return item.demanda;
                          case 'stock': return item.stock;
                          case 'costos': return item.costo;
                          case 'frecuencia': return item.ordenes;
                          case 'cantidadOrdenes': return item.cantidadOrdenes;
                          default: return 0;
                        }
                      })).toFixed(2)
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