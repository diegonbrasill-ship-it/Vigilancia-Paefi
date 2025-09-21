// frontend/src/services/api.ts

const API_BASE_URL = "http://localhost:4000";

// --- TIPOS DE DADOS ---
type LoginResponse = { message: string; token: string; user: { id: number; username: string; role: string; }; };
type ChartData = { name: string; value: number; };

// --- FUNÇÕES DE AUTENTICAÇÃO, CASOS, ACOMPANHAMENTOS, ETC ---

export async function login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro de autenticação');
    return data;
}

export async function createCase(casoData: any): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/casos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(casoData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar o caso');
    return data;
}

export async function updateCase(id: number | string, casoData: any): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/casos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(casoData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Erro ao atualizar o caso ${id}`);
    return data;
}

export async function updateCasoStatus(casoId: string | number, status: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    
    const res = await fetch(`${API_BASE_URL}/api/casos/${casoId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao atualizar o status do caso');
    }
    return res.json();
}

export async function deleteCaso(casoId: string | number): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    
    const res = await fetch(`${API_BASE_URL}/api/casos/${casoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao excluir o caso');
    }
    return res.json();
}

export async function getCasos(filters?: { tecRef?: string }): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const params = new URLSearchParams();
    if (filters?.tecRef && filters.tecRef.trim() !== '') {
        params.append('tecRef', filters.tecRef);
    }
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URL}/api/casos?${queryString}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao buscar casos');
    return data;
}

export async function getCasoById(id: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/casos/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao buscar detalhes do caso');
    return data;
}

export async function getAcompanhamentos(casoId: string): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/acompanhamentos/${casoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao buscar histórico');
    }
    return res.json();
}

export async function createAcompanhamento(casoId: string, texto: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/acompanhamentos/${casoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texto }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar acompanhamento');
    }
    return res.json();
}

export async function generateReport(filters: { startDate: string, endDate: string }): Promise<Blob> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/relatorios/geral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(filters),
    });
    if (!res.ok) {
        try {
            const err = await res.json();
            throw new Error(err.message || 'Erro ao gerar relatório');
        } catch (e) {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
    }
    return res.blob();
}

export async function getEncaminhamentos(casoId: string): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/casos/${casoId}/encaminhamentos`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao buscar encaminhamentos');
    }
    return res.json();
}

export async function createEncaminhamento(data: { casoId: string; servicoDestino: string; dataEncaminhamento: string; observacoes: string; }): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/encaminhamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar encaminhamento');
    }
    return res.json();
}

export async function updateEncaminhamento(id: number, data: { status: string; dataRetorno?: string }): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/encaminhamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao atualizar status do encaminhamento');
    }
    return res.json();
}

export async function getAnexos(casoId: string): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/anexos/casos/${casoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao buscar anexos');
    }
    return res.json();
}

export async function uploadAnexo(casoId: string, formData: FormData): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/anexos/upload/${casoId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao enviar anexo');
    }
    return res.json();
}

export async function downloadAnexo(anexoId: number): Promise<{ blob: Blob, filename: string }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/anexos/download/${anexoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao baixar anexo');
    }
    const disposition = res.headers.get('content-disposition');
    let filename = 'arquivo_anexo';
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
        }
    }
    const blob = await res.blob();
    return { blob, filename };
}

export async function getUsers(): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao buscar usuários');
    }
    return res.json();
}

export async function createUser(data: { username: string; password: string; role: string }): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar usuário');
    }
    return res.json();
}

interface FiltrosCasos {
    filtro?: string;
    valor?: string;
    tecRef?: string;
}

