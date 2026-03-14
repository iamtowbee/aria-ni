// src/components/DataVisualization.jsx
/**
 * Data Visualization System
 * 
 * When AI analyzes data, show it visually:
 * - Line Charts: Trends over time
 * - Bar Charts: Comparisons
 * - Pie Charts: Distributions
 * - Scatter Plots: Correlations
 * 
 * Auto-detects data type and chooses best visualization
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryPie,
  VictoryScatter,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
} from 'victory-native';

const { width } = Dimensions.get('window');

export const DataVisualization = ({ data, type, title, description }) => {
  const chartWidth = width - 60;
  const chartHeight = 250;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LineChart data={data} width={chartWidth} height={chartHeight} />;
      case 'bar':
        return <BarChart data={data} width={chartWidth} height={chartHeight} />;
      case 'pie':
        return <PieChart data={data} width={chartWidth} height={chartHeight} />;
      case 'scatter':
        return <ScatterChart data={data} width={chartWidth} height={chartHeight} />;
      default:
        return <Text style={styles.error}>Unknown chart type: {type}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
      
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
};

// Line Chart - for trends over time
const LineChart = ({ data, width, height }) => (
  <VictoryChart
    width={width}
    height={height}
    theme={VictoryTheme.material}
    padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
  >
    <VictoryAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10 },
        grid: { stroke: '#444', strokeDasharray: '5,5' },
      }}
    />
    <VictoryAxis
      dependentAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10 },
        grid: { stroke: '#444', strokeDasharray: '5,5' },
      }}
    />
    <VictoryLine
      data={data}
      style={{
        data: {
          stroke: '#6C63FF',
          strokeWidth: 3,
        },
      }}
      animate={{
        duration: 1000,
        onLoad: { duration: 500 },
      }}
    />
  </VictoryChart>
);

// Bar Chart - for comparisons
const BarChart = ({ data, width, height }) => (
  <VictoryChart
    width={width}
    height={height}
    theme={VictoryTheme.material}
    padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
    domainPadding={{ x: 30 }}
  >
    <VictoryAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10, angle: -45, textAnchor: 'end' },
      }}
    />
    <VictoryAxis
      dependentAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10 },
        grid: { stroke: '#444', strokeDasharray: '5,5' },
      }}
    />
    <VictoryBar
      data={data}
      style={{
        data: {
          fill: '#6C63FF',
        },
      }}
      cornerRadius={{ top: 5 }}
      animate={{
        duration: 1000,
        onLoad: { duration: 500 },
      }}
    />
  </VictoryChart>
);

// Pie Chart - for distributions
const PieChart = ({ data, width, height }) => (
  <View style={{ alignItems: 'center' }}>
    <VictoryPie
      data={data}
      width={width}
      height={height}
      padding={50}
      colorScale={[
        '#6C63FF',
        '#FF69B4',
        '#FFD700',
        '#20B2AA',
        '#DC143C',
        '#9370DB',
      ]}
      style={{
        labels: {
          fill: '#EAEAEA',
          fontSize: 12,
          fontWeight: 'bold',
        },
      }}
      labelRadius={({ innerRadius }) => innerRadius + 30}
      animate={{
        duration: 1000,
        onLoad: { duration: 500 },
      }}
    />
  </View>
);

// Scatter Plot - for correlations
const ScatterChart = ({ data, width, height }) => (
  <VictoryChart
    width={width}
    height={height}
    theme={VictoryTheme.material}
    padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
  >
    <VictoryAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10 },
        grid: { stroke: '#444', strokeDasharray: '5,5' },
      }}
    />
    <VictoryAxis
      dependentAxis
      style={{
        axis: { stroke: '#6C63FF' },
        tickLabels: { fill: '#EAEAEA', fontSize: 10 },
        grid: { stroke: '#444', strokeDasharray: '5,5' },
      }}
    />
    <VictoryScatter
      data={data}
      size={5}
      style={{
        data: {
          fill: '#6C63FF',
          opacity: 0.7,
        },
      }}
      animate={{
        duration: 1000,
        onLoad: { duration: 500 },
      }}
    />
  </VictoryChart>
);

/**
 * Auto-detect best chart type from data
 */
export function detectChartType(data) {
  if (!data || data.length === 0) return 'line';

  const firstItem = data[0];

  // Has x and y coordinates → scatter or line
  if (firstItem.x !== undefined && firstItem.y !== undefined) {
    // Check if x values are sequential (line) or random (scatter)
    const xValues = data.map(d => d.x);
    const isSequential = xValues.every((val, i) => {
      if (i === 0) return true;
      return val >= xValues[i - 1];
    });
    
    return isSequential ? 'line' : 'scatter';
  }

  // Has label and y → bar or pie
  if (firstItem.label !== undefined && firstItem.y !== undefined) {
    // If sum of y values ≈ 100, probably percentages → pie
    const sum = data.reduce((acc, d) => acc + d.y, 0);
    return Math.abs(sum - 100) < 10 ? 'pie' : 'bar';
  }

  // Default to line
  return 'line';
}

/**
 * Format data for visualization
 */
export function formatDataForChart(rawData, chartType) {
  switch (chartType) {
    case 'line':
    case 'scatter':
      return rawData.map((item, index) => ({
        x: item.x || index,
        y: item.y || item.value || 0,
      }));

    case 'bar':
      return rawData.map((item, index) => ({
        x: item.label || item.x || `Item ${index + 1}`,
        y: item.y || item.value || 0,
      }));

    case 'pie':
      return rawData.map((item, index) => ({
        x: item.label || item.x || `Item ${index + 1}`,
        y: item.y || item.value || 0,
        label: `${item.label || `Item ${index + 1}`}\n${item.y || item.value}%`,
      }));

    default:
      return rawData;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213E',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAEAEA',
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  chartContainer: {
    alignItems: 'center',
  },
  error: {
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

/**
 * Usage:
 * 
 * // Auto-detect
 * const chartType = detectChartType(rawData);
 * const formattedData = formatDataForChart(rawData, chartType);
 * 
 * <DataVisualization
 *   data={formattedData}
 *   type={chartType}
 *   title="Monthly Sales"
 *   description="Revenue trend over the past year"
 * />
 * 
 * // Or specify manually
 * <DataVisualization
 *   data={[
 *     { x: 'Jan', y: 30 },
 *     { x: 'Feb', y: 45 },
 *     { x: 'Mar', y: 60 },
 *   ]}
 *   type="bar"
 *   title="Q1 Performance"
 * />
 */
