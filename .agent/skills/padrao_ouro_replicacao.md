# 🏆 Padrão Ouro — Referência de Replicação V1.0
> Extraído do **Gestão Barbearia** (Sistema Validado)
> Uso: Copiar a base e aplicar em qualquer sistema `gestao-*`

---

## 1. Estrutura de Arquivos Obrigatória

```text
/gestao-[nome]/
├── index.html              # Tudo em um (Airlock + App + Modais)
├── lock.js                 # V11.4 Smart Lock (Segurança)
├── manifest.json           # PWA Config
├── sw.js                   # Service Worker (Cache Offline)
├── access_denied.html      # Página de licença bloqueada
├── reset.html              # Reset de emergência
├── assets/
│   ├── libs/
│   │   ├── tailwindcss.js  # Tailwind CSS (CDN local)
│   │   └── lucide.js       # Lucide Icons (CDN local)
│   └── icon-512.png        # Ícone PWA
├── css/
│   └── styles.css          # Design System Premium
└── js/
    ├── app_core.js          # Lógica CRUD + Render + Modais
    └── tailwind_config.js   # Tailwind Extend (cores brand)
```

---

## 2. Design System Premium (CSS)

### 2.1 Variáveis CSS (`:root` + `.dark`)
```css
:root {
    --brand-blue: #2563EB;
    --brand-dark: #0F172A;
    --brand-black: #020617;
    --glass-border: rgba(255, 255, 255, 0.5);
    --glass-bg: rgba(255, 255, 255, 0.7);
    --body-bg: #F8FAFC;
    --text-main: #1e293b;
    --card-bg: #FFFFFF;
}
.dark {
    --body-bg: #0B0F19;
    --text-main: #F8FAFC;
    --card-bg: #151B2C;
    --glass-bg: rgba(21, 27, 44, 0.8);
    --glass-border: rgba(255, 255, 255, 0.05);
}
```

### 2.2 Classes Utilitárias Premium
| Classe | Efeito |
|---|---|
| `glass` | Glassmorphism claro (blur 12px, borda branca, sombra suave) |
| `glass-dark` | Glassmorphism escuro (blur 16px, sidebar) |
| `card-hover` | Elevação no hover (translateY -4px, sombra azul) |
| `active-nav` | Item de menu ativo (borda esquerda dourada #D4AF37) |
| `fade-in` | Animação de entrada (opacity + translateY) |
| `hide` | `display: none !important` |
| `modal-backdrop` | Fundo escuro com blur 8px |
| `badge-pending` | Badge amarelo (pendente) |
| `badge-done` | Badge verde (concluído) |
| `badge-canceled` | Badge vermelho (cancelado) |
| `progress-bar` + `progress-fill` | Barra de progresso gradiente azul |

### 2.3 Body & Background
```css
body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: var(--body-bg);
    background-image:
        radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(96, 165, 250, 0.05) 0px, transparent 50%);
    background-attachment: fixed;
}
```

### 2.4 Scrollbar Customizada
- Fina (6px), bordas arredondadas, cores adaptadas para dark mode.

### 2.5 Estilos de Impressão
- Esconde sidebar, modais, botões. Mostra apenas relatórios/financeiro.

---

## 3. Tailwind Config Extend

```javascript
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#2563EB',      // Primária
                    dark: '#0F172A',      // Contraste
                    black: '#020617',     // Absoluto
                    orange: '#F59E0B',    // Acento
                    gray: '#64748B',      // Secundário
                    lightblue: '#60A5FA', // Destaque dark
                    "electric-blue": '#3B82F6',
                    "gold": '#D4AF37'     // Premium
                },
                barber: { // Renomear para o nicho. Ex: fit, beleza, motor
                    light: '#F8FAFC',
                    soft: '#E2E8F0',
                    dark: '#0B0F19',      // Fundo dark
                    card: '#151B2C',      // Card dark
                    border: 'rgba(255, 255, 255, 0.08)'
                }
            },
            fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }
        }
    }
}
```
> **REGRA**: Ao replicar, trocar o namespace `barber` pelo do nicho (ex: `fit`, `beauty`, `motor`, `check`).

---

## 4. Layout & Componentes HTML

### 4.1 Declaração Raiz
```html
<html lang="pt-BR" class="dark">
```
- Sempre inicia em **dark mode** por padrão.

### 4.2 Head — Ordem Obrigatória
```html
<script src="lock.js"></script>           <!-- 1. Segurança -->
<script src="assets/libs/tailwindcss.js"></script>  <!-- 2. Tailwind -->
<script src="js/tailwind_config.js"></script>       <!-- 3. Config -->
<script src="assets/libs/lucide.js"></script>       <!-- 4. Ícones -->
<link rel="stylesheet" href="css/styles.css">       <!-- 5. CSS Custom -->
<link rel="manifest" href="manifest.json">          <!-- 6. PWA -->
<!-- 7. Service Worker Registration inline -->
```

### 4.3 Seção Airlock (Login/Ativação)
```html
<section id="view-login" class="min-h-screen flex items-center justify-center 
    bg-slate-900 bg-[radial-gradient(...)] p-4 z-[100]">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 
        border border-white/10 shadow-2xl text-center">
        <!-- Ícone gradiente -->
        <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 
            rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i data-lucide="key" class="w-10 h-10 text-white"></i>
        </div>
        <!-- Título + Subtítulo -->
        <!-- Input Email + Input Chave -->
        <!-- Botão "Desbloquear Acesso" -->
        <!-- Footer: "Airlock Security • Standalone PRO V7" -->
    </div>
</section>
```

### 4.4 Sidebar (`glass-dark`)
```html
<aside id="sidebar" class="sidebar glass-dark text-white fixed top-0 left-0 z-40 
    w-64 h-screen transition-transform transform -translate-x-full lg:translate-x-0 
    duration-300 flex flex-col shadow-2xl">
    <!-- Cabeçalho: Ícone dourado + Título UPPERCASE -->
    <div class="h-24 flex items-center px-6 bg-gradient-to-br from-slate-900 
        via-slate-800 to-slate-900 border-b border-amber-500/20">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 
            to-amber-600 flex items-center justify-center mr-3">
            <i data-lucide="crown" class="w-5 h-5 text-slate-900"></i>
        </div>
        <div>
            <h1 class="text-lg font-bold tracking-tight uppercase">GESTÃO [NOME]</h1>
            <p class="text-[11px] text-amber-300/70 font-medium">Sistema PRO • Gestão Completa</p>
        </div>
    </div>
    <!-- Navegação dividida em categorias -->
    <nav class="p-4 space-y-2 flex-1 overflow-y-auto">
        <!-- SEÇÃO: "Operacional" / "Gestão" / "Sistema" -->
        <div class="px-4 mb-2 mt-2">
            <span class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Seção</span>
        </div>
        <!-- Botão de nav padrão -->
        <button onclick="router('view-name')" id="nav-view-name"
            class="nav-item w-full flex items-center px-4 py-2.5 rounded-xl 
                hover:bg-white/10 transition-all group mb-1">
            <i data-lucide="icon" class="w-5 h-5 mr-3 text-white/60 group-hover:text-white"></i>
            <span class="font-medium">Nome</span>
        </button>
    </nav>
    <!-- Rodapé: Badge "LICENÇA VITALÍCIA" + versão -->
    <div class="p-4 border-t border-white/10 text-center">
        <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 
            to-amber-600/5 px-3 py-1.5 rounded-full border border-amber-500/20 mb-2">
            <i data-lucide="gem" class="w-3 h-3 text-amber-400"></i>
            <span class="text-[11px] font-bold text-amber-400">LICENÇA VITALÍCIA</span>
        </div>
        <p class="text-[10px] text-slate-500">v7.0 PRO</p>
    </div>
</aside>
```

### 4.5 Header (Sticky Glass)
```html
<header class="glass h-20 flex items-center justify-between px-4 lg:px-8 
    sticky top-0 z-30 shadow-sm border-b border-white/5">
    <!-- Esquerda: Botão hamburger (mobile) + Título da página -->
    <!-- Direita: Botão Instalar App + Ações contextuais (CTA azul) -->
</header>
```

### 4.6 Content Area
```html
<div class="p-4 lg:p-8 flex-1 overflow-y-auto">
    <section id="view-[nome]" class="view-section fade-in">
        <!-- Cabeçalho da view: título + subtítulo + botão ação -->
        <!-- Conteúdo dinâmico -->
    </section>
</div>
```

### 4.7 Padrão de Card (KPI / Stats)
```html
<div class="glass dark:bg-barber-card p-6 rounded-2xl shadow-sm 
    border border-white/40 dark:border-white/5 card-hover">
    <div class="flex items-center justify-between">
        <div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 
                uppercase tracking-wider mb-1">Título</p>
            <h3 class="text-3xl font-bold text-slate-900 dark:text-white">0</h3>
            <p class="text-xs text-slate-500 mt-1">Subtítulo</p>
        </div>
        <div class="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
            <i data-lucide="icon" class="w-6 h-6 text-brand-blue"></i>
        </div>
    </div>
</div>
```

### 4.8 Padrão de Modal
```html
<div id="nomeModal" class="fixed inset-0 modal-backdrop hidden z-50 
    flex items-center justify-center p-4">
    <div class="bg-white dark:bg-barber-card rounded-2xl shadow-2xl 
        w-full max-w-md p-6 border dark:border-white/5">
        <!-- Header: Título + Botão X -->
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">Título</h3>
            <button onclick="closeModal('nomeModal')" 
                class="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <i data-lucide="x"></i>
            </button>
        </div>
        <!-- Form com space-y-4 -->
        <form onsubmit="submitX(event)" class="space-y-4">
            <!-- Inputs padronizados -->
            <button type="submit" class="w-full bg-brand-blue text-white py-3 
                rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-all">
                Salvar
            </button>
        </form>
    </div>
</div>
```

### 4.9 Padrão de Modal Premium (com Header Gradiente)
```html
<div class="bg-gradient-to-r from-brand-blue to-brand-dark p-6 text-white text-center">
    <h3 class="font-bold text-lg">Título</h3>
    <p class="text-blue-100 text-sm mt-1">Subtítulo</p>
</div>
```

### 4.10 Padrão de Input/Label
```html
<label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nome</label>
<input type="text" class="w-full border dark:border-white/10 p-2 rounded-lg text-sm 
    bg-white dark:bg-slate-800 dark:text-white focus:border-brand-blue outline-none">
```

### 4.11 Padrão de Tabela
```html
<div class="bg-white dark:bg-barber-card rounded-2xl shadow-sm border 
    border-slate-100 dark:border-white/5 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-500 
                dark:text-slate-400 text-xs uppercase">
                <tr><th class="px-6 py-3">Coluna</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                <!-- Dynamic rows -->
            </tbody>
        </table>
    </div>
</div>
```

---

## 5. Fluxo de Segurança (Airlock V11.4)

### 5.1 Ordem de Carregamento
1. `lock.js` verifica `plena_license` e `ml_license_email` no `localStorage`
2. Se ausentes → exibe `#view-login` (tela de ativação)
3. Se presentes + online → verifica status via API (`../api_licenca_ml.php?action=verify`)
4. Se `blocked` → limpa localStorage → redireciona `access_denied.html`
5. Se offline → falha silenciosa, sistema continua offline

### 5.2 Fluxo de Ativação (`checkAirlock()`)
```
┌─ Sem licença? → Mostra #view-login
├─ Com licença + sem recibo? → Mostra #welcome-receipt-modal
└─ Com licença + com recibo? → unlockSystem() → #app-main-content
```

### 5.3 Confirmação de Recebimento (`confirmReceipt()`)
- POST `../api_licenca_ml.php?action=confirm_receipt`
- Payload: `{ license_key, legal_agree: true }`
- Salva `ml_receipt_confirmed = true` no localStorage

### 5.4 Senha Mestre (Testes)
```javascript
const MASTER_KEYS = ['MASTER123', 'ADMIN_ML', 'TESTE2026'];
```
- Ativa bypass sem chamar API. Útil para demos/testes.

---

## 6. Arquitetura JavaScript (`app_core.js`)

### 6.1 Estado Global (localStorage)
```javascript
const DB_KEY = 'brand_[nicho]_pro_v2';
const defaultDB = {
    appointments: [],
    team: [{ id: 'adm', name: 'Administrador (Dono)', commission: 0 }],
    services: [ /* serviços pré-cadastrados do nicho */ ],
    clients: [],
    transactions: [],
    settings: {
        businessName: '', businessHours: '09:00 às 19:00',
        theme: 'blue', termsAccepted: false, termsAcceptedAt: null
    },
    tutorial: { completedSteps: [], checklistState: {} },
    inventory: [],
    stockMovements: []
};
```

### 6.2 Funções Utilitárias Padrão
| Função | Descrição |
|---|---|
| `sanitizeHTML(str)` | Escapa HTML (anti-XSS) |
| `save()` | Persiste `db` no localStorage |
| `fmtMoney(v)` | Formata para R$ brasileiro |
| `fmtDate(d)` | Formata data pt-BR |
| `getID()` | Gera ID único (timestamp + random) |

### 6.3 Roteamento SPA (`router(view)`)
1. Esconde todas `.view-section` → adiciona `.hide`
2. Remove `.active-nav` de todos `.nav-item`
3. Mostra `#view-{view}` → remove `.hide`, adiciona `.fade-in`
4. Marca `#nav-{view}` como ativo
5. Atualiza `#page-title`
6. Fecha sidebar no mobile
7. Chama `render[View]()` correspondente

### 6.4 Padrão de Render (Template Literals)
```javascript
function renderView() {
    const container = document.getElementById('list');
    container.innerHTML = db.items.map(item => `
        <div class="card-premium-classes">
            ${sanitizeHTML(item.name)}
        </div>
    `).join('');
    lucide.createIcons(); // SEMPRE no final
}
```

### 6.5 Padrão de Modal (Abrir/Fechar)
```javascript
function openModal() {
    document.getElementById('modal').classList.remove('hidden');
    // Preencher selects, limpar campos, etc.
    lucide.createIcons();
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}
```

### 6.6 Padrão de Submit (CRUD)
```javascript
function submitItem(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const obj = { /* campos do form */ };
    if (id) {
        const idx = db.items.findIndex(i => i.id === id);
        db.items[idx] = { ...db.items[idx], ...obj };
    } else {
        obj.id = getID();
        db.items.push(obj);
    }
    save();
    closeModal('itemModal');
    renderItems();
}
```

### 6.7 Auto-Save
```javascript
setInterval(save, 30000); // A cada 30 segundos
```

---

## 7. Manual Interativo (Tutorial)

### 7.1 Estrutura
- **7 seções** com barra de progresso e scroll suave
- Cada seção: número em badge gradiente + título + botão "Marcar como concluído"
- Progresso salvo em `localStorage('tutorial_progress')`

### 7.2 Seções Padrão (adaptar conteúdo ao nicho)
1. **Instalação** — Instruções PWA (Android + Windows)
2. **Configuração Inicial** — Dados do negócio + primeiro cadastro
3. **Funcionalidade Principal** — Fluxo de trabalho do nicho
4. **Relatórios** — Resumo mensal, performance, controle
5. **Backup e Segurança** — Alerta dados locais + como fazer/restaurar
6. **Dúvidas Frequentes (FAQ)** — Accordion com `<details>`/`<summary>`
7. **Checklist de Rotina** — Tarefas diárias + semanais com progresso

### 7.3 Padrão Visual FAQ
```html
<details class="group bg-gray-50 dark:bg-slate-800/50 border border-gray-200 
    dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
    <summary class="flex items-center justify-between p-4 cursor-pointer 
        hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors select-none">
        <div class="flex items-center gap-3 font-bold text-gray-700 dark:text-white">
            <i data-lucide="help-circle" class="w-5 h-5 text-blue-600"></i>
            Pergunta aqui?
        </div>
        <i data-lucide="chevron-down" 
            class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"></i>
    </summary>
    <div class="p-4 pt-0 border-t border-gray-100 dark:border-white/5">
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-3">Resposta aqui.</p>
    </div>
</details>
```

---

## 8. View "Sobre" / Informações Legais

### 8.1 Componentes Obrigatórios
1. **Header Institucional** — Ícone shield + "Central de Segurança e Legalidade"
2. **Grid de Políticas** — Termos de Uso + LGPD (Privacy by Design / Local-First)
3. **Responsabilidade do Usuário** — Alerta vermelho sobre backup obrigatório
4. **Suporte Premium** — Card escuro com e-mail + SLA 24h úteis
5. **Confirmação de Recebimento** — Botão `confirmReceipt()` com badge de aceite
6. **Rodapé Legal** — Nome empresa + CNPJ + versão

---

## 9. Sistema de Backup/Restore

### 9.1 Componentes Visuais
- **Alerta laranja**: "Seus dados são 100% Locais"
- **Card Backup**: Ícone download-cloud + botão "Baixar Dados"
- **Card Restore**: Ícone refresh-ccw + input file `.json`
- **Zona de Perigo**: "Limpar Todos os Dados" + "Resetar Sistema" (bordas vermelhas)

### 9.2 Lógica
```javascript
function downloadBackup() {
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_gestao_${Date.now()}.json`;
    a.click();
}
function restoreBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (confirm('Restaurar substituirá TODOS os dados atuais. Continuar?')) {
            db = JSON.parse(e.target.result);
            save();
            location.reload();
        }
    };
    reader.readAsText(file);
}
```

---

## 10. PWA (Progressive Web App)

### 10.1 `manifest.json`
```json
{
    "name": "Gestão [Nome]",
    "short_name": "Gestão",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#2563EB",
    "orientation": "portrait",
    "icons": [
        { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" },
        { "src": "assets/icon-512.png", "sizes": "192x192", "type": "image/png" }
    ]
}
```

### 10.2 `sw.js` — Service Worker
- Cache Name: `app-cache-v3`
- Estratégia: Cache-first com fallback para rede
- Caches: `index.html`, CSS, JS, libs, ícones

### 10.3 Botão "Instalar App"
- Escondido por padrão (`hidden`)
- Aparece quando `beforeinstallprompt` é disparado
- Classe: `bg-green-600 text-white rounded-lg font-bold`

---

## 11. Integrações de Compartilhamento

### 11.1 WhatsApp
```javascript
const waURL = `https://wa.me/55${phone.replace(/\D/g, '')}`;
// Compartilhar relatório / fechamento
const shareURL = `https://wa.me/?text=${encodeURIComponent(texto)}`;
```

### 11.2 Print (Impressão)
```javascript
function printClosing() { window.print(); }
```

---

## 12. Checklist de Replicação

Ao aplicar o Padrão Ouro em um novo ou existente sistema `gestao-*`:

- [ ] **Estrutura de pastas** segue seção 1
- [ ] **`lock.js`** presente e no `<head>` antes de tudo
- [ ] **Dark mode** (`class="dark"` no `<html>`)
- [ ] **`styles.css`** contém todas as classes da seção 2
- [ ] **`tailwind_config.js`** com cores `brand` + namespace do nicho
- [ ] **Sidebar** com `glass-dark`, seções categorizadas, badge vitalícia
- [ ] **Header** sticky com `glass`, botão instalar, CTAs
- [ ] **Views** usando `view-section` + `fade-in` + `hide`
- [ ] **Cards** com `card-hover`, bordas `dark:border-white/5`
- [ ] **Tabelas** com `dark:bg-barber-card`, header `dark:bg-slate-800/80`
- [ ] **Modais** com `modal-backdrop`, `dark:bg-barber-card`, botão X
- [ ] **Inputs** com `dark:bg-slate-800 dark:text-white dark:border-white/10`
- [ ] **Manual Interativo** com 7 seções + progresso
- [ ] **View Sobre** com termos, LGPD, confirmação de recebimento
- [ ] **Backup/Restore** com alerta laranja + zona de perigo
- [ ] **PWA** com `manifest.json` + `sw.js` + botão instalação
- [ ] **`lucide.createIcons()`** chamado após cada render
- [ ] **White-Label** sem referências à Plena Soluções
- [ ] **Modal de Recibo** (welcome-receipt-modal) funcional
- [ ] **Senha Mestre** configurada para testes
