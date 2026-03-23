// ============================================================
// db.js — Camada de Dados e Utilitários
// Gestão Sorveteria & Açaí Pro
// ============================================================

const DB_KEY = 'gestao_sorveteria_v1';

const defaultDB = {
    // Campos NOVOS a suportar no schema (adicionar ao merge/validação):
    // tipo: 'padrao' | 'massa' | 'acai'   (default: 'padrao')
    // pricePerHundredGrams: number         (só para tipo='massa')
    // sizes: [{label, price}]              (só para tipo='acai')
    products: [],
    sales: [],
    clients: [],
    suppliers: [],
    inventory: [],
    production: [],
    temperatures: [],
    freezers: [
        { id: 'freezer1', name: 'Freezer Principal', idealTemp: -18, currentTemp: -18, status: 'normal' },
        { id: 'freezer2', name: 'Freezer de Açaí', idealTemp: -15, currentTemp: -15, status: 'normal' },
        { id: 'freezer3', name: 'Câmara Fria', idealTemp: -20, currentTemp: -20, status: 'normal' }
    ],
    settings: {
        companyName: 'Sorveteria Delícia',
        cnpj: '',
        phone: '',
        address: '',
        stockAlerts: true,
        defaultMinStock: 10,
        dailyProductionGoal: 50,
        temperatureAlerts: true,
        criticalTemp: -12,
        termsAccepted: false,
        termsAcceptedAt: null
    },
    tutorial: {
        completedSteps: [],
        checklistState: {}
    },
    // Produtos padrão para sorveteria
    defaultProducts: [
        // Sorvetes
        { id: 'SOR001', code: 'SOR001', name: 'Sorvete de Chocolate', category: 'sorvete', flavor: 'Chocolate', cost: 8.50, price: 12.00, stock: 50, minStock: 10, unit: 'litro', temperature: '-18°C', ingredients: 'Leite, chocolate, açúcar, estabilizante', description: 'Sorvete cremoso de chocolate belga' },
        { id: 'SOR002', code: 'SOR002', name: 'Sorvete de Morango', category: 'sorvete', flavor: 'Morango', cost: 7.80, price: 11.00, stock: 45, minStock: 10, unit: 'litro', temperature: '-18°C', ingredients: 'Leite, morango, açúcar, estabilizante', description: 'Sorvete natural de morango' },
        { id: 'SOR003', code: 'OR003', name: 'Sorvete de Baunilha', category: 'sorvete', flavor: 'Baunilha', cost: 7.00, price: 10.00, stock: 60, minStock: 10, unit: 'litro', temperature: '-18°C', ingredients: 'Leite, baunilha, açúcar, estabilizante', description: 'Sorvete clássico de baunilha' },
        { id: 'SOR004', code: 'SOR004', name: 'Sorvete de Menta', category: 'sorvete', flavor: 'Menta', cost: 8.00, price: 11.50, stock: 40, minStock: 10, unit: 'litro', temperature: '-18°C', ingredients: 'Leite, menta, chocolate, açúcar', description: 'Sorvete refrescante de menta' },
        { id: 'ACA001', code: 'ACA001', name: 'Açaí Tradicional', category: 'acai', flavor: 'Açaí', cost: 6.50, price: 10.00, stock: 30, minStock: 5, unit: 'litro', temperature: '-15°C', ingredients: 'Açaí puro, xarope de guaraná', description: 'Açaí 100% natural' },
        { id: 'ACA002', code: 'ACA002', name: 'Açaí com Banana', category: 'acai', flavor: 'Açaí', cost: 7.50, price: 12.00, stock: 25, minStock: 5, unit: 'litro', temperature: '-15°C', ingredients: 'Açaí, banana, xarope de guaraná', description: 'Açaí com banana' },
        { id: 'CAS001', code: 'CAS001', name: 'Casquinha Tradicional', category: 'casquinha', flavor: 'Baunilha', cost: 0.50, price: 1.00, stock: 200, minStock: 50, unit: 'unidade', temperature: 'Ambiente', ingredients: 'Farinha, açúcar, óleo', description: 'Casquinha crocante' },
        { id: 'CAS002', code: 'CAS002', name: 'Casquinha Chocolate', category: 'casquinha', flavor: 'Chocolate', cost: 0.60, price: 1.20, stock: 150, minStock: 50, unit: 'unidade', temperature: 'Ambiente', ingredients: 'Farinha, chocolate, açúcar', description: 'Casquinha de chocolate' },
        { id: 'COB001', code: 'COB001', name: 'Calda de Chocolate', category: 'cobertura', flavor: 'Chocolate', cost: 2.00, price: 3.00, stock: 10, minStock: 3, unit: 'litro', temperature: 'Ambiente', ingredients: 'Chocolate, leite, açúcar', description: 'Calda de chocolate' },
        { id: 'COB002', code: 'COB002', name: 'Calda de Morango', category: 'cobertura', flavor: 'Morango', cost: 1.80, price: 2.80, stock: 8, minStock: 3, unit: 'litro', temperature: 'Ambiente', ingredients: 'Morango, açúcar', description: 'Calda de morango' },
        { id: 'COM001', code: 'COM001', name: 'Granola', category: 'complemento', flavor: 'Natural', cost: 4.00, price: 6.00, stock: 5, minStock: 2, unit: 'kg', temperature: 'Ambiente', ingredients: 'Aveia, mel, castanhas', description: 'Granola crocante' },
        { id: 'COM002', code: 'COM002', name: 'Leite Condensado', category: 'complemento', flavor: 'Doce', cost: 3.50, price: 5.00, stock: 12, minStock: 5, unit: 'litro', temperature: 'Geladeira', ingredients: 'Leite, açúcar', description: 'Leite condensado' }
    ],
    adicionais: [
        { id: 'ad1', name: 'Leite Ninho',  price: 2.00 },
        { id: 'ad2', name: 'Paçoca',        price: 1.50 },
        { id: 'ad3', name: 'Granola',       price: 1.00 },
        { id: 'ad4', name: 'Banana',        price: 0.00 },
        { id: 'ad5', name: 'Morango',       price: 0.00 },
        { id: 'ad6', name: 'Mel',           price: 1.50 },
        { id: 'ad7', name: 'Bis',           price: 2.00 },
        { id: 'ad8', name: 'Ovomaltine',    price: 2.00 },
        { id: 'ad9', name: 'Amendoim',      price: 1.00 },
        { id: 'ad10', name: 'Tapioca',      price: 1.50 }
    ]
};

let db = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB;

// Schema fill — garante novos campos em bancos antigos
db = Object.assign({}, defaultDB, db);
if (!db.adicionais || db.adicionais.length === 0) {
    db.adicionais = [...defaultDB.adicionais];
}

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (typeof updateDataStatus === 'function') updateDataStatus();
}

// --- UTILITÁRIOS ---

const fmtMoney = (v) => {
    return v.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const fmtDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR');
};

const fmtDateTime = (d) => {
    const date = new Date(d);
    return date.toLocaleString('pt-BR');
};

const getID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
            'bg-teal-600 text-white'
        }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" 
               class="w-5 h-5 mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}

function updateDataStatus() {
    console.log(`Sorveteria: ${db.products.length} produtos, ${db.sales.length} vendas, ${db.production.length} produções`);
}
