// frontend/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cadastro from "./pages/Cadastro";
import Consulta from "./pages/Consulta";
import PainelVigilancia from "./pages/PainelVigilancia"; // Nova página
import Relatorios from "./pages/Relatorios"; // Nova página
import Integracoes from "./pages/Integracoes"; // Nova página

// Componente para proteger rotas, verificando o token
function PrivateRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Agrupamos todas as rotas que usarão o Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Rota inicial redireciona para o dashboard */}
          <Route index element={<Navigate to="/dashboard" />} /> 
          
          {/* Nossas páginas */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cadastro" element={<Cadastro />} />
          <Route path="consulta" element={<Consulta />} />
          <Route path="painel-vigilancia" element={<PainelVigilancia />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="integracoes" element={<Integracoes />} />
        </Route>
        
        {/* Se nenhuma rota for encontrada, volta para o login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

