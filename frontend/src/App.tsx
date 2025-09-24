// frontend/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
// 1. Importando nosso novo componente de página
import Demandas from "./pages/Demandas"; 
import 'leaflet/dist/leaflet.css';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth(); 
  
  if (isLoading) {
    return <div>Carregando sistema...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
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
            {/* 2. Registrando a rota para a nova página */}
            <Route path="demandas" element={<Demandas />} />
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

