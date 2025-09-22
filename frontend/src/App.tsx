// frontend/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// 1. IMPORTAMOS O AuthProvider de volta para este arquivo
import { AuthProvider, useAuth } from "./contexts/AuthContext"; 
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cadastro from "./pages/Cadastro";
import Consulta from "./pages/Consulta";
import CasoDetalhe from "./pages/CasoDetalhe";
import PainelVigilancia from "./pages/PainelVigilancia/PainelVigilancia";
import Relatorios from "./pages/Relatorios";
import Integracoes from "./pages/Integracoes";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import 'leaflet/dist/leaflet.css';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth(); 
  
  if (isLoading) {
    // Enquanto o AuthContext verifica o localStorage, mostramos uma tela de carregamento
    return <div>Carregando sistema...</div>;
  }

  // Após a verificação, redirecionamos se não estiver autenticado
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    // 2. O AuthProvider VOLTA A ENVOLVER o BrowserRouter AQUI DENTRO
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} /> 
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cadastro" element={<Cadastro />} />
            <Route path="cadastro/:id" element={<Cadastro />} />
            <Route path="consulta" element={<Consulta />} />
            <Route path="caso/:id" element={<CasoDetalhe />} />
            <Route path="painel-vigilancia" element={<PainelVigilancia />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="integracoes" element={<Integracoes />} />
            <Route path="gerenciar-usuarios" element={<GerenciarUsuarios />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

