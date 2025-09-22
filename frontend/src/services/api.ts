// frontend/src/services/api.ts

const API_BASE_URL = "http://localhost:4000";

// --- TIPOS DE DADOS ---
type LoginResponse = { message: string; token: string; user: { id: number; username: string; role: string; }; };
type ChartData = { name: string; value: number; };
export interface DashboardData {
    indicadores: {
        totalAtendimentos: number;
        novosNoMes: number;
        inseridosPAEFI: number;
        reincidentes: number;
        recebemBolsaFamilia: number;
        recebemBPC: number;
        violenciaConfirmada: number;
        notificadosSINAN: number;
        contextoFamiliar: {
            dependenciaFinanceira: number;
            vitimaPCD: number;
            membroCarcerario: number;
            membroSocioeducacao: number;
        };
    };
    principais: {
        moradiaPrincipal: string;
        escolaridadePrincipal: string;
        violenciaPrincipal: string;
        localPrincipal: string;
    };
    graficos: {
        tiposViolacao: ChartData[];
        casosPorBairro: ChartData[];
        casosPorSexo: ChartData[];
        encaminhamentosTop5: ChartData[];
        canalDenuncia: ChartData[];
        casosPorCor: ChartData[];
        casosPorFaixaEtaria: ChartData[];
    };
}
interface FiltrosCasos {
    filtro?: string;
    valor?: string;
    tecRef?: string;
}

// =======================================================================
// 1. A NOVA FUNÇÃO "MESTRE" fetchWithAuth
// Esta função é agora a ÚNICA que acessa o localStorage.
// Ela é inteligente o suficiente para lidar com JSON, FormData e downloads.
// =======================================================================
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    // A verificação de token agora é feita em um só lugar.
    if (!token) throw new Error('Usuário não autenticado. Por favor, faça o login novamente.');

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    // Evita definir Content-Type para FormData, o navegador faz isso automaticamente
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.message || 'Ocorreu um erro na requisição');
    }

    // Para downloads, retornamos a resposta bruta para extrair o blob e o nome do arquivo
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream') || contentType.includes('application/vnd.openxmlformats-officedocument'))) {
        return response;
    }
    
    // Para a maioria das chamadas, retornamos o JSON diretamente
    return response.json();
}

// =======================================================================
// 2. FUNÇÕES DA API REATORADAS (MUITO MAIS LIMPAS)
// =======================================================================

// --- AUTENTICAÇÃO ---
// A função de login não precisa de token, então ela continua separada
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

// --- CASOS ---
export const createCase = (casoData: any) => fetchWithAuth('/api/casos', { method: 'POST', body: JSON.stringify(casoData) });
export const updateCase = (id: number | string, casoData: any) => fetchWithAuth(`/api/casos/${id}`, { method: 'PUT', body: JSON.stringify(casoData) });
export const updateCasoStatus = (casoId: string | number, status: string) => fetchWithAuth(`/api/casos/${casoId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteCaso = (casoId: string | number) => fetchWithAuth(`/api/casos/${casoId}`, { method: 'DELETE' });
export const getCasoById = (id: string) => fetchWithAuth(`/api/casos/${id}`);
export const getCasosFiltrados = (filters?: FiltrosCasos) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.filtro) params.append('filtro', filters.filtro);
        if (filters.valor) params.append('valor', filters.valor);
        if (filters.tecRef) params.append('tecRef', filters.tecRef);
    }
    return fetchWithAuth(`/api/casos?${params.toString()}`);
};

// --- ACOMPANHAMENTOS ---
export const getAcompanhamentos = (casoId: string) => fetchWithAuth(`/api/acompanhamentos/${casoId}`);
export const createAcompanhamento = (casoId: string, texto: string) => fetchWithAuth(`/api/acompanhamentos/${casoId}`, { method: 'POST', body: JSON.stringify({ texto }) });

// --- ENCAMINHAMENTOS ---
export const getEncaminhamentos = (casoId: string) => fetchWithAuth(`/api/casos/${casoId}/encaminhamentos`);
export const createEncaminhamento = (data: object) => fetchWithAuth('/api/encaminhamentos', { method: 'POST', body: JSON.stringify(data) });
export const updateEncaminhamento = (id: number, data: object) => fetchWithAuth(`/api/encaminhamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// --- ANEXOS ---
export const getAnexos = (casoId: string) => fetchWithAuth(`/api/anexos/casos/${casoId}`);
export const uploadAnexo = (casoId: string, formData: FormData) => fetchWithAuth(`/api/anexos/upload/${casoId}`, { method: 'POST', body: formData });
export async function downloadAnexo(anexoId: number): Promise<{ blob: Blob, filename: string }> {
    const response = await fetchWithAuth(`/api/anexos/download/${anexoId}`) as Response;
    const disposition = response.headers.get('content-disposition');
    let filename = 'arquivo_anexo';
    if (disposition?.includes('attachment')) {
        const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (filenameMatch?.[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
        }
    }
    const blob = await response.blob();
    return { blob, filename };
}

// --- USUÁRIOS ---
export const getUsers = () => fetchWithAuth('/api/users');
export const createUser = (data: object) => fetchWithAuth('/api/users', { method: 'POST', body: JSON.stringify(data) });

// --- RELATÓRIOS ---
export async function generateReport(filters: { startDate: string, endDate: string }): Promise<Blob> {
    const response = await fetchWithAuth('/api/relatorios/geral', { method: 'POST', body: JSON.stringify(filters) }) as Response;
    return response.blob();
}

// --- DASHBOARD ---
export const getDashboardFilterOptions = (): Promise<{ meses: string[] }> => fetchWithAuth('/api/dashboard/filter-options');
export const getDashboardData = (filters?: { mes?: string }): Promise<DashboardData> => {
    const url = new URL(`${API_BASE_URL}/api/dashboard`);
    if (filters?.mes) {
        url.searchParams.append('mes', filters.mes);
    }
    // Usamos o endpoint completo aqui porque URLSearchParams já foi usado
    return fetchWithAuth(url.pathname + url.search);
};

// --- PAINEL DE VIGILÂNCIA ---
export const getVigilanciaFluxoDemanda = () => fetchWithAuth('/api/vigilancia/fluxo-demanda');
export const getVigilanciaSobrecargaEquipe = () => fetchWithAuth('/api/vigilancia/sobrecarga-equipe');
export const getVigilanciaIncidenciaBairros = () => fetchWithAuth('/api/vigilancia/incidencia-bairros');
export const getVigilanciaFontesAcionamento = () => fetchWithAuth('/api/vigilancia/fontes-acionamento');
export const getVigilanciaTaxaReincidencia = () => fetchWithAuth('/api/vigilancia/taxa-reincidencia');
export const getVigilanciaPerfilViolacoes = () => fetchWithAuth('/api/vigilancia/perfil-violacoes');