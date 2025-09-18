import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GraficoBarras.css';

interface GraficoData {
  fonte: string;
  quantidade: number;
}

interface GraficoBarrasProps {
  data: GraficoData[];
}

const GraficoBarras: React.FC<GraficoBarrasProps> = ({ data }) => {
  // A biblioteca Recharts precisa que os dados numéricos sejam números, não strings.
  const processedData = data.map(item => ({
    ...item,
    quantidade: Number(item.quantidade),
  }));

  return (
    <div className="grafico-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          layout="vertical" // Gráfico deitado fica melhor para nomes compridos
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="fonte" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="quantidade" fill="#8884d8" name="Nº de Casos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoBarras;