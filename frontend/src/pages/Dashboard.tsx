// frontend/src/pages/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, UserCheck, AlertTriangle, HandCoins, Home, BookOpen, ShieldCheck, HeartPulse, SearchCheck, Building, Briefcase, FileText } from "lucide-react";
import { seedMockData, clearMockData } from "../mockData";

// TIPO CASO - ESPELHO EXATO DO CADASTRO.TSX
type Caso = {
    id?: string; nome?: string; dataCad?: string; tecRef?: string; tipoViolencia?: string; localOcorrencia?: string; frequencia?: string;
    cpf?: string; nis?: string; idade?: string; sexo?: string; corEtnia?: string; bairro?: string; escolaridade?: string;
    rendaFamiliar?: string; recebePBF?: string; recebeBPC?: string; recebeBE?: string; membrosCadUnico?: string; membroPAI?: string;
    composicaoFamiliar?: string; tipoMoradia?: string; referenciaFamiliar?: string; vitimaPCD?: string; vitimaPCDDetalhe?: string;
    tratamentoSaude?: string; tratamentoSaudeDetalhe?: string; dependeFinanceiro?: string; encaminhamento?: string; encaminhamentoDetalhe?: string;
    qtdAtendimentos?: string; encaminhadaSCFV?: string; inseridoPAEFI?: string; confirmacaoViolencia?: string; canalDenuncia?: string;
    notificacaoSINAM?: string; membroCarcerario?: string; membroSocioeducacao?: string;
    encerrado?: string; reincidente?: string;
};

const STORAGE = "vigilancia_cases_v1";
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#dc2626", "#0ea5e9"];
function isValidDate(d: Date) { return d instanceof Date && !isNaN(d.valueOf()); }

