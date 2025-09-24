// frontend/src/pages/DemandaDetalhe.tsx (New File)

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getDemandaById, DemandaDetalhada } from "../services/api";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";

// Helper component for displaying data
function DataItem({ label, value, isLink = false, to = "" }: { label: string; value: any, isLink?: boolean, to?: string }) {
  if (!value) return null;
  const content = isLink ? (
    <Link to={to} className="text-blue-600 hover:underline">{String(value)}</Link>
  ) : (
    String(value)
  );
  return (
    <div className="py-2">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-base text-slate-900 break-words">{content}</p>
    </div>
  );
}

export default function DemandaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [demanda, setDemanda] = useState<DemandaDetalhada | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDemanda = async () => {
      try {
        setIsLoading(true);
        const data = await getDemandaById(id);
        setDemanda(data);
      } catch (error: any) {
        toast.error(`Erro ao carregar detalhes da demanda: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDemanda();
  }, [id]);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'finalizada': return 'default';
      case 'em andamento': return 'secondary';
      case 'nova': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!demanda) {
    return <div className="text-center text-slate-500">Demanda não encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to="/demandas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Lista de Demandas
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Detalhes da Demanda #{demanda.id}</h1>
          <p className="text-slate-500">
            Visualização completa da solicitação e seu fluxo de atendimento.
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(demanda.status)} className="text-sm">{demanda.status}</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Documento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <DataItem label="Instituição de Origem" value={demanda.instituicao_origem} />
              <DataItem label="Tipo de Documento" value={demanda.tipo_documento} />
              <DataItem label="Nº do Documento" value={demanda.numero_documento} />
              <DataItem label="Data de Recebimento" value={new Date(demanda.data_recebimento).toLocaleDateString("pt-BR", { timeZone: 'UTC' })} />
              <DataItem label="Prazo para Resposta" value={demanda.prazo_resposta ? new Date(demanda.prazo_resposta).toLocaleDateString("pt-BR", { timeZone: 'UTC' }) : 'Não definido'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assunto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{demanda.assunto || "Nenhum assunto detalhado."}</p>
            </CardContent>
          </Card>
          
          {/* Future sections for history, responses, and attachments can go here */}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <DataItem label="Técnico Designado" value={demanda.tecnico_designado} />
              <DataItem label="Registrado Por" value={demanda.registrado_por} />
            </CardContent>
          </Card>

          {demanda.caso_id && (
            <Card>
              <CardHeader>
                <CardTitle>Caso Vinculado</CardTitle>
              </CardHeader>
              <CardContent>
                <DataItem label="Nome do Caso" value={demanda.nome_caso} isLink to={`/caso/${demanda.caso_id}`} />
                <DataItem label="ID do Prontuário" value={demanda.caso_associado_id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}