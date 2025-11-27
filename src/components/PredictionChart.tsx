import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts'
import { Info } from 'lucide-react'
import './PredictionChart.css'

interface PredictionChartProps {
  data: {
    modelo: string
    historicos?: Array<{
      fecha: string
      ventas: number
      prediccion: number
      tipo: string
    }>
    predicciones: Array<{
      fecha: string
      prediccion: number
      intervaloSuperior: number
      intervaloInferior: number
      confianza: number
    }>
    rangoHistorico?: {
      max: number
      min: number
      promedio: number
      rangoSuperior: number
      rangoInferior: number
    }
    metrica: {
      pendiente: number
      intercepto: number
      r2: number
    }
  }
  onInfoClick?: () => void
}

export default function PredictionChart({ data, onInfoClick }: PredictionChartProps) {
  // Calcular valores del rango histórico
  const rangoInferior = data.rangoHistorico?.rangoInferior || 0;
  const rangoSuperior = data.rangoHistorico?.rangoSuperior || 0;
  const rangoDiff = rangoSuperior - rangoInferior;
  
  // Debug: verificar que los datos del rango histórico estén presentes
  if (data.rangoHistorico) {
    console.log('Rango Histórico:', {
      inferior: rangoInferior,
      superior: rangoSuperior,
      diferencia: rangoDiff
    });
  }

  // Preparar datos históricos para el gráfico
  const historicalChartData = data.historicos?.map(h => ({
    fecha: h.fecha,
    'Ventas Reales': h.ventas,
    'Tendencia del Modelo': h.prediccion,
    'Predicción': null,
    'Intervalo Superior': null,
    'Intervalo Inferior': null,
    'Rango Inferior': rangoInferior,
    'Rango Superior': rangoSuperior,
    'Rango Area': rangoDiff, // Diferencia para mostrar como área apilada
    tipo: 'historico'
  })) || [];

  // Preparar datos de predicciones
  const predictionChartData = data.predicciones.map(p => {
    // Calcular la diferencia para el área de confianza
    const confianzaDiff = p.intervaloSuperior - p.intervaloInferior;
    return {
      fecha: p.fecha,
      'Ventas Reales': null,
      'Tendencia del Modelo': p.prediccion, // Continuar la tendencia también en predicciones
      'Predicción': p.prediccion,
      'Intervalo Superior': p.intervaloSuperior,
      'Intervalo Inferior': p.intervaloInferior,
      'Confianza Area': confianzaDiff, // Diferencia para mostrar como área
      'Rango Inferior': rangoInferior,
      'Rango Superior': rangoSuperior,
      'Rango Area': rangoDiff, // Diferencia para mostrar como área apilada
      tipo: 'prediccion'
    };
  });

  // Combinar todos los datos ordenados por fecha
  const allChartData = [...historicalChartData, ...predictionChartData].sort((a, b) => {
    const dateA = new Date(a.fecha + '-01');
    const dateB = new Date(b.fecha + '-01');
    return dateA.getTime() - dateB.getTime();
  })

  return (
    <div className="prediction-chart">
      <div className="prediction-header">
        <div className="prediction-header-content">
          <div>
            <h4>Modelo: {data.modelo}</h4>
            <p>R²: {data.metrica.r2.toFixed(4)}</p>
          </div>
          {onInfoClick && (
            <button className="chart-info-button" onClick={onInfoClick} title="Ver información">
              <Info size={18} />
            </button>
          )}
        </div>
        <div className="prediction-metrics">
          <div className="metric-item">
            <span className="metric-label">Confianza promedio:</span>
            <span className="metric-value">
              {(data.predicciones.reduce((sum, p) => sum + p.confianza, 0) / data.predicciones.length).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={allChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="fecha" 
              stroke="#a0a0a0"
              tick={{ fill: '#a0a0a0' }}
              tickFormatter={(value) => {
                if (!value) return '';
                const [year, month] = value.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
              }}
            />
            <YAxis stroke="#a0a0a0" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              labelFormatter={(value) => {
                if (!value) return '';
                const [year, month] = value.split('-');
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return `${monthNames[parseInt(month) - 1]} ${year}`;
              }}
              formatter={(value: number) => {
                if (value === null || value === undefined) return 'N/A';
                return `$${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
              }}
            />
            <Legend />
            
            {/* Banda de rango histórico (máximos y mínimos) - PRIMERO para que quede detrás */}
            {data.rangoHistorico && rangoDiff > 0 && (
              <>
                {/* Área base hasta el rango inferior (invisible, solo para el stack) */}
                <Area
                  type="monotone"
                  dataKey="Rango Inferior"
                  stroke="none"
                  fill="transparent"
                  fillOpacity={0}
                  connectNulls
                  stackId="rango"
                  name=""
                  legendType="none"
                />
                {/* Área del rango histórico (diferencia entre superior e inferior) */}
                <Area
                  type="monotone"
                  dataKey="Rango Area"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  connectNulls
                  stackId="rango"
                  name="Rango Histórico (Máx-Mín)"
                />
              </>
            )}
            
            {/* Intervalo de confianza solo para predicciones - usando áreas apiladas */}
            {/* Primero el área hasta el intervalo inferior (invisible, solo para el stack) */}
            <Area
              type="monotone"
              dataKey="Intervalo Inferior"
              stroke="none"
              fill="#1a1a1a"
              fillOpacity={1}
              connectNulls
              stackId="confidence"
              name=""
              legendType="none"
            />
            {/* Luego el área de la diferencia entre superior e inferior */}
            <Area
              type="monotone"
              dataKey="Confianza Area"
              stroke="#ef4444"
              strokeWidth={1}
              strokeOpacity={0.3}
              fill="#ef4444"
              fillOpacity={0.15}
              connectNulls
              stackId="confidence"
              name="Intervalo de Confianza (95%)"
            />
            
            {/* Línea de ventas reales históricas */}
            {data.historicos && data.historicos.length > 0 && (
              <Line
                type="monotone"
                dataKey="Ventas Reales"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Ventas Reales (Histórico)"
                connectNulls={false}
              />
            )}
            
            {/* Línea de tendencia del modelo (histórica y futura - continua) */}
            <Line
              type="monotone"
              dataKey="Tendencia del Modelo"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Tendencia del Modelo"
              connectNulls={true}
            />
            
            {/* Línea de predicción (solo para el futuro) */}
            <Line
              type="monotone"
              dataKey="Predicción"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 6 }}
              name="Predicción Futura"
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Leyenda explicativa */}
        <div className="prediction-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#10b981' }}></span>
            <span>Ventas Reales (Histórico)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#3b82f6' }}></span>
            <span>Tendencia del Modelo (Línea discontinua)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#f59e0b' }}></span>
            <span>Predicción Futura (Próximos 3 meses)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ef4444', opacity: 0.3 }}></span>
            <span>Intervalo de Confianza (95%)</span>
          </div>
          {data.rangoHistorico && (
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#8b5cf6', opacity: 0.3 }}></span>
              <span>Rango Histórico (95% datos históricos)</span>
            </div>
          )}
        </div>
      </div>
      <div className="prediction-details">
        {data.predicciones.map((pred, idx) => (
          <div key={idx} className="prediction-item">
            <div className="prediction-date">{pred.fecha}</div>
            <div className="prediction-value">
              ${pred.prediccion.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
            </div>
            <div className="prediction-confidence">Confianza: {pred.confianza.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

