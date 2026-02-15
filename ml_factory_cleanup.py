# ============================================================================
# ML FACTORY — Automação de Limpeza White-Label v1.0
# ============================================================================
# Executa a adequação completa de TODAS as pastas gestao-* ao padrão
# Mercado Livre Factory, seguindo as 3 Leis do Manifesto Operacional.
#
# USO:
#   python ml_factory_cleanup.py             (modo DRY-RUN — apenas mostra o que faria)
#   python ml_factory_cleanup.py --execute   (modo EXECUÇÃO — aplica todas as mudanças)
#
# ============================================================================

import os
import re
import sys
import json
import shutil
from datetime import datetime

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# Pastas que JÁ foram adaptadas manualmente — NÃO processar
SKIP_FOLDERS = {
    'gestao-barbearia',   # Já adaptada
    'gestao-beleza',      # Já adaptada
    'gestao-checklist',   # Recém-adaptada
}

# Pasta do admin — NÃO é produto, pular
ADMIN_FOLDERS = {'admin'}

# ============================================================================
# TEMPLATES — Arquivos padrão ML Factory
# ============================================================================

LOCK_JS_TEMPLATE = '''/**
 * Lock.js - Guardião de Segurança ({product_name})
 * Padrão ML Factory - V11.5
 */
(function () {{
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';

    function isLicensed() {{
        return localStorage.getItem(LICENSE_KEY) && localStorage.getItem(EMAIL_KEY);
    }}

    window.__checkLicense = isLicensed;

    document.addEventListener('DOMContentLoaded', function () {{
        if (!isLicensed()) {{
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            const loginView = document.getElementById('view-login');
            if (loginView) {{
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
            }}
        }}
    }});
}})();
'''

MANIFEST_TEMPLATE = '''{
    "name": "%PRODUCT_NAME%",
    "short_name": "%PRODUCT_NAME%",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#059669",
    "icons": [
        {
            "src": "./assets/img/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "./assets/img/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
'''

SW_JS_TEMPLATE = '''const CACHE_NAME = '%CACHE_NAME%-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './lock.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
'''

LOGIN_SECTION_TEMPLATE = '''
    <!-- TELA DE ATIVAÇÃO (Airlock) -->
    <section id="view-login" class="hide fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl mb-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
                </div>
                <h1 class="text-3xl font-black text-white tracking-tight">%PRODUCT_DISPLAY%</h1>
                <p class="text-slate-400 text-sm mt-2">Sistema Premium</p>
            </div>
            <form id="activation-form" onsubmit="activateLicense(event)" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
                <h3 class="text-lg font-bold text-white text-center mb-2">Ativação de Licença</h3>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chave de Licença</label>
                    <input type="text" id="license-key" required placeholder="XXXX-XXXX-XXXX-XXXX"
                        class="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-center tracking-widest font-mono text-lg uppercase">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail do Comprador</label>
                    <input type="email" id="license-email" required placeholder="seu@email.com"
                        class="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all">
                </div>
                <button type="submit" id="btn-activate"
                    class="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/30 transition-all transform hover:scale-[1.02] active:scale-95">
                    Ativar Sistema
                </button>
                <p id="activation-error" class="text-red-400 text-sm text-center hidden"></p>
            </form>
            <p class="text-center text-slate-500 text-xs mt-6">Licença Vitalícia • Uso Offline</p>
        </div>
    </section>
'''

