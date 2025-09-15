// frontend/src/pages/Cadastro.tsx

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

// DEFINIÇÃO COMPLETA E CORRIGIDA DO 'type Caso'
type Caso = {
    id?: string; dataCad: string; tecRef: string; tipoViolencia: string; localOcorrencia: string; frequencia: string;
    nome: string; cpf: string; nis: string; idade: string; sexo: string; corEtnia: string; bairro: string; escolaridade: string;
    rendaFamiliar: string; recebePBF: string; recebeBPC: string; recebeBE: string; // <-- recebeBE adicionado
    membrosCadUnico: string; membroPAI: string; composicaoFamiliar: string; tipoMoradia: string; referenciaFamiliar: string; // <-- referenciaFamiliar adicionado
    vitimaPCD: string; vitimaPCDDetalhe?: string; tratamentoSaude: string; tratamentoSaudeDetalhe?: string; dependeFinanceiro: string;
    encaminhamento: string; encaminhamentoDetalhe?: string; // <-- encaminhamento e detalhe adicionados
    qtdAtendimentos: string; encaminhadaSCFV: string; // <-- encaminhadaSCFV adicionado
    inseridoPAEFI: string; confirmacaoViolencia: string; canalDenuncia: string; // <-- canalDenuncia adicionado
    notificacaoSINAM: string; membroCarcerario: string; membroSocioeducacao: string; // <-- membroCarcerario e membroSocioeducacao adicionados
};

// ESTADO INICIAL COMPLETO E CORRIGIDO
const initialFormState: Caso = {
    dataCad: "", tecRef: "", tipoViolencia: "", localOcorrencia: "", frequencia: "", nome: "", cpf: "", nis: "", idade: "",
    sexo: "", corEtnia: "", bairro: "", escolaridade: "", rendaFamiliar: "", recebePBF: "", recebeBPC: "", recebeBE: "", // <--
    membrosCadUnico: "", membroPAI: "", composicaoFamiliar: "", tipoMoradia: "", referenciaFamiliar: "", // <--
    vitimaPCD: "", tratamentoSaude: "", dependeFinanceiro: "", encaminhamento: "", qtdAtendimentos: "", encaminhadaSCFV: "", // <--
    inseridoPAEFI: "", confirmacaoViolencia: "", canalDenuncia: "", notificacaoSINAM: "", membroCarcerario: "", membroSocioeducacao: "", // <--
};

const STORAGE = "vigilancia_cases_v1";

