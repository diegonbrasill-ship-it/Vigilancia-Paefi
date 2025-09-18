// frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, UserCheck, AlertTriangle, HandCoins, Home, BookOpen, ShieldCheck, HeartPulse, SearchCheck, Building, Briefcase, FileText, Loader2 } from "lucide-react";
import { 
    getDashboardTotalCasos, getDashboardNovosNoMes, getDashboardInseridosPAEFI, 
    getDashboardCasosReincidentes, getDashboardRecebemBolsaFamilia, getDashboardRecebemBPC, 
    getDashboardMoradiaPrincipal, getDashboardEscolaridadePrincipal, getDashboardViolenciaPrincipal, 
    getDashboardViolenciaConfirmada, getDashboardNotificadosSINAN, getDashboardLocalPrincipal, 
    getDashboardContextoFamiliar, getDashboardTiposViolacao, getDashboardCasosPorBairro, 
    getDashboardCasosPorSexo, getDashboardEncaminhamentosTop5, getDashboardCanalDenuncia,
    getDashboardFilterOptions
} from "../services/api";
import { toast } from "react-toastify";

// --- TIPOS DE DADOS ---
type ChartData = { name: string; value: number; };
type DashboardData = { totalAtendimentos: number; novosNoMes: number; inseridosPAEFI: number; reincidentes: number; recebemBolsaFamilia: number; recebemBPC: number; moradiaPrincipal: string; escolaridadePrincipal: string; violenciaPrincipal: string; violenciaConfirmada: number; notificadosSINAN: number; localPrincipal: string; dependenciaFinanceira: number; vitimaPCD: number; membroCarcerario: number; membroSocioeducacao: number; violenciaData: ChartData[]; bairroData: ChartData[]; sexoData: ChartData[]; encaminhamentoData: ChartData[]; canalDenunciaData: ChartData[]; };
type Caso = { id?: string; nome?: string; dataCad?: string; tecRef?: string; tipoViolencia?: string; localOcorrencia?: string; frequencia?: string; cpf?: string; nis?: string; idade?: string; sexo?: string; corEtnia?: string; bairro?: string; escolaridade?: string; rendaFamiliar?: string; recebePBF?: string; recebeBPC?: string; recebeBE?: string; membrosCadUnico?: string; membroPAI?: string; composicaoFamiliar?: string; tipoMoradia?: string; referenciaFamiliar?: string; vitimaPCD?: string; vitimaPCDDetalhe?: string; tratamentoSaude?: string; tratamentoSaudeDetalhe?: string; dependeFinanceiro?: string; encaminhamento?: string; encaminhamentoDetalhe?: string; qtdAtendimentos?: string; encaminhadaSCFV?: string; inseridoPAEFI?: string; confirmacaoViolencia?: string; canalDenuncia?: string; notificacaoSINAM?: string; membroCarcerario?: string; membroSocioeducacao?: string; encerrado?: string; reincidente?: string; };
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#dc2626", "#0ea5e9"];