ACTIVATE_FUNCTION = '''
        // Ativação de Licença (Airlock)
        function activateLicense(e) {
            e.preventDefault();
            const key = document.getElementById('license-key').value.trim();
            const email = document.getElementById('license-email').value.trim();
            const btn = document.getElementById('btn-activate');
            const errEl = document.getElementById('activation-error');
            
            if (!key || !email) { errEl.textContent = 'Preencha todos os campos.'; errEl.classList.remove('hidden'); return; }
            
            btn.disabled = true; btn.textContent = 'Ativando...'; errEl.classList.add('hidden');
            
            fetch('../api_licenca_ml.php?action=activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key, email: email, device_id: navigator.userAgent })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('plena_license', key);
                    localStorage.setItem('ml_license_email', email);
                    unlockApp();
                } else {
                    errEl.textContent = data.message || 'Chave inválida ou já utilizada.';
                    errEl.classList.remove('hidden');
                }
            })
            .catch(() => {
                if (key.length >= 8) {
                    localStorage.setItem('plena_license', key);
                    localStorage.setItem('ml_license_email', email);
                    unlockApp();
                } else {
                    errEl.textContent = 'Erro de conexão. Verifique sua internet.';
                    errEl.classList.remove('hidden');
                }
            })
            .finally(() => { btn.disabled = false; btn.textContent = 'Ativar Sistema'; });
        }
        
        function unlockApp() {
            const loginView = document.getElementById('view-login');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            if (loginView) loginView.style.display = 'none';
            if (sidebar) sidebar.style.display = '';
            if (mainContent) mainContent.style.display = '';
            if (typeof init === 'function') init();
        }
'''


# ============================================================================
# FUNÇÕES UTILITÁRIAS
# ============================================================================

def read_file_safe(filepath):
    """Lê arquivo com detecção automática de encoding."""
    for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read(), enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    # Fallback: ler como bytes e decodificar ignorando erros
    with open(filepath, 'rb') as f:
        return f.read().decode('utf-8', errors='replace'), 'utf-8-fallback'


def folder_to_product_name(folder_name):
    """Converte nome da pasta em nome do produto.
    gestao-alugueis → Gestão Aluguéis
    """
    # Remove prefixo 'gestao-'
    suffix = folder_name.replace('gestao-', '')
    # Capitaliza
    suffix_cap = suffix.capitalize()
    return f"Gestão {suffix_cap}"


def folder_to_db_key(folder_name):
    """Converte nome da pasta em chave DB.
    gestao-alugueis → gestao_alugueis_v1
    """
    return folder_name.replace('-', '_') + '_v1'


def folder_to_cache_name(folder_name):
    """Converte nome da pasta em nome de cache SW.
    gestao-alugueis → gestao-alugueis
    """
    return folder_name


def folder_to_sidebar_title(folder_name):
    """Converte nome da pasta em título da sidebar (UPPERCASE).
    gestao-alugueis → GESTÃO ALUGUÉIS
    """
    return folder_to_product_name(folder_name).upper()


# ============================================================================
# MOTOR DE LIMPEZA WHITE-LABEL
# ============================================================================

def clean_index_html(text, folder_name):
    """Aplica todas as regras de limpeza White-Label no conteúdo HTML."""
    
    product_name = folder_to_product_name(folder_name)
    db_key = folder_to_db_key(folder_name)
    sidebar_title = folder_to_sidebar_title(folder_name)
    changes = []
    
    # ------------------------------------------------------------------
    # 1. TÍTULO DA PÁGINA
    # ------------------------------------------------------------------
    old_title = re.search(r'<title>(.*?)</title>', text)
    if old_title and ('Plena' in old_title.group(1) or 'plena' in old_title.group(1)):
        text = re.sub(r'<title>.*?</title>', f'<title>{product_name} | Sistema Premium</title>', text)
        changes.append(f'Title: "{old_title.group(1)}" → "{product_name} | Sistema Premium"')
    
    # ------------------------------------------------------------------
    # 2. META DESCRIPTION
    # ------------------------------------------------------------------
    text, n = re.subn(
        r'(<meta\s+name="description"\s+content=")[^"]*[Pp]lena[^"]*(")',
        rf'\1Software Premium - {product_name}\2',
        text
    )
    if n: changes.append(f'Meta description limpa ({n}x)')
    
    # ------------------------------------------------------------------
    # 3. INJETAR lock.js NO <head> (se não existir)
    # ------------------------------------------------------------------
    if 'lock.js' not in text:
        text = text.replace('<head>', '<head>\n    <script src="lock.js"></script>', 1)
        changes.append('lock.js injetado no <head>')
    
    # ------------------------------------------------------------------
    # 4. CORES TAILWIND: plena-* → brand-*
    # ------------------------------------------------------------------
    color_mappings = [
        ('plena-green', 'brand-green'),
        ('plena-dark', 'brand-dark'),
        ('plena-black', 'brand-black'),
        ('plena-orange', 'brand-orange'),
        ('plena-lightgreen', 'brand-lightgreen'),
        ('plena-gray', 'brand-gray'),
        ('plena-light', 'brand-light'),
        ('plena-soft', 'brand-soft'),
    ]
    for old, new in color_mappings:
        count = text.count(old)
        if count > 0:
            text = text.replace(old, new)
            changes.append(f'Cor "{old}" → "{new}" ({count}x)')
    
    # ------------------------------------------------------------------
    # 5. TAILWIND CONFIG: token "plena" → "brand"
    # ------------------------------------------------------------------
    # Substitui no bloco de configuração do Tailwind
    text = re.sub(r"(\s+)plena(\s*:\s*\{)", r"\1brand\2", text)
    text = re.sub(r"(\s+)checklist(\s*:\s*\{)", r"\1brand\2", text)  # Alguns usam "checklist" como grupo de cor
    
    # Adicionar DEFAULT ao brand se não existir
    if "'brand'" in text or '"brand"' in text:
        if "DEFAULT:" not in text and "'DEFAULT'" not in text:
            text = re.sub(
                r"(brand\s*:\s*\{)",
                r"\1\n                            DEFAULT: '#059669',",
                text, count=1
            )
    
    # ------------------------------------------------------------------
    # 6. CSS VARS: --plena-* → --brand-*
    # ------------------------------------------------------------------
    text = re.sub(r'--plena-(\w+)', r'--brand-\1', text)
    text = re.sub(r'--checklist-(\w+)', r'--brand-\1', text)
    n_css = text.count('--brand-')
    if n_css: changes.append(f'CSS vars --brand-* ({n_css}x)')
    
    # ------------------------------------------------------------------
    # 7. SIDEBAR HEADER: título do produto
    # ------------------------------------------------------------------
    # Padrão: <h1...>PLENA XXXXX</h1>
    text, n = re.subn(
        r'(<h1[^>]*>)\s*PLENA\s+\w+\s*(</h1>)',
        rf'\1{sidebar_title}\2',
        text, flags=re.IGNORECASE
    )
    if n: changes.append(f'Sidebar header → "{sidebar_title}" ({n}x)')
    
    # Também pegar variantes como "Plena Checklist", "Plena Aluguéis" etc.
    text, n2 = re.subn(
        r'(<h1[^>]*>)\s*Plena\s+\w+\s*(</h1>)',
        rf'\1{sidebar_title}\2',
        text, flags=re.IGNORECASE
    )
    if n2: changes.append(f'Sidebar header v2 → "{sidebar_title}" ({n2}x)')
    
    # ------------------------------------------------------------------
    # 8. DB_KEY DO LOCALSTORAGE
    # ------------------------------------------------------------------
    # Padrão: const DB_KEY = 'plena_xxx_v1';
    old_db = re.search(r"const\s+DB_KEY\s*=\s*['\"]([^'\"]+)['\"]", text)
    if old_db and 'plena' in old_db.group(1):
        text = text.replace(old_db.group(1), db_key)
        changes.append(f'DB_KEY: "{old_db.group(1)}" → "{db_key}"')
    
    # ------------------------------------------------------------------
    # 9. BACKUP FILENAME
    # ------------------------------------------------------------------
    text = re.sub(
        r'plena_\w+_backup\.json',
        f'{folder_name.replace("-", "_")}_backup.json',
        text
    )
    
    # ------------------------------------------------------------------
    # 10. MANUAL LOCALSTORAGE KEY
    # ------------------------------------------------------------------
    text = re.sub(
        r'plena_\w+_manual_completed',
        f'{folder_name.replace("-", "_")}_manual_completed',
        text
    )
    
    # ------------------------------------------------------------------
    # 11. LINKS EXTERNOS — REMOVER
    # ------------------------------------------------------------------
    # Links para plenaaplicativos.com.br 
    text = re.sub(
        r'<a\s+href="https?://[^"]*plenaaplicativos[^"]*"[^>]*>.*?</a>',
        '<span class="text-xs text-gray-500">Licença Vitalícia</span>',
        text, flags=re.DOTALL
    )
    changes_ext = text.count('plenaaplicativos')
    
    # E-mails
    text = text.replace('tecnologia@plenaaplicativos.com.br', 'suporte@gestao.app')
    text = text.replace('mailto:tecnologia@plenaaplicativos.com.br', 'mailto:suporte@gestao.app')
    text = text.replace('https://www.plenaaplicativos.com.br', '#')
    text = text.replace('www.plenaaplicativos.com.br', '')
    text = text.replace('plenaaplicativos.com.br', '')
    
    # ------------------------------------------------------------------
    # 12. CNPJ
    # ------------------------------------------------------------------
    text = re.sub(r'CNPJ:\s*17\.347\.919/0001-59[^<\n]*', '', text)
    text = re.sub(r'17\.347\.919/0001-59', '', text)
    
    # ------------------------------------------------------------------
    # 13. TEXTOS CORPORATIVOS — "Plena Soluções Digitais LTDA"
    # ------------------------------------------------------------------
    text = re.sub(r'Plena Soluç[^\n<]*?es Digitais LTDA', 'Software Premium', text)
    text = re.sub(r'Plena Soluções Digitais LTDA', 'Software Premium', text)
    text = re.sub(r'Plena Soluç[^\n<]*?es Digitais', 'Software Premium', text)
    text = re.sub(r'Plena Soluções Digitais', 'Software Premium', text)
    
    # ------------------------------------------------------------------
    # 14. "Sobre a Plena" → "Informações Legais"
    # ------------------------------------------------------------------
    text = text.replace('Sobre a Plena', 'Informações Legais')
    
    # ------------------------------------------------------------------
    # 15. REFERÊNCIAS GENÉRICAS RESTANTES
    # ------------------------------------------------------------------
    # "Versão X.X Pro • Plena..."
    text = re.sub(r'(Vers[ãa]o\s+[\d.]+\s+Pro)\s*[•·]\s*Plena[^<\n]*', r'\1', text)
    
    # "Plena — Transparência" ou "Plena • Transparência"
    text = re.sub(r'Plena\s*[—•·]\s*Transpar[êe]ncia\s*Total', 'Software Premium — Transparência Total', text)
    
    # "A Plena não coleta..."
    text = re.sub(r'A Plena n[ãa]o coleta', 'Este software não coleta', text)
    text = re.sub(r'A Plena exime-se', 'O desenvolvedor exime-se', text)
    
    # Qualquer "Plena" restante isolado (excluindo plena_license)
    # text = re.sub(r'(?<!plena_)(?<!_)\bPlena\b(?!_license)', 'Premium', text)
    
    # ------------------------------------------------------------------
    # 16. INJETAR SEÇÃO DE LOGIN (se não existir)
    # ------------------------------------------------------------------
    if 'view-login' not in text:
        product_display = product_name.replace('Gestão ', 'Gestão <span class="text-emerald-400">')  + '</span>'
        login_html = LOGIN_SECTION_TEMPLATE.replace('%PRODUCT_DISPLAY%', product_display)
        
        body_match = re.search(r'<body[^>]*>', text)
        if body_match:
            insert_pos = body_match.end()
            text = text[:insert_pos] + '\n' + login_html + text[insert_pos:]
            changes.append('Seção view-login injetada')
    
    # ------------------------------------------------------------------
    # 17. INJETAR FUNÇÃO activateLicense (se não existir)
    # ------------------------------------------------------------------
    if 'activateLicense' not in text:
        # Encontrar o ponto de inserção antes do init()
        init_patterns = [
            '// Inicializar Aplicativo',
            '// Inicializar',
            "document.addEventListener('DOMContentLoaded', init)",
            'document.addEventListener("DOMContentLoaded", init)',
        ]
        inserted = False
        for pattern in init_patterns:
            if pattern in text:
                text = text.replace(pattern, ACTIVATE_FUNCTION + '\n        ' + pattern, 1)
                changes.append('Função activateLicense injetada')
                inserted = True
                break
        
        if not inserted:
            # Tentar injetar antes do </script> final
            last_script = text.rfind('</script>')
            if last_script > 0:
                text = text[:last_script] + ACTIVATE_FUNCTION + '\n    ' + text[last_script:]
                changes.append('Função activateLicense injetada (antes de </script>)')
    
    # ------------------------------------------------------------------
    # 18. CAMINHOS ../../assets → ./assets (Lei do Isolamento)
    # ------------------------------------------------------------------
    text = text.replace('../../assets/', './assets/')
    
    return text, changes


# ============================================================================
# PROCESSAMENTO PRINCIPAL
# ============================================================================

def process_folder(folder_path, folder_name, dry_run=True):
    """Processa uma pasta gestao-* completa."""
    
    product_name = folder_to_product_name(folder_name)
    cache_name = folder_to_cache_name(folder_name)
    
    results = {
        'folder': folder_name,
        'product': product_name,
        'files_processed': [],
        'files_created': [],
        'changes': [],
        'errors': [],
        'skipped': False,
    }
    
    # Verificar se existe index.html
    index_path = os.path.join(folder_path, 'index.html')
    if not os.path.exists(index_path):
        results['skipped'] = True
        results['errors'].append('Sem index.html — pasta vazia (aguardando matriz)')
        return results
    
    # ------------------------------------------------------------------
    # 1. PROCESSAR index.html
    # ------------------------------------------------------------------
    try:
        text, encoding = read_file_safe(index_path)
        cleaned_text, changes = clean_index_html(text, folder_name)
        results['changes'].extend(changes)
        
        if not dry_run:
            # Backup
            backup_path = index_path + f'.bak.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            shutil.copy2(index_path, backup_path)
            
            # Salvar
            with open(index_path, 'w', encoding='utf-8', newline='\r\n') as f:
                f.write(cleaned_text)
            
            results['files_processed'].append('index.html')
    except Exception as e:
        results['errors'].append(f'Erro no index.html: {str(e)}')
    
    # ------------------------------------------------------------------
    # 2. CRIAR lock.js (se não existir)
    # ------------------------------------------------------------------
    lock_path = os.path.join(folder_path, 'lock.js')
    if not os.path.exists(lock_path):
        if not dry_run:
            with open(lock_path, 'w', encoding='utf-8', newline='\r\n') as f:
                f.write(LOCK_JS_TEMPLATE.format(product_name=product_name))
        results['files_created'].append('lock.js')
    
    # ------------------------------------------------------------------
    # 3. ATUALIZAR manifest.json
    # ------------------------------------------------------------------
    manifest_path = os.path.join(folder_path, 'manifest.json')
    if os.path.exists(manifest_path):
        try:
            manifest_text, _ = read_file_safe(manifest_path)
            needs_update = ('Plena' in manifest_text or 'plena' in manifest_text or 
                          '../../assets' in manifest_text or '#0d6efd' in manifest_text)
            
            if needs_update:
                new_manifest = MANIFEST_TEMPLATE.replace('%PRODUCT_NAME%', product_name)
                if not dry_run:
                    with open(manifest_path, 'w', encoding='utf-8', newline='\r\n') as f:
                        f.write(new_manifest)
                results['files_processed'].append('manifest.json')
                results['changes'].append('manifest.json atualizado')
        except Exception as e:
            results['errors'].append(f'Erro no manifest.json: {str(e)}')
    else:
        # Criar manifest.json
        new_manifest = MANIFEST_TEMPLATE.replace('%PRODUCT_NAME%', product_name)
        if not dry_run:
            with open(manifest_path, 'w', encoding='utf-8', newline='\r\n') as f:
                f.write(new_manifest)
        results['files_created'].append('manifest.json')
    
    # ------------------------------------------------------------------
    # 4. ATUALIZAR sw.js
    # ------------------------------------------------------------------
    sw_path = os.path.join(folder_path, 'sw.js')
    if os.path.exists(sw_path):
        try:
            sw_text, _ = read_file_safe(sw_path)
            needs_update = ('plena' in sw_text or '../../assets' in sw_text)
            
            if needs_update:
                new_sw = SW_JS_TEMPLATE.replace('%CACHE_NAME%', cache_name)
                if not dry_run:
                    with open(sw_path, 'w', encoding='utf-8', newline='\r\n') as f:
                        f.write(new_sw)
                results['files_processed'].append('sw.js')
                results['changes'].append('sw.js atualizado')
        except Exception as e:
            results['errors'].append(f'Erro no sw.js: {str(e)}')
    else:
        # Criar sw.js
        new_sw = SW_JS_TEMPLATE.replace('%CACHE_NAME%', cache_name)
        if not dry_run:
            with open(sw_path, 'w', encoding='utf-8', newline='\r\n') as f:
                f.write(new_sw)
        results['files_created'].append('sw.js')
    
    # ------------------------------------------------------------------
    # 5. VERIFICAÇÃO FINAL (pós-limpeza)
    # ------------------------------------------------------------------
    if not dry_run:
        try:
            final_text, _ = read_file_safe(index_path)
            plena_lines = [
                (i+1, l.rstrip()) 
                for i, l in enumerate(final_text.split('\n'))
                if ('Plena' in l or 'plenaaplicativos' in l) and 'plena_license' not in l
            ]
            if plena_lines:
                results['errors'].append(f'AVISO: {len(plena_lines)} linhas ainda contêm "Plena":')
                for n, l in plena_lines[:5]:
                    results['errors'].append(f'  L{n}: {l[:80]}')
        except Exception as e:
            results['errors'].append(f'Erro na verificação: {str(e)}')
    
    return results


def main():
    dry_run = '--execute' not in sys.argv
    
    print("=" * 70)
    print("  ML FACTORY — Automação de Limpeza White-Label v1.0")
    print("=" * 70)
    
    if dry_run:
        print("\n  ⚠️  MODO DRY-RUN — Nenhuma alteração será feita!")
        print("  Para executar de fato, rode: python ml_factory_cleanup.py --execute\n")
    else:
        print("\n  🔧 MODO EXECUÇÃO — Alterações serão aplicadas!")
        print("  Backups serão criados automaticamente (.bak)\n")
    
    # Descobrir pastas gestao-*
    folders = sorted([
        d for d in os.listdir(ROOT_DIR)
        if d.startswith('gestao-') 
        and os.path.isdir(os.path.join(ROOT_DIR, d))
        and d not in SKIP_FOLDERS
        and d not in ADMIN_FOLDERS
    ])
    
    print(f"  📂 Pastas encontradas: {len(folders)}")
    print(f"  ⏭️  Pastas excluídas (já adaptadas): {SKIP_FOLDERS}\n")
    print("-" * 70)
    
    all_results = []
    total_changes = 0
    total_errors = 0
    total_skipped = 0
    
    for folder_name in folders:
        folder_path = os.path.join(ROOT_DIR, folder_name)
        print(f"\n  📁 {folder_name}")
        
        results = process_folder(folder_path, folder_name, dry_run)
        all_results.append(results)
        
        if results['skipped']:
            print(f"     ⏭️  PULADA — {results['errors'][0]}")
            total_skipped += 1
            continue
        
        if results['changes']:
            for c in results['changes']:
                print(f"     ✏️  {c}")
            total_changes += len(results['changes'])
        
        if results['files_created']:
            for f in results['files_created']:
                print(f"     ➕ CRIADO: {f}")
            total_changes += len(results['files_created'])
        
        if results['files_processed']:
            for f in results['files_processed']:
                print(f"     ✅ PROCESSADO: {f}")
        
        if results['errors']:
            for e in results['errors']:
                print(f"     ❌ {e}")
            total_errors += len(results['errors'])
    
    # Relatório Final
    print("\n" + "=" * 70)
    print("  📊 RELATÓRIO FINAL")
    print("=" * 70)
    print(f"  Total de pastas:       {len(folders)}")
    print(f"  Processadas:           {len(folders) - total_skipped}")
    print(f"  Puladas (vazias):      {total_skipped}")
    print(f"  Alterações aplicadas:  {total_changes}")
    print(f"  Erros/Avisos:          {total_errors}")
    print(f"  Excluídas (manual):    {len(SKIP_FOLDERS)}")
    
    if dry_run:
        print("\n  ⚠️  Nenhum arquivo foi alterado (DRY-RUN).")
        print("  Execute com --execute para aplicar as mudanças.")
    else:
        print(f"\n  ✅ Todas as alterações foram aplicadas!")
        print(f"  Backups criados com extensão .bak.YYYYMMDD_HHMMSS")
    
    print("=" * 70)
    
    return 0 if total_errors == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
