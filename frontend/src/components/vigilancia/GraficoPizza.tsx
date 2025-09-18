import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GraficoPizza.css';

interface PizzaData {
  tipo: string;
  quantidade: number;
}

interface GraficoPizzaProps {
  data: PizzaData[];
}

// Paleta de cores para as fatias da pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const GraficoPizza: React.FC<GraficoPizzaProps> = ({ data }) => {
  const processedData = data.map(item => ({
    name: item.tipo, // Recharts usa a chave 'name' para a legenda
    value: Number(item.quantidade), // E 'value' para o valor
  }));

  return (
    <div className="grafico-container">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoPizza;