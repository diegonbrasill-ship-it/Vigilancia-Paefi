// frontend/src/pages/Dashboard.tsx

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, UserCheck, AlertTriangle, HandCoins, Home, BookOpen, ShieldCheck, HeartPulse, SearchCheck, Building, Briefcase } from "lucide-react";

// =======================================================================
// 📌 1. IMPORTAÇÕES SIMPLIFICADAS
// Trocamos mais de 20 importações por apenas 3 relacionadas ao dashboard.
// =======================================================================
import { 
    getDashboardData,               // Nossa nova função unificada
    getDashboardFilterOptions,      // Função para os filtros que mantivemos
    DashboardData,                  // A nova tipagem que criamos em api.ts
    getCasosFiltrados               // Função de drill-down, que não muda
} from "../services/api";
import ListaCasosModal from "@/components/DrillDown/ListaCasosModal";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

// --- TIPOS DE DADOS ---
// O tipo ChartData pode continuar aqui ou ser movido para um arquivo de tipos
type ChartData = { name: string; value: number; };
interface CasoParaLista { id: number; nome?: string; tecRef: string; dataCad: string; bairro?: string; }

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#dc2626", "#0ea5e9", "#64748b"];

export default function Dashboard() {
    // Agora usamos a tipagem importada de api.ts
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ mes: "" });
    const [filterOptions, setFilterOptions] = useState<{ meses: string[] }>({ meses: [] });

    // Estados para o modal (sem alterações)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalCases, setModalCases] = useState<CasoParaLista[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // Carregamento das opções de filtro (sem alterações)
    useEffect(() => {
        getDashboardFilterOptions()
            .then(options => setFilterOptions(options.meses ? options : { meses: [] }))
            .catch(err => toast.error("Falha ao carregar opções de filtro."));
    }, []);

    // =======================================================================
    // 📌 2. LÓGICA DE CARREGAMENTO DE DADOS UNIFICADA
    // O antigo Promise.all com 20+ chamadas foi substituído por uma única chamada.
    // =======================================================================
    useEffect(() => {
        async function loadDashboardData() {
            try {
                setIsLoading(true);
                // Apenas UMA chamada de API para buscar tudo!
                const data = await getDashboardData(filters);
                setDashboardData(data);
            } catch (error: any) {
                toast.error(`Erro ao carregar dados do dashboard: ${error.message}`);
                setDashboardData(null);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [filters]);
    
    // Função de drill-down (sem alterações)
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
    
    // =======================================================================
    // 📌 3. ATUALIZAÇÃO DO ACESSO AOS DADOS NO JSX
    // Ajustamos os caminhos para refletir a nova estrutura (ex: indicadores.totalAtendimentos)
    // =======================================================================
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
                <Card onClick={() => handleDrillDown("todos", null, "Total de Atendimentos")} className="cursor-pointer hover:border-blue-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.totalAtendimentos)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("novos_no_mes", null, "Casos Novos no Mês")} className="cursor-pointer hover:border-green-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Novos no Mês</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{renderValue(dashboardData?.indicadores?.novosNoMes)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("inseridos_paefi", null, "Casos Inseridos no PAEFI")} className="cursor-pointer hover:border-sky-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Inseridos no PAEFI</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.inseridosPAEFI)}</div></CardContent></Card>
                <Card onClick={() => handleDrillDown("reincidentes", null, "Casos Reincidentes")} className="cursor-pointer hover:border-red-500 transition-all"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Casos Reincidentes</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{renderValue(dashboardData?.indicadores?.reincidentes)}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Perfil Socioeconômico</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem Bolsa Família</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.recebemBolsaFamilia)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem BPC</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.recebemBPC)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Moradia Principal</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.principais?.moradiaPrincipal}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Escolaridade Principal</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.principais?.escolaridadePrincipal}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Indicadores de Violência</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Principal</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.principais?.violenciaPrincipal}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Confirmada</CardTitle><SearchCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{renderValue(dashboardData?.indicadores?.violenciaConfirmada)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Notificados no SINAN</CardTitle><HeartPulse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.notificadosSINAN)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Local Principal</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{isLoading ? "..." : dashboardData?.principais?.localPrincipal}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Contexto Familiar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Dependência Financeira</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.contextoFamiliar?.dependenciaFinanceira)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Vítima é PCD</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.contextoFamiliar?.vitimaPCD)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Sist. Carcerário</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.contextoFamiliar?.membroCarcerario)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Socioeducação</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{renderValue(dashboardData?.indicadores?.contextoFamiliar?.membroSocioeducacao)}</div></CardContent></Card>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Análise Gráfica</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Casos por Bairro (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart layout="vertical" data={dashboardData?.graficos?.casosPorBairro ?? []} margin={{ left: 50 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#2563eb" onClick={(data: any) => handleDrillDown('por_bairro', data.name, `Casos no Bairro: ${data.name}`)} cursor="pointer" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Tipos de Violação</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.graficos?.tiposViolacao ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} onClick={(data: any) => handleDrillDown('por_violencia', data.name, `Casos de Violência: ${data.name}`)} cursor="pointer">{(dashboardData?.graficos?.tiposViolacao ?? []).map((_, i) => <Cell key={`cell-v-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Encaminhamentos Realizados (Top 5)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dashboardData?.graficos?.encaminhamentosTop5 ?? []} margin={{ left: 20 }}><XAxis dataKey="name" tick={{ fontSize: 10, angle: -20, textAnchor: 'end' }} height={50} /><YAxis /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#16a34a" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Casos por Sexo</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.graficos?.casosPorSexo ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} onClick={(data: any) => handleDrillDown('por_sexo', data.name, `Casos por Sexo: ${data.name}`)} cursor="pointer">{(dashboardData?.graficos?.casosPorSexo ?? []).map((_, i) => <Cell key={`cell-s-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-3"><CardHeader><CardTitle>Canal de Denúncia</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`}/><Pie data={dashboardData?.graficos?.canalDenuncia ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label onClick={(data: any) => handleDrillDown('por_canal', data.name, `Casos por Canal de Denúncia: ${data.name}`)} cursor="pointer">{(dashboardData?.graficos?.canalDenuncia ?? []).map((_, i) => <Cell key={`cell-canal-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Casos por Cor/Etnia</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Tooltip formatter={(value: number) => `${value} casos`} /><Pie data={dashboardData?.graficos?.casosPorCor ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} onClick={(data: any) => handleDrillDown('por_cor_etnia', data.name, `Casos por Cor/Etnia: ${data.name}`)} cursor="pointer">{(dashboardData?.graficos?.casosPorCor ?? []).map((_, i) => <Cell key={`cell-cor-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Casos por Faixa Etária</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dashboardData?.graficos?.casosPorFaixaEtaria ?? []}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis /><Tooltip formatter={(value: number) => `${value} casos`}/><Bar dataKey="value" fill="#9333ea" onClick={(data: any) => handleDrillDown('por_faixa_etaria', data.name, `Casos por Faixa Etária: ${data.name}`)} cursor="pointer" /></BarChart></ResponsiveContainer></CardContent></Card>
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
