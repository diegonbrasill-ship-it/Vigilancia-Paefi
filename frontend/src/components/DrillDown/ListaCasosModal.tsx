import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye } from "lucide-react";

// 📌 Tipagem para os dados que o modal recebe
interface CasoParaLista {
  id: number;
  nome?: string; // O nome é opcional, pois pode vir nulo para o perfil Vigilância
  tecRef: string;
  dataCad: string;
  bairro?: string;
}

interface ListaCasosModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cases: CasoParaLista[];
  isLoading: boolean;
}

export default function ListaCasosModal({ isOpen, onClose, title, cases, isLoading }: ListaCasosModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            Lista detalhada de casos correspondentes ao indicador selecionado.
            {cases.length > 0 && ` Total: ${cases.length} caso(s).`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <p className="ml-4 text-slate-500">Buscando casos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID do Caso</TableHead>
                  <TableHead>Nome (Vítima)</TableHead>
                  <TableHead>Técnico Resp.</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length > 0 ? (
                  cases.map((caso) => (
                    <TableRow key={caso.id}>
                      <TableCell className="font-medium">{caso.id}</TableCell>
                      {/* Lógica para anonimização: Se não houver nome, mostra um traço */}
                      <TableCell>{caso.nome || '---'}</TableCell>
                      <TableCell>{caso.tecRef}</TableCell>
                      <TableCell>{caso.bairro || 'Não informado'}</TableCell>
                      <TableCell>{new Date(caso.dataCad).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/caso/${caso.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Prontuário
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum caso encontrado para este filtro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}