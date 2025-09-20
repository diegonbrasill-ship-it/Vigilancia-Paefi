// frontend/src/pages/GerenciarUsuarios.tsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUsers, createUser } from '../services/api';

// Componentes UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

// Tipagem para o objeto de usuário
interface User {
  id: number;
  username: string;
  role: string;
}

export default function GerenciarUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para o formulário de novo usuário
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('');

  // Função para buscar a lista de usuários
  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error: any) {
      toast.error(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca os usuários quando a página carrega
  useEffect(() => {
    fetchUsers();
  }, []);

  // Função para lidar com a criação de um novo usuário
  const handleCreateUser = async () => {
    if (!newUsername || !newPassword || !newRole) {
      toast.warn('Todos os campos são obrigatórios.');
      return;
    }
    setIsSaving(true);
    try {
      await createUser({
        username: newUsername,
        password: newPassword,
        role: newRole,
      });
      toast.success(`Usuário "${newUsername}" criado com sucesso!`);
      // Limpa o formulário e recarrega a lista
      setNewUsername('');
      setNewPassword('');
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /> Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
      <p className="text-slate-500">
        Crie e gerencie as contas de acesso para a equipe do PAEFI e da Vigilância.
      </p>

      {/* Card de Criação de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Usuário</CardTitle>
          <CardDescription>
            Preencha os dados para criar uma nova credencial de acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username" 
                placeholder="ex: maria.silva"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Provisória</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil de Acesso</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione um perfil..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="vigilancia">Vigilância</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateUser} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Criar Usuário
          </Button>
        </CardContent>
      </Card>

      {/* Card da Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome de Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    {/* Botões de Ação (Resetar Senha, Editar) podem ser adicionados aqui no futuro */}
                    <Button variant="outline" size="sm" disabled>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}