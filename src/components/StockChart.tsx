import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import * as d3 from 'd3';
import { apiService } from '../services/api';
import type { StockData } from '../services/api';

interface StockChartProps {
  symbol: string;
}

const StockChart = ({ symbol }: StockChartProps) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const stockData = await apiService.getStockData(symbol);
        setData(stockData);
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.price) as number * 0.99, d3.max(data, d => d.price) as number * 1.01])
      .range([height, 0]);

    const area = d3.area<StockData>()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.price));

    const line = d3.line<StockData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.price));

    const gradient = g.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', theme.palette.primary.main)
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', theme.palette.primary.main)
      .attr('stop-opacity', 0);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 2)
      .attr('d', line);

    const xAxis = d3.axisBottom(x)
      .ticks(isMobile ? 4 : isTablet ? 6 : 8)
      .tickFormat(d => {
        const date = d as Date;
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      });

    const yAxis = d3.axisLeft(y)
      .ticks(6)
      .tickFormat(d => `${d} ₽`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('dy', '1em');

    g.append('g')
      .call(yAxis);

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    const bisect = d3.bisector((d: StockData) => new Date(d.date)).left;

    svg.on('mousemove', (event) => {
      const [x0] = d3.pointer(event);
      const x0Date = x.invert(x0);
      const i = bisect(data, x0Date, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0Date.getTime() - new Date(d0.date).getTime() > new Date(d1.date).getTime() - x0Date.getTime() ? d1 : d0;

      tooltip
        .style('visibility', 'visible')
        .html(`
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${new Date(d.date).toLocaleDateString('ru-RU')}
          </div>
          <div style="color: ${theme.palette.primary.main};">
            ${d.price.toLocaleString('ru-RU')} ₽
          </div>
          <div style="color: ${theme.palette.text.secondary}; font-size: 11px;">
            ${new Date(d.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    });

    svg.on('mouseleave', () => {
      tooltip.style('visibility', 'hidden');
    });

  }, [data, theme, isMobile, isTablet]);

  if (!symbol) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3
      }}>
        <Typography variant="h6" color="text.secondary">
          Выберите акцию для отображения графика
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        bgcolor: 'background.paper',
        borderRadius: 2
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {symbol}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          График цены акции
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <svg
          ref={svgRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 400
          }}
        />
      </Box>
    </Paper>
  );
};

export default StockChart; 