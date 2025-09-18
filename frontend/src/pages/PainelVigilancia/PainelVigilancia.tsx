// frontend/src/pages/PainelVigilancia/PainelVigilancia.tsx

import React, { useState, useEffect } from 'react';
// MODIFICAÇÃO: Removemos o axios que era de exemplo
import CardKPI from '../../components/vigilancia/CardKPI';
import MapaCalor from '../../components/vigilancia/MapaCalor';
import GraficoBarras from '../../components/vigilancia/GraficoBarras';
import GraficoPizza from '../../components/vigilancia/GraficoPizza';
import './PainelVigilancia.css';
// MODIFICAÇÃO: Importamos a última função da API
import { getDashboardTiposViolacao, getVigilanciaFluxoDemanda, getVigilanciaSobrecargaEquipe, getVigilanciaIncidenciaBairros, getVigilanciaFontesAcionamento, getVigilanciaTaxaReincidencia } from '../../services/api'; 
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

// --- Interfaces (sem alterações) ---
interface SobrecargaData {
  mediaCasosPorTecnico: number;
  limiteRecomendado: number;
}
interface FluxoData {
  casosNovosUltimos30Dias: number;
}
interface ReincidenciaData {
  taxaReincidencia: number;
}
interface IncidenciaBairro {
  bairro: string;
  casos: number;
}
interface FonteAcionamento {
  fonte: string;
  quantidade: number;
}
interface PerfilViolencia {
  name: string; // Ajustado para 'name' para ser compatível com nossa API
  value: number; // Ajustado para 'value' para ser compatível com nossa API
}

interface PainelData {
  sobrecarga: SobrecargaData;
  fluxo: FluxoData;
  reincidencia: ReincidenciaData;
  incidenciaBairros: IncidenciaBairro[];
  fontesAcionamento: FonteAcionamento[];
  perfilViolacoes: PerfilViolencia[];
}

const PainelVigilancia: React.FC = () => {
    const [painelData, setPainelData] = useState<PainelData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllPainelData = async () => {
            try {
                // MODIFICAÇÃO: Chamamos todas as 6 APIs
                const [
                    violacoesRes, 
                    fluxoRes, 
                    sobrecargaRes, 
                    incidenciaRes, 
                    fontesRes,
                    reincidenciaRes // <-- Nova chamada
                ] = await Promise.all([
                    getDashboardTiposViolacao(),
                    getVigilanciaFluxoDemanda(),
                    getVigilanciaSobrecargaEquipe(),
                    getVigilanciaIncidenciaBairros(),
                    getVigilanciaFontesAcionamento(),
                    getVigilanciaTaxaReincidencia() // <-- Nova chamada
                ]);

                setPainelData({
                    perfilViolacoes: violacoesRes,
                    fluxo: fluxoRes,
                    sobrecarga: sobrecargaRes,
                    incidenciaBairros: incidenciaRes,
                    fontesAcionamento: fontesRes,
                    reincidencia: reincidenciaRes, // <-- Dado real da API
                });

            } catch (err: any) {
                console.error("Erro ao buscar dados para o painel:", err);
                toast.error("Não foi possível carregar os dados do painel de vigilância.");
                setError("Não foi possível carregar os dados do painel de vigilância.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllPainelData();
    }, []);

    if (loading) {
        return (
            <div className="painel-container flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                <span className="ml-4 text-slate-500">Carregando Painel de Vigilância...</span>
            </div>
        );
    }

    if (error) {
        return <div className="painel-container"><div className="error-message">{error}</div></div>;
    }

    // O JSX abaixo permanece o mesmo, mas agora vai renderizar os dados do gráfico
    return (
        <div className="painel-container">
            <h1 className="painel-title">Painel de Vigilância Socioassistencial</h1>
            
            <div className="painel-row">
                {painelData && (
                    <>
                        {/* MODIFICAÇÃO: Card "Sobrecarga da Equipe" agora usa os dados reais */}
                        <CardKPI
                            title="Sobrecarga da Equipe"
                            subtitle="(Casos por Técnico)"
                            value={painelData.sobrecarga.mediaCasosPorTecnico}
                            status={painelData.sobrecarga.mediaCasosPorTecnico > painelData.sobrecarga.limiteRecomendado ? 'alerta' : 'ok'}
                        />
                        {/* MODIFICAÇÃO: Card "Fluxo de Demanda" agora usa os dados reais */}
                        <CardKPI
                            title="Fluxo de Demanda"
                            subtitle="(Novos casos nos últimos 30 dias)"
                            value={painelData.fluxo.casosNovosUltimos30Dias}
                            status='ok'
                        />
                        <CardKPI title="Taxa de Reincidência" subtitle="(Últimos 12 meses)" value={`${painelData.reincidencia.taxaReincidencia}%`} status={painelData.reincidencia.taxaReincidencia > 10 ? 'alerta' : 'ok'} />
                    </>
                )}
            </div>
            
            <div className="painel-row painel-row--gap">
                 {/* MODIFICAÇÃO: O Mapa de Calor agora receberá os dados reais */}
                 {painelData && painelData.incidenciaBairros && (
                    <div className="painel-col-8">
                       <h2 className="painel-subtitle">Incidência Territorial</h2>
                       <MapaCalor data={painelData.incidenciaBairros} />
                    </div>
                 )}
                 <div className="painel-col-4">
                    {/* MODIFICAÇÃO: O Gráfico de Barras agora receberá os dados reais */}
                    <h2 className="painel-subtitle">Fontes de Acionamento</h2>
                    {painelData && painelData.fontesAcionamento && (
                        <GraficoBarras data={painelData.fontesAcionamento} />
                    )}
                    
                    <h2 className="painel-subtitle">Perfil das Violações</h2>
                    {painelData && painelData.perfilViolacoes && (
                        <GraficoPizza data={painelData.perfilViolacoes.map(item => ({// Para cada item da lista, transformamos 'name' em 'tipo'
tipo: item.name,
        // e 'value' em 'quantidade'
        quantidade: item.value
    }))} 
/>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default PainelVigilancia;



