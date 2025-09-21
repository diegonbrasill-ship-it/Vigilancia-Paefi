// frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, UserCheck, AlertTriangle, HandCoins, Home, BookOpen, ShieldCheck, HeartPulse, SearchCheck, Building, Briefcase } from "lucide-react";
import { 
    getDashboardTotalCasos, getDashboardNovosNoMes, getDashboardInseridosPAEFI, 
    getDashboardCasosReincidentes, getDashboardRecebemBolsaFamilia, getDashboardRecebemBPC, 
    getDashboardMoradiaPrincipal, getDashboardEscolaridadePrincipal, getDashboardViolenciaPrincipal, 
    getDashboardViolenciaConfirmada, getDashboardNotificadosSINAN, getDashboardLocalPrincipal, 
    getDashboardContextoFamiliar, getDashboardTiposViolacao, getDashboardCasosPorBairro, 
    getDashboardCasosPorSexo, getDashboardEncaminhamentosTop5, getDashboardCanalDenuncia,
    getDashboardFilterOptions,
    getCasosFiltrados,
    getDashboardCasosPorCor,
    getDashboardCasosPorFaixaEtaria
} from "../services/api";
import ListaCasosModal from "@/components/DrillDown/ListaCasosModal";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

// --- TIPOS DE DADOS ---
type ChartData = { name: string; value: number; };
type DashboardData = { totalAtendimentos: number; novosNoMes: number; inseridosPAEFI: number; reincidentes: number; recebemBolsaFamilia: number; recebemBPC: number; moradiaPrincipal: string; escolaridadePrincipal: string; violenciaPrincipal: string; violenciaConfirmada: number; notificadosSINAN: number; localPrincipal: string; dependenciaFinanceira: number; vitimaPCD: number; membroCarcerario: number; membroSocioeducacao: number; violenciaData: ChartData[]; bairroData: ChartData[]; sexoData: ChartData[]; encaminhamentoData: ChartData[]; canalDenunciaData: ChartData[]; corData: ChartData[]; faixaEtariaData: ChartData[]; };
interface CasoParaLista { id: number; nome?: string; tecRef: string; dataCad: string; bairro?: string; }
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#dc2626", "#0ea5e9", "#64748b"];

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ mes: "" });
    const [filterOptions, setFilterOptions] = useState<{ meses: string[] }>({ meses: [] });

    // Estados para o modal (sem alterações)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalCases, setModalCases] = useState<CasoParaLista[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        getDashboardFilterOptions()
            .then(options => setFilterOptions(options.meses ? options : { meses: [] }))
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
                    bairroResponse, sexoResponse, encaminhamentoResponse, canalDenunciaResponse,
                    corResponse, faixaEtariaResponse
                ] = await Promise.all([
                    getDashboardTotalCasos(filters), getDashboardNovosNoMes(filters), getDashboardInseridosPAEFI(filters),
                    getDashboardCasosReincidentes(filters), getDashboardRecebemBolsaFamilia(filters), getDashboardRecebemBPC(filters),
                    getDashboardMoradiaPrincipal(filters), getDashboardEscolaridadePrincipal(filters), getDashboardViolenciaPrincipal(filters),
                    getDashboardViolenciaConfirmada(filters), getDashboardNotificadosSINAN(filters), getDashboardLocalPrincipal(filters),
                    getDashboardContextoFamiliar(filters), getDashboardTiposViolacao(filters), getDashboardCasosPorBairro(filters),
                    getDashboardCasosPorSexo(filters), getDashboardEncaminhamentosTop5(filters), getDashboardCanalDenuncia(filters),
                    getDashboardCasosPorCor(filters),
                    getDashboardCasosPorFaixaEtaria(filters)
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
                    corData: corResponse,
                    faixaEtariaData: faixaEtariaResponse,
                });
                
            } catch (error: any) {
                toast.error(`Erro ao carregar dados do dashboard: ${error.message}`);
                setDashboardData(null);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [filters]);
    
    const handleDrillDown = async (filtro: string, valor: string | null = null, title: string) => {
        setModalTitle(title);
        setIsModalOpen(true);
        setIsModalLoading(true);
        setModalCases([]);
        try {
            const data = await getCasosFiltrados({ filtro, valor: valor || undefined, ...filters });
            setModalCases(data);
        } catch (err: any) {
            toast.error(`Erro ao buscar a lista de casos: ${err.message}`);
            setIsModalOpen(false);
        } finally {
            setIsModalLoading(false);
        }
    };

    const renderValue = (value: number | null | undefined) => {
        if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;
        return value ?? 0;
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-slate-800">Dashboard PAEFI</h1><p className="text-slate-500">Análise de dados, perfil dos atendidos e fluxo dos serviços.</p></div>
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
                <Card onClick={() => handleDrillDown("todos", null, "Total de Atendimentos")} className="cursor-pointer hover:border-blue-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.totalAtendimentos)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("novos_no_mes", null, "Casos Novos no Mês")} className="cursor-pointer hover:border-green-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Novos no Mês</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{renderValue(dashboardData?.novosNoMes)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("inseridos_paefi", null, "Casos Inseridos no PAEFI")} className="cursor-pointer hover:border-sky-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Inseridos no PAEFI</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.inseridosPAEFI)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("reincidentes", null, "Casos Reincidentes")} className="cursor-pointer hover:border-red-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Casos Reincidentes</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{renderValue(dashboardData?.reincidentes)}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Perfil Socioeconômico</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem Bolsa Família</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.recebemBolsaFamilia)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem BPC</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.recebemBPC)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Moradia Principal</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.moradiaPrincipal}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Escolaridade Principal</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.escolaridadePrincipal}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Indicadores de Violência</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Principal</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.violenciaPrincipal}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Confirmada</CardTitle><SearchCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{renderValue(dashboardData?.violenciaConfirmada)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Notificados no SINAN</CardTitle><HeartPulse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.notificadosSINAN)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Local Principal</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.localPrincipal}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Contexto Familiar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Dependência Financeira</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.dependenciaFinanceira)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Vítima é PCD</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.vitimaPCD)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Sist. Carcerário</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.membroCarcerario)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Socioeducação</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.membroSocioeducacao)}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Análise Gráfica</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Casos por Bairro (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart layout="vertical" data={dashboardData?.bairroData ?? []} margin={{ left: 50 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#2563eb" onClick={(data: any) => handleDrillDown('por_bairro', data.name, `Casos no Bairro: ${data.name}`)} cursor="pointer" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Tipos de Violação</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.violenciaData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} onClick={(data: any) => handleDrillDown('por_violencia', data.name, `Casos de Violência: ${data.name}`)} cursor="pointer">{(dashboardData?.violenciaData ?? []).map((_, i) => <Cell key={`cell-v-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Encaminhamentos Realizados (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dashboardData?.encaminhamentoData ?? []} margin={{ left: 20 }}><XAxis dataKey="name" tick={{ fontSize: 10, angle: -20, textAnchor: 'end' }} height={50} /><YAxis /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#16a34a" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Casos por Sexo</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.sexoData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} onClick={(data: any) => handleDrillDown('por_sexo', data.name, `Casos por Sexo: ${data.name}`)} cursor="pointer">{(dashboardData?.sexoData ?? []).map((_, i) => <Cell key={`cell-s-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-3"><CardHeader><CardTitle>Canal de Denúncia</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`}/><Pie data={dashboardData?.canalDenunciaData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label onClick={(data: any) => handleDrillDown('por_canal', data.name, `Casos por Canal de Denúncia: ${data.name}`)} cursor="pointer">{(dashboardData?.canalDenunciaData ?? []).map((_, i) => <Cell key={`cell-canal-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Casos por Cor/Etnia</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.corData ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} onClick={(data: any) => handleDrillDown('por_cor_etnia', data.name, `Casos por Cor/Etnia: ${data.name}`)} cursor="pointer">{(dashboardData?.corData ?? []).map((_, i) => <Cell key={`cell-cor-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Casos por Faixa Etária</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dashboardData?.faixaEtariaData ?? []}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#9333ea" onClick={(data: any) => handleDrillDown('por_faixa_etaria', data.name, `Casos por Faixa Etária: ${data.name}`)} cursor="pointer" /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
            
            <ListaCasosModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                cases={modalCases}
                isLoading={isModalLoading}
            />
        </div>
    );
}