// FUNÇÕES DE EXPORTAÇÃO E MODAL (DO SEU CÓDIGO ORIGINAL)
function exportCSV(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) return;
    const header = Object.keys(rows[0]).join(",");
    const csv = [ header, ...rows.map(r => Object.values(r).map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")) ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
async function exportPDF(title: string, rows: any[]) {
    try {
        const { default: jsPDF } = await import("jspdf");
        await import("jspdf-autotable");
        const doc = new jsPDF();
        doc.text(title, 14, 16);
        const table = rows.map(r => [r.nome ?? "", r.idade ?? "", r.sexo ?? "", r.tipoViolencia ?? "", r.bairro ?? ""]);
        (doc as any).autoTable({
            head: [["Nome", "Idade", "Sexo", "Violência", "Bairro"]],
            body: table,
            startY: 20,
        });
        doc.save(`${title}.pdf`);
    } catch (err) {
        console.warn("Falha ao gerar PDF.", err);
    }
}


export default function Dashboard() {
    const [list, setList] = useState<Caso[]>([]);
    const [modalData, setModalData] = useState<{ title: string; items: Caso[] } | null>(null);
    const [filters, setFilters] = useState({
        mes: "", tecRef: "", tipoViolencia: "", bairro: "", sexo: "", escolaridade: "", confirmacaoViolencia: ""
    });

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE);
        if (raw) { try { setList(JSON.parse(raw)); } catch { setList([]); } }
    }, []);

    const uniqueValues = useMemo(() => {
        const getUnique = (field: keyof Caso) => Array.from(new Set(list.map(c => (c[field] ?? "").toString().trim()).filter(Boolean))).sort();
        const meses = Array.from(new Set(list.map(c => {
            if (!c.dataCad) return ""; const d = new Date(c.dataCad); if (!isValidDate(d)) return "";
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }).filter(Boolean))).sort();
        return {
            tecnicos: getUnique("tecRef"), tipos: getUnique("tipoViolencia"), bairros: getUnique("bairro"),
            sexos: getUnique("sexo"), meses, escolaridades: getUnique("escolaridade"), confirmacoes: getUnique("confirmacaoViolencia"),
        };
    }, [list]);

    const filteredList = useMemo(() => {
        return list.filter(c => {
            const normalize = (s?: string) => (s ?? "").toLowerCase().trim();
            if (filters.mes && filters.mes !== "" && c.dataCad) {
                const d = new Date(c.dataCad);
                if (isValidDate(d)) {
                    const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    if (mesAno !== filters.mes) return false;
                }
            }
            if (filters.tecRef && filters.tecRef !== "" && normalize(c.tecRef) !== normalize(filters.tecRef)) return false;
            if (filters.tipoViolencia && filters.tipoViolencia !== "" && normalize(c.tipoViolencia) !== normalize(filters.tipoViolencia)) return false;
            if (filters.bairro && filters.bairro !== "" && normalize(c.bairro) !== normalize(filters.bairro)) return false;
            if (filters.sexo && filters.sexo !== "" && normalize(c.sexo) !== normalize(filters.sexo)) return false;
            if (filters.escolaridade && filters.escolaridade !== "" && normalize(c.escolaridade) !== normalize(filters.escolaridade)) return false;
            if (filters.confirmacaoViolencia && filters.confirmacaoViolencia !== "" && normalize(c.confirmacaoViolencia) !== normalize(filters.confirmacaoViolencia)) return false;
            return true;
        });
    }, [list, filters]);

    const groupBy = (field: keyof Caso, slice = 0) => {
        const grouped = Object.entries(filteredList.reduce((acc: Record<string, number>, cur) => {
            const key = (cur[field] ?? "Não Informado").toString().trim();
            if (key && key !== "Não Informado") {
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        return slice > 0 ? grouped.slice(0, slice) : grouped;
    }
    
    // Arrays de dados para os KPIs
    const novosMesArr = useMemo(() => { const now = new Date(); return filteredList.filter(c => { if (!c.dataCad) return false; const d = new Date(c.dataCad); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }); }, [filteredList]);
    const inseridoPAEFI = filteredList.filter(c => c.inseridoPAEFI === "Sim");
    const reincidentes = filteredList.filter(c => c.reincidente === "Sim");
    const recebePBF = filteredList.filter(c => c.recebePBF === "Sim");
    const recebeBPC = filteredList.filter(c => c.recebeBPC !== "NÃO");
    const notificadosSINAN = filteredList.filter(c => c.notificacaoSINAM === "Sim");
    const violenciaConfirmada = filteredList.filter(c => c.confirmacaoViolencia === "Confirmada");
    const comMembroCarcerario = filteredList.filter(c => c.membroCarcerario === "Sim");
    const comMembroSocioeducacao = filteredList.filter(c => c.membroSocioeducacao === "Sim");
    const dependeFinanceiro = filteredList.filter(c => c.dependeFinanceiro === "Sim");
    const vitimaPCD = filteredList.filter(c => c.vitimaPCD === "Sim");

    // LÓGICA PARA GRÁFICOS
    const violenciaData = useMemo(() => groupBy("tipoViolencia"), [filteredList]);
    const bairroData = useMemo(() => groupBy("bairro", 5), [filteredList]);
    const encaminhamentoData = useMemo(() => groupBy("encaminhamentoDetalhe", 5), [filteredList]);
    const canalDenunciaData = useMemo(() => groupBy("canalDenuncia"), [filteredList]);
    
    function openModal(title: string, items: Caso[]) { setModalData({ title, items }); }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard PAEFI</h1>
                <p className="text-slate-500">Análise de dados, perfil dos atendidos e fluxo dos serviços.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filtros de Análise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Período</label><Select value={filters.mes} onValueChange={val => setFilters(f => ({ ...f, mes: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Téc. Referência</label><Select value={filters.tecRef} onValueChange={val => setFilters(f => ({ ...f, tecRef: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.tecnicos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Bairro</label><Select value={filters.bairro} onValueChange={val => setFilters(f => ({ ...f, bairro: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.bairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Sexo</label><Select value={filters.sexo} onValueChange={val => setFilters(f => ({ ...f, sexo: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.sexos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Violência</label><Select value={filters.tipoViolencia} onValueChange={val => setFilters(f => ({ ...f, tipoViolencia: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Escolaridade</label><Select value={filters.escolaridade} onValueChange={val => setFilters(f => ({ ...f, escolaridade: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.escolaridades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium">Confirmação</label><Select value={filters.confirmacaoViolencia} onValueChange={val => setFilters(f => ({ ...f, confirmacaoViolencia: val }))}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{uniqueValues.confirmacoes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <Button variant="ghost" onClick={() => setFilters({ mes: "", tecRef: "", tipoViolencia: "", bairro: "", sexo: "", escolaridade: "", confirmacaoViolencia: "" })}>Limpar Filtros</Button>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button onClick={seedMockData}>Gerar Dados de Teste</Button>
                <Button variant="destructive" onClick={clearMockData}>Limpar Dados de Teste</Button>
            </div>

            <h2 className="text-lg font-semibold text-slate-700 pt-4">Visão Geral do Serviço</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card onClick={() => openModal("Total de Atendimentos", filteredList)} className="cursor-pointer hover:border-blue-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{filteredList.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Novos no Mês", novosMesArr)} className="cursor-pointer hover:border-green-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Novos no Mês</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">+{novosMesArr.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Inseridos no PAEFI", inseridoPAEFI)} className="cursor-pointer hover:border-sky-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Inseridos no PAEFI</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{inseridoPAEFI.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Casos Reincidentes", reincidentes)} className="cursor-pointer hover:border-red-500"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Casos Reincidentes</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{reincidentes.length}</div></CardContent></Card>
            </div>

            <h2 className="text-lg font-semibold text-slate-700 pt-4">Perfil Socioeconômico</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card onClick={() => openModal("Recebem Bolsa Família", recebePBF)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem Bolsa Família</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{recebePBF.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Recebem BPC", recebeBPC)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Recebem BPC</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{recebeBPC.length}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Moradia Principal</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{(groupBy("tipoMoradia")[0]?.name) || 'N/I'}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Escolaridade Principal</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{(groupBy("escolaridade")[0]?.name) || 'N/I'}</div></CardContent></Card>
            </div>
            
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Indicadores de Violência</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Principal</CardTitle><ShieldCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{(groupBy("tipoViolencia")[0]?.name) || 'N/I'}</div></CardContent></Card>
                <Card onClick={() => openModal("Violência Confirmada", violenciaConfirmada)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Violência Confirmada</CardTitle><SearchCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{violenciaConfirmada.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Notificados no SINAN", notificadosSINAN)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Notificados no SINAN</CardTitle><HeartPulse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{notificadosSINAN.length}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Local Principal</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl font-bold">{(groupBy("localOcorrencia")[0]?.name) || 'N/I'}</div></CardContent></Card>
            </div>
            
            <h2 className="text-lg font-semibold text-slate-700 pt-4">Contexto Familiar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card onClick={() => openModal("Dependência Financeira do Agressor", dependeFinanceiro)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Dependência Financeira</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dependeFinanceiro.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Vítimas são PCD", vitimaPCD)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Vítima é PCD</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{vitimaPCD.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Famílias com Membro em Sist. Carcerário", comMembroCarcerario)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Sist. Carcerário</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{comMembroCarcerario.length}</div></CardContent></Card>
                <Card onClick={() => openModal("Famílias com Membro em Socioeducação", comMembroSocioeducacao)} className="cursor-pointer"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Membro em Socioeducação</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{comMembroSocioeducacao.length}</div></CardContent></Card>
            </div>

            <h2 className="text-lg font-semibold text-slate-700 pt-4">Análise Gráfica</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Casos por Bairro (Top 5)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart layout="vertical" data={bairroData} margin={{ left: 50 }}><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Tipos de Violação</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart><Tooltip /><Pie data={violenciaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>{violenciaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Encaminhamentos Realizados (Top 5)</CardTitle></CardHeader>
                    <CardContent>
                         <BarChart data={encaminhamentoData} margin={{ left: 20 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#16a34a" /></BarChart>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Canal de Denúncia</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart><Tooltip /><Pie data={canalDenunciaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{canalDenunciaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            {modalData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4">{modalData.title} ({modalData.items.length} casos)</h3>
                        <div className="flex gap-4 mb-4">
                            <Button onClick={() => exportCSV(`${modalData.title}.csv`, modalData.items)}><FileText className="mr-2 h-4 w-4"/>Exportar CSV</Button>
                            <Button variant="secondary" onClick={() => exportPDF(modalData.title, modalData.items)}>Exportar PDF</Button>
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
                                    {modalData.items.map((c) => (
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