export default function Cadastro() {
    const [form, setForm] = useState<Caso>(initialFormState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: keyof Caso) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };
    
    const save = () => {
        const currentListRaw = localStorage.getItem(STORAGE);
        const currentList: Caso[] = currentListRaw ? JSON.parse(currentListRaw) : [];
        const nextList = [{ ...form, id: Date.now().toString() }, ...currentList];
        localStorage.setItem(STORAGE, JSON.stringify(nextList));
        
        toast.success("✅ Registro salvo com sucesso!");
        setForm(initialFormState);
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Novo Atendimento PAEFI</h1>
                <p className="text-slate-500">Preencha as informações do caso navegando pelas abas.</p>
            </div>

            <Tabs defaultValue="atendimento" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="atendimento">1. Atendimento</TabsTrigger>
                    <TabsTrigger value="vitima">2. Vítima</TabsTrigger>
                    <TabsTrigger value="familia">3. Família</TabsTrigger>
                    <TabsTrigger value="saude">4. Saúde</TabsTrigger>
                    <TabsTrigger value="encaminhamentos">5. Encaminhamentos</TabsTrigger>
                </TabsList>
                
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        {/* ETAPA 1 */}
                        <TabsContent value="atendimento" className="space-y-6">
                            <CardHeader className="-m-6 mb-0"><CardTitle>Dados do Atendimento e Violência</CardTitle></CardHeader>
                            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label htmlFor="dataCad">Data do Cadastro</Label><Input id="dataCad" type="date" value={form.dataCad} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="tecRef">Técnico Responsável</Label><Input id="tecRef" placeholder="Nome do técnico" value={form.tecRef} onChange={handleInputChange} /></div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Tipo de Violência</Label><Select onValueChange={handleSelectChange('tipoViolencia')} value={form.tipoViolencia}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Física">Física</SelectItem><SelectItem value="Psicológica">Psicológica</SelectItem><SelectItem value="Sexual">Sexual</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="localOcorrencia">Local da Ocorrência</Label><Input id="localOcorrencia" value={form.localOcorrencia} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="frequencia">Frequência</Label><Input id="frequencia" value={form.frequencia} onChange={handleInputChange} /></div>
                            </div>
                        </TabsContent>

                        {/* ETAPA 2 */}
                        <TabsContent value="vitima" className="space-y-6">
                             <CardHeader className="-m-6 mb-0"><CardTitle>Dados Pessoais da Vítima</CardTitle></CardHeader>
                             <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={form.nome} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={form.cpf} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="nis">NIS</Label><Input id="nis" value={form.nis} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="idade">Idade</Label><Input id="idade" type="number" value={form.idade} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Sexo</Label><Select onValueChange={handleSelectChange('sexo')} value={form.sexo}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Cor/Etnia</Label><Select onValueChange={handleSelectChange('corEtnia')} value={form.corEtnia}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Branca">Branca</SelectItem><SelectItem value="Preta">Preta</SelectItem><SelectItem value="Parda">Parda</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Escolaridade</Label><Select onValueChange={handleSelectChange('escolaridade')} value={form.escolaridade}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Fundamental Incompleto">Fundamental Incompleto</SelectItem><SelectItem value="Fundamental Completo">Fundamental Completo</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={form.bairro} onChange={handleInputChange} /></div>
                            </div>
                        </TabsContent>

                        {/* ETAPA 3 */}
                        <TabsContent value="familia" className="space-y-6">
                            <CardHeader className="-m-6 mb-0"><CardTitle>Contexto Familiar e Social</CardTitle></CardHeader>
                             <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label htmlFor="rendaFamiliar">Renda Familiar (exceto benefícios)</Label><Input id="rendaFamiliar" value={form.rendaFamiliar} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Recebe Bolsa Família (PBF)?</Label><Select onValueChange={handleSelectChange('recebePBF')} value={form.recebePBF}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Recebe BPC?</Label><Select onValueChange={handleSelectChange('recebeBPC')} value={form.recebeBPC}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Idoso">Idoso</SelectItem><SelectItem value="PCD">PCD</SelectItem><SelectItem value="NÃO">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Recebe Benefício de Erradicação (B.E)?</Label><Select onValueChange={handleSelectChange('recebeBE')} value={form.recebeBE}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Membros no CadÚnico?</Label><Select onValueChange={handleSelectChange('membrosCadUnico')} value={form.membrosCadUnico}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="composicaoFamiliar">Composição Familiar</Label><Input id="composicaoFamiliar" value={form.composicaoFamiliar} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Tipo de Moradia</Label><Select onValueChange={handleSelectChange('tipoMoradia')} value={form.tipoMoradia}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Própria">Própria</SelectItem><SelectItem value="Alugada">Alugada</SelectItem><SelectItem value="Cedida">Cedida</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="referenciaFamiliar">Referência Familiar</Label><Input id="referenciaFamiliar" value={form.referenciaFamiliar} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Membro no Sist. Carcerário?</Label><Select onValueChange={handleSelectChange('membroCarcerario')} value={form.membroCarcerario}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Membro em Socioeducação?</Label><Select onValueChange={handleSelectChange('membroSocioeducacao')} value={form.membroSocioeducacao}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                             </div>
                        </TabsContent>

                        {/* ETAPA 4 */}
                        <TabsContent value="saude" className="space-y-6">
                            <CardHeader className="-m-6 mb-0"><CardTitle>Saúde</CardTitle></CardHeader>
                             <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label>Vítima é Pessoa com Deficiência?</Label><Select onValueChange={handleSelectChange('vitimaPCD')} value={form.vitimaPCD}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                {form.vitimaPCD === 'Sim' && <div className="space-y-2"><Label htmlFor="vitimaPCDDetalhe">Qual?</Label><Input id="vitimaPCDDetalhe" value={form.vitimaPCDDetalhe} onChange={handleInputChange}/></div>}
                                <div className="space-y-2"><Label>Faz tratamento de saúde?</Label><Select onValueChange={handleSelectChange('tratamentoSaude')} value={form.tratamentoSaude}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                {form.tratamentoSaude === 'Sim' && <div className="space-y-2"><Label htmlFor="tratamentoSaudeDetalhe">Onde?</Label><Input id="tratamentoSaudeDetalhe" value={form.tratamentoSaudeDetalhe} onChange={handleInputChange}/></div>}
                                <div className="space-y-2"><Label>Depende financeiramente do agressor?</Label><Select onValueChange={handleSelectChange('dependeFinanceiro')} value={form.dependeFinanceiro}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                             </div>
                        </TabsContent>

                        {/* ETAPA 5 */}
                        <TabsContent value="encaminhamentos" className="space-y-6">
                            <CardHeader className="-m-6 mb-0"><CardTitle>Fluxos e Encaminhamentos</CardTitle></CardHeader>
                             <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label>Encaminhamento realizado?</Label><Select onValueChange={handleSelectChange('encaminhamento')} value={form.encaminhamento}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                {form.encaminhamento === 'Sim' && <div className="space-y-2"><Label htmlFor="encaminhamentoDetalhe">Para onde?</Label><Input id="encaminhamentoDetalhe" value={form.encaminhamentoDetalhe} onChange={handleInputChange}/></div>}
                                <div className="space-y-2"><Label>Vítima encaminhada ao SCFV/CDI?</Label><Select onValueChange={handleSelectChange('encaminhadaSCFV')} value={form.encaminhadaSCFV}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SCFV">SCFV</SelectItem><SelectItem value="CDI">CDI</SelectItem><SelectItem value="NÃO">NÃO</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Vítima Inserida no PAEFI?</Label><Select onValueChange={handleSelectChange('inseridoPAEFI')} value={form.inseridoPAEFI}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Confirmação da Violência</Label><Select onValueChange={handleSelectChange('confirmacaoViolencia')} value={form.confirmacaoViolencia}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Confirmada">Confirmada</SelectItem><SelectItem value="Em análise">Em análise</SelectItem><SelectItem value="Não confirmada">Não confirmada</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Notificação no SINAN?</Label><Select onValueChange={handleSelectChange('notificacaoSINAM')} value={form.notificacaoSINAM}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Sim">Sim</SelectItem><SelectItem value="Não">Não</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label htmlFor="canalDenuncia">Canal de denúncia</Label><Input id="canalDenuncia" value={form.canalDenuncia} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label htmlFor="qtdAtendimentos">Qtd. de Atendimentos</Label><Input id="qtdAtendimentos" type="number" value={form.qtdAtendimentos} onChange={handleInputChange} /></div>
                             </div>
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
            
            <div className="flex justify-end mt-6">
                <Button onClick={save} size="lg">
                    💾 Salvar Registro Completo
                </Button>
            </div>
        </div>
    );
}


