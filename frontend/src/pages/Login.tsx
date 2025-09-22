// frontend/src/pages/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Lock } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// O hook useAuth é tudo que precisamos agora
import { useAuth } from "@/contexts/AuthContext";

// Imports dos componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Imports de logos
import prefeituraLogo from "../assets/logos/prefeitura.png";
import secretariaLogo from "../assets/logos/secretaria.png";
import creasLogo from "../assets/logos/creas.png";
import paefiLogo from "../assets/logos/paefi.png";

// 1. REMOVIDO: A importação direta da API não é mais necessária aqui.
// import { login as apiLogin } from "../services/api";

type LoginProps = {
  onLogin?: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pegamos a função de login do nosso contexto
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Validação simples para evitar chamadas vazias
    if (!username.trim() || !password) {
        toast.error("Por favor, preencha o usuário e a senha.");
        return;
    }
      
    setLoading(true);
    try {
      // 2. ALTERADO: A lógica foi simplificada para uma única chamada.
      // A função 'login' do nosso contexto agora faz tudo: chama a API,
      // salva no localStorage e atualiza o estado da aplicação.
      await login(username.trim(), password);

      toast.success("Login efetuado com sucesso");
      onLogin?.();
      navigate("/dashboard");

    } catch (err: any) {
      toast.error(err?.message || "Usuário ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <ToastContainer position="top-right" hideProgressBar />
      
      <header className="flex items-center justify-center gap-4 sm:gap-8 mb-8">
        <img src={prefeituraLogo} alt="Prefeitura" className="h-10 sm:h-12 object-contain" />
        <img src={secretariaLogo} alt="Secretaria" className="h-10 sm:h-12 object-contain" />
        <img src={creasLogo} alt="CREAS" className="h-12 sm:h-14 object-contain" />
      </header>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={paefiLogo} alt="PAEFI" className="h-14 object-contain mb-2" />
          <CardTitle className="text-xl">Sistema de Vigilância Socioassistencial</CardTitle>
          <CardDescription>Acesse com seu usuário institucional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="pl-9"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-xs text-slate-400">
        <p>Secretaria de Desenvolvimento Social e Habitação • Prefeitura Municipal de Patos — PB</p>
        <p>v1.0 • Data: 22/09/2025</p>
      </footer>
    </div>
  );
}











