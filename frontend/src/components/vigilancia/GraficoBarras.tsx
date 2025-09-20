import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GraficoBarras.css';

interface GraficoData {
  fonte: string;
  quantidade: number;
}

// ATUALIZADO: Adicionamos a nova propriedade 'onBarClick'
interface GraficoBarrasProps {
  data: GraficoData[];
  onBarClick?: (data: any) => void; // Função que será chamada ao clicar em uma barra
}

const GraficoBarras: React.FC<GraficoBarrasProps> = ({ data, onBarClick }) => {
  const processedData = data.map(item => ({
    ...item,
    quantidade: Number(item.quantidade),
  }));

  return (
    <div className="grafico-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="fonte" type="category" width={120} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {/* ATUALIZADO: 
            - Adicionamos a propriedade 'onClick' à barra.
            - Adicionamos um cursor de ponteiro para indicar que é clicável.
          */}
          <Bar 
            dataKey="quantidade" 
            fill="#8884d8" 
            name="Nº de Casos" 
            onClick={onBarClick}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoBarras;