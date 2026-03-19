
// ==========================================
// CAMADA CORE: BANCO DE DADOS E ESTADO GLOBAL
// ==========================================

const DB_KEY = 'gestao_checklist_v1';

const defaultDB = {
    checklists: [],
    templates: [
        {
            id: 't1',
            name: 'Viagem Internacional',
            category: 'travel',
            description: 'Checklist completo para viagens internacionais',
            tasks: [
                'Passaporte e visto',
                'Passagens aéreas',
                'Reserva de hotel',
                'Seguro viagem',
                'Dinheiro local e cartões',
                'Carregadores e adaptadores',
                'Medicamentos pessoais',
                'Roupas adequadas ao clima'
            ]
        },
        {
            id: 't2',
            name: 'Manutenção de Casa',
            category: 'home',
            description: 'Tarefas mensais de manutenção residencial',
            tasks: [
                'Verificar vazamentos',
                'Limpar calhas',
                'Testar alarme de fumaça',
                'Trocar filtros do ar condicionado',
                'Verificar extintor de incêndio',
                'Limpar ventiladores'
            ]
        },
        {
            id: 't3',
            name: 'Preparação para Reunião',
            category: 'work',
            description: 'Checklist para reuniões importantes',
            tasks: [
                'Confirmar data e horário',
                'Preparar apresentação',
                'Revisar pauta',
                'Convidar participantes',
                'Testar equipamentos',
                'Imprimir materiais'
            ]
        }
    ],
    categories: [
        { id: 'c1', name: 'Trabalho', color: 'blue', icon: 'briefcase' },
        { id: 'c2', name: 'Pessoal', color: 'green', icon: 'user' },
        { id: 'c3', name: 'Saúde', color: 'red', icon: 'heart' },
        { id: 'c4', name: 'Casa', color: 'yellow', icon: 'home' },
        { id: 'c5', name: 'Viagem', color: 'purple', icon: 'plane' },
        { id: 'c6', name: 'Finanças', color: 'emerald', icon: 'dollar-sign' }
    ],
    settings: {
        darkMode: false,
        notifications: true,
        defaultReminder: '1d',
        termsAccepted: false,
        termsAcceptedAt: null
    }
};

let db = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB;

// Funções de Persistência
const save = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    updateDashboardStats();
};

// Funções Utilitárias Globais
const getID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const fmtDate = (d) => {
    if (!d) return '--/--/--';
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR');
};

const sanitizeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