export async function getCasosFiltrados(filters?: FiltrosCasos): Promise<any[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const params = new URLSearchParams();
    if (filters) {
        if (filters.filtro) params.append('filtro', filters.filtro);
        if (filters.valor) params.append('valor', filters.valor);
        if (filters.tecRef) params.append('tecRef', filters.tecRef);
    }
    const queryString = params.toString();
    const res = await fetch(`${API_BASE_URL}/api/casos?${queryString}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao buscar casos filtrados');
    return data;
}


// --- FUNÇÕES DO DASHBOARD ---
const buildUrlWithFilters = (baseUrl: string, filters?: { mes?: string }) => {
    const url = new URL(baseUrl);
    if (filters?.mes) {
        url.searchParams.append('mes', filters.mes);
    }
    return url.toString();
};
const fetchDashboardData = async (endpoint: string, filters?: { mes?: string }) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const url = buildUrlWithFilters(`${API_BASE_URL}/api/dashboard${endpoint}`, filters);
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Erro ao buscar dados de ${endpoint}`);
    }
    return res.json();
};
export const getDashboardFilterOptions = () => fetchDashboardData('/filter-options');
export const getDashboardTotalCasos = (filters?: { mes?: string }) => fetchDashboardData('/total-casos', filters);
export const getDashboardNovosNoMes = (filters?: { mes?: string }) => fetchDashboardData('/novos-no-mes', filters);
export const getDashboardInseridosPAEFI = (filters?: { mes?: string }) => fetchDashboardData('/inseridos-paefi', filters);
export const getDashboardCasosReincidentes = (filters?: { mes?: string }) => fetchDashboardData('/casos-reincidentes', filters);
export const getDashboardRecebemBolsaFamilia = (filters?: { mes?: string }) => fetchDashboardData('/recebem-bolsa-familia', filters);
export const getDashboardRecebemBPC = (filters?: { mes?: string }) => fetchDashboardData('/recebem-bpc', filters);
export const getDashboardMoradiaPrincipal = (filters?: { mes?: string }) => fetchDashboardData('/moradia-principal', filters);
export const getDashboardEscolaridadePrincipal = (filters?: { mes?: string }) => fetchDashboardData('/escolaridade-principal', filters);
export const getDashboardViolenciaPrincipal = (filters?: { mes?: string }) => fetchDashboardData('/violencia-principal', filters);
export const getDashboardViolenciaConfirmada = (filters?: { mes?: string }) => fetchDashboardData('/violencia-confirmada', filters);
export const getDashboardNotificadosSINAN = (filters?: { mes?: string }) => fetchDashboardData('/notificados-sinan', filters);
export const getDashboardLocalPrincipal = (filters?: { mes?: string }) => fetchDashboardData('/local-principal', filters);
export const getDashboardContextoFamiliar = (filters?: { mes?: string }) => fetchDashboardData('/contexto-familiar', filters);
export const getDashboardTiposViolacao = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/tipos-violacao', filters);
export const getDashboardCasosPorBairro = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/casos-por-bairro', filters);
export const getDashboardCasosPorSexo = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/casos-por-sexo', filters);
export const getDashboardEncaminhamentosTop5 = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/encaminhamentos-top5', filters);
export const getDashboardCanalDenuncia = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/canal-denuncia', filters);
export const getDashboardCasosPorCor = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/casos-por-cor', filters);
export const getDashboardCasosPorFaixaEtaria = (filters?: { mes?: string }): Promise<ChartData[]> => fetchDashboardData('/casos-por-faixa-etaria', filters);


// --- FUNÇÕES DO PAINEL DE VIGILÂNCIA ---
export async function getVigilanciaFluxoDemanda(): Promise<{ casosNovosUltimos30Dias: number }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/fluxo-demanda`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar fluxo de demanda'); }
    return res.json();
}

export async function getVigilanciaSobrecargaEquipe(): Promise<{ mediaCasosPorTecnico: number; limiteRecomendado: number }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/sobrecarga-equipe`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar dados de sobrecarga'); }
    return res.json();
}

export async function getVigilanciaIncidenciaBairros(): Promise<{ bairro: string; casos: number }[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/incidencia-bairros`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar dados de incidência por bairros'); }
    return res.json();
}

export async function getVigilanciaFontesAcionamento(): Promise<{ fonte: string; quantidade: number }[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/fontes-acionamento`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar dados de fontes de acionamento'); }
    return res.json();
}

export async function getVigilanciaTaxaReincidencia(): Promise<{ taxaReincidencia: number }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/taxa-reincidencia`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar taxa de reincidência'); }
    return res.json();
}

export async function getVigilanciaPerfilViolacoes(): Promise<{ tipo: string; quantidade: number }[]> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Usuário não autenticado.');
    const res = await fetch(`${API_BASE_URL}/api/vigilancia/perfil-violacoes`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erro ao buscar perfil de violações'); }
    return res.json();
}