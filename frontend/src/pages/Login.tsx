// frontend/src/pages/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Lock } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 1. IMPORTAMOS O NOSSO HOOK useAuth
import { useAuth } from "@/contexts/AuthContext";

// Imports dos componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Imports de logos e serviços de API
import prefeituraLogo from "../assets/logos/prefeitura.png";
import secretariaLogo from "../assets/logos/secretaria.png";
import creasLogo from "../assets/logos/creas.png";
import paefiLogo from "../assets/logos/paefi.png";
import { login as apiLogin } from "../services/api";

type LoginProps = {
  onLogin?: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 2. PEGAMOS A FUNÇÃO DE LOGIN DO NOSSO CONTEXTO
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // A chamada para a API continua a mesma
      const res = await apiLogin(username.trim(), password);
      
      // 3. A LÓGICA DE SALVAR NO LOCALSTORAGE FOI SUBSTITUÍDA
      // Agora, apenas chamamos a função 'login' do contexto,
      // que fará todo o trabalho pesado para nós.
      login(res.token, res.user);

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
        <p>v1.0 • Data: 15/09/2025</p>
      </footer>
    </div>
  );
}