function exportCSV(filename: string, rows: any[]) { /* Seu código aqui */ }
async function exportPDF(title: string, rows: any[]) { /* Seu código aqui */ }

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalData, setModalData] = useState<{ title: string; items: Caso[] } | null>(null);
    const [filters, setFilters] = useState({ mes: "" });
    const [filterOptions, setFilterOptions] = useState<{ meses: string[] }>({ meses: [] });

    useEffect(() => {
        getDashboardFilterOptions()
            .then(options => setFilterOptions(options))
            .catch(err => toast.error("Falha ao carregar opções de filtro."));
    }, []);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setIsLoading(true);
                const [
                    totalCasosResponse, novosNoMesResponse, inseridosResponse, reincidentesResponse,
                    bolsaFamiliaResponse, bpcResponse, moradiaResponse, escolaridadeResponse,
                    violenciaPrincipalResponse, violenciaConfirmadaResponse, notificadosSINANResponse,
                    localPrincipalResponse, contextoFamiliarResponse, violenciaResponse, 
                    bairroResponse, sexoResponse, encaminhamentoResponse, canalDenunciaResponse
                ] = await Promise.all([
                    getDashboardTotalCasos(filters), getDashboardNovosNoMes(filters), getDashboardInseridosPAEFI(filters),
                    getDashboardCasosReincidentes(filters), getDashboardRecebemBolsaFamilia(filters), getDashboardRecebemBPC(filters),
                    getDashboardMoradiaPrincipal(filters), getDashboardEscolaridadePrincipal(filters), getDashboardViolenciaPrincipal(filters),
                    getDashboardViolenciaConfirmada(filters), getDashboardNotificadosSINAN(filters), getDashboardLocalPrincipal(filters),
                    getDashboardContextoFamiliar(filters), getDashboardTiposViolacao(filters), getDashboardCasosPorBairro(filters),
                    getDashboardCasosPorSexo(filters), getDashboardEncaminhamentosTop5(filters), getDashboardCanalDenuncia(filters)
                ]);
                
                setDashboardData({
                    totalAtendimentos: totalCasosResponse.totalAtendimentos,
                    novosNoMes: novosNoMesResponse.novosNoMes,
                    inseridosPAEFI: inseridosResponse.inseridosPAEFI,
                    reincidentes: reincidentesResponse.reincidentes,
                    recebemBolsaFamilia: bolsaFamiliaResponse.recebemBolsaFamilia,
                    recebemBPC: bpcResponse.recebemBPC,
                    moradiaPrincipal: moradiaResponse.moradiaPrincipal,
                    escolaridadePrincipal: escolaridadeResponse.escolaridadePrincipal,
                    violenciaPrincipal: violenciaPrincipalResponse.violenciaPrincipal,
                    violenciaConfirmada: violenciaConfirmadaResponse.violenciaConfirmada,
                    notificadosSINAN: notificadosSINANResponse.notificadosSINAN,
                    localPrincipal: localPrincipalResponse.localPrincipal,
                    ...contextoFamiliarResponse,
                    violenciaData: violenciaResponse,
                    bairroData: bairroResponse,
                    sexoData: sexoResponse,
                    encaminhamentoData: encaminhamentoResponse,
                    canalDenunciaData: canalDenunciaResponse,
                });
                
            } catch (error: any) {
                toast.error(`Erro ao carregar dados do dashboard: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [filters]);
    
    function openModal(title: string) { toast.info("A visualização detalhada será conectada à API."); }
    const renderValue = (value: number | null | undefined) => {
        if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;
        return value ?? 0;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard PAEFI</h1>
                <p className="text-slate-500">Análise de dados, perfil dos atendidos e fluxo dos serviços.</p>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Filtros de Análise</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="grid gap-1.5">
                        <Label className="text-sm font-medium">Período (Mês/Ano)</Label>
                        <Select value={filters.mes} onValueChange={val => setFilters(f => ({ ...f, mes: val === 'todos' ? '' : val }))}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos os Períodos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Períodos</SelectItem>
                                {filterOptions.meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" onClick={() => setFilters({ mes: "" })}>Limpar Filtros</Button>
                </CardContent>
            </Card>

            <h2 className="text-lg font-semibold text-slate-700 pt-4">Visão Geral do Serviço</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card onClick={() => openModal("Total de Atendimentos")} className="cursor-pointer hover:border-blue-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.totalAtendimentos)}</div></CardContent></Card>
                <Card onClick={() => openModal("Novos no Mês")} className="cursor-pointer hover:border-green-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Novos no Mês</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{renderValue(dashboardData?.novosNoMes)}</div></CardContent></Card>
                <Card onClick={() => openModal("Inseridos no PAEFI")} className="cursor-pointer hover:border-sky-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Inseridos no PAEFI</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.inseridosPAEFI)}</div></CardContent></Card>
                <Card onClick={() => openModal("Casos Reincidentes")} className="cursor-pointer hover:border-red-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Casos Reincidentes</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{renderValue(dashboardData?.reincidentes)}</div></CardContent></Card>
            </div>
            
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Perfil Socioeconômico</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card onClick={() => openModal("Recebem Bolsa Família")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem Bolsa Família</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.recebemBolsaFamilia)}</div></CardContent></Card>
              <Card onClick={() => openModal("Recebem BPC")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem BPC</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.recebemBPC)}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Moradia Principal</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.moradiaPrincipal}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Escolaridade Principal</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.escolaridadePrincipal}</div></CardContent></Card>
            </div>
            
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Indicadores de Violência</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Principal</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.violenciaPrincipal}</div></CardContent></Card>
              <Card onClick={() => openModal("Violência Confirmada")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Confirmada</CardTitle><SearchCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{renderValue(dashboardData?.violenciaConfirmada)}</div></CardContent></Card>
              <Card onClick={() => openModal("Notificados no SINAN")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Notificados no SINAN</CardTitle><HeartPulse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.notificadosSINAN)}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Local Principal</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.localPrincipal}</div></CardContent></Card>
            </div>
            
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Contexto Familiar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card onClick={() => openModal("Dependência Financeira")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Dependência Financeira</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.dependenciaFinanceira)}</div></CardContent></Card>
              <Card onClick={() => openModal("Vítima é PCD")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Vítima é PCD</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.vitimaPCD)}</div></CardContent></Card>
              <Card onClick={() => openModal("Membro em Sist. Carcerário")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Sist. Carcerário</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.membroCarcerario)}</div></CardContent></Card>
              <Card onClick={() => openModal("Membro em Socioeducação")} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Socioeducação</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.membroSocioeducacao)}</div></CardContent></Card>
            </div>

            <h2 className="text-lg font-semibold text-slate-700 pt-4">Análise Gráfica</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Casos por Bairro (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart layout="vertical" data={dashboardData?.bairroData ?? []} margin={{ left: 50 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Tipos de Violação</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.violenciaData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>{(dashboardData?.violenciaData ?? []).map((_, i) => <Cell key={`cell-v-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Encaminhamentos Realizados (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dashboardData?.encaminhamentoData ?? []} margin={{ left: 20 }}><XAxis dataKey="name" tick={{ fontSize: 10, angle: -20, textAnchor: 'end' }} height={50} /><YAxis /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#16a34a" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Casos por Sexo</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.sexoData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>{(dashboardData?.sexoData ?? []).map((_, i) => <Cell key={`cell-s-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-3"><CardHeader><CardTitle>Canal de Denúncia</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`}/><Pie data={dashboardData?.canalDenunciaData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{(dashboardData?.canalDenunciaData ?? []).map((_, i) => <Cell key={`cell-canal-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
            </div>
            
            {modalData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4">{modalData.title} ({modalData?.items.length} casos)</h3>
                        <div className="flex gap-4 mb-4">
                            <Button onClick={() => { /* Lógica de exportação será reconectada */ }}><FileText className="mr-2 h-4 w-4"/>Exportar CSV</Button>
                            <Button variant="secondary" onClick={() => { /* Lógica de exportação será reconectada */ }}>Exportar PDF</Button>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-100">
                                    <tr>
                                        <th className="p-2 border-b text-left font-medium">Nome</th>
                                        <th className="p-2 border-b text-left font-medium">Idade</th>
                                        <th className="p-2 border-b text-left font-medium">Sexo</th>
                                        <th className="p-2 border-b text-left font-medium">Violência</th>
                                        <th className="p-2 border-b text-left font-medium">Bairro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalData.items.map((c: Caso) => (
                                        <tr key={c.id} className="border-t hover:bg-slate-50">
                                            <td className="p-2">{c.nome}</td><td className="p-2">{c.idade}</td>
                                            <td className="p-2">{c.sexo}</td><td className="p-2">{c.tipoViolencia}</td>
                                            <td className="p-2">{c.bairro}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-right">
                            <Button variant="outline" onClick={() => setModalData(null)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
