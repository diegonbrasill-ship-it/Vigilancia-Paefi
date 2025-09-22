// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// 1. IMPORTANDO a função de login da nossa API
import { login as apiLogin } from '../services/api';

// Define o formato do objeto de usuário (sem alterações)
interface User {
  id: number;
  username: string;
  role: string;
}

// Define o que nosso contexto vai fornecer para os componentes
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean; // <-- 2. ADICIONADO: para sabermos quando a verificação inicial terminou
  login: (username: string, password: string) => Promise<void>; // <-- 3. ALTERADO: para receber usuário/senha
  logout: () => void;
}

// Cria o contexto (sem alterações)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o componente "Provedor" que vai gerenciar o estado de login
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // 4. ADICIONADO: Estado para controlar o carregamento inicial
  const [isLoading, setIsLoading] = useState(true);

  // Ao carregar o app, verifica se já existe um usuário logado no localStorage
  useEffect(() => {
    try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    } catch (error) {
        console.error("Falha ao ler dados do localStorage:", error);
        // Limpa o estado em caso de erro
        setUser(null);
        localStorage.clear();
    } finally {
        // Garante que o carregamento termine, independentemente do resultado
        setIsLoading(false);
    }
  }, []);

  // 5. ALTERADO: A função de login agora é mais inteligente
  // Ela recebe as credenciais, chama a API e gerencia todo o processo.
  const login = async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    setUser(response.user);
  };

  // Função para realizar o logout (sem alterações)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado (sem alterações)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};