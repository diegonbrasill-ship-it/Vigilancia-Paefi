// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define o formato do objeto de usuário
interface User {
  id: number;
  username: string;
  role: string;
}

// Define o que nosso contexto vai fornecer para os componentes
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o componente "Provedor" que vai gerenciar o estado de login
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Ao carregar o app, verifica se já existe um usuário logado no localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Função para realizar o login: salva no localStorage e no estado
  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Função para realizar o logout: remove do localStorage e do estado
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Disponibiliza os valores e funções para os componentes filhos
  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cria o nosso "gancho" (hook) personalizado para facilitar o uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};