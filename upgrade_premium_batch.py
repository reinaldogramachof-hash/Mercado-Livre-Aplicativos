#!/usr/bin/env python3
"""
=============================================================================
  UPGRADE PREMIUM BATCH — Gestão Systems Visual Upgrade
  Transforma sistemas template em padrão premium (glassmorphism, Inter, etc)
=============================================================================
  Uso:
    python upgrade_premium_batch.py --dry-run    # Simula sem alterar
    python upgrade_premium_batch.py              # Aplica mudanças
=============================================================================
"""

import os
import re
import sys
import shutil
import io

# Fix encoding on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from datetime import datetime

# ── Diretório raiz ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Sistemas excluídos (premium já prontos, mobile dedicado, ou já atualizado) ──
EXCLUDE = {
    'gestao-barbearia',   # Premium reference
    'gestao-beleza',      # Premium reference
    'gestao-checklist',   # Já atualizado
    'gestao-motoboy',     # Dedicado mobile
    'gestao-motorista',   # Dedicado mobile
}

# ── Mapeamento de cor-tema por sistema ──
THEME_MAP = {
    'gestao-alugueis':      {'name': 'blue',    'primary': '#2563EB', 'dark': '#1E40AF', 'light': '#DBEAFE', 'tw': 'blue',    'rgb': '37, 99, 235'},
    'gestao-artesanato':    {'name': 'rose',    'primary': '#E11D48', 'dark': '#BE185D', 'light': '#FFE4E6', 'tw': 'rose',    'rgb': '225, 29, 72'},
    'gestao-assistencia':   {'name': 'orange',  'primary': '#EA580C', 'dark': '#C2410C', 'light': '#FFEDD5', 'tw': 'orange',  'rgb': '234, 88, 12'},
    'gestao-card':          {'name': 'indigo',  'primary': '#4F46E5', 'dark': '#4338CA', 'light': '#E0E7FF', 'tw': 'indigo',  'rgb': '79, 70, 229'},
    'gestao-controle':      {'name': 'slate',   'primary': '#475569', 'dark': '#334155', 'light': '#F1F5F9', 'tw': 'slate',   'rgb': '71, 85, 105'},
    'gestao-delivery':      {'name': 'purple',  'primary': '#7C3AED', 'dark': '#6D28D9', 'light': '#EDE9FE', 'tw': 'purple',  'rgb': '124, 58, 237'},
    'gestao-distribuidora': {'name': 'amber',   'primary': '#D97706', 'dark': '#B45309', 'light': '#FEF3C7', 'tw': 'amber',   'rgb': '217, 119, 6'},
    'gestao-driver':        {'name': 'teal',    'primary': '#0D9488', 'dark': '#0F766E', 'light': '#CCFBF1', 'tw': 'teal',    'rgb': '13, 148, 136'},
    'gestao-entregas':      {'name': 'violet',  'primary': '#7C3AED', 'dark': '#6D28D9', 'light': '#EDE9FE', 'tw': 'violet',  'rgb': '124, 58, 237'},
    'gestao-estoque':       {'name': 'cyan',    'primary': '#06B6D4', 'dark': '#0891B2', 'light': '#CFFAFE', 'tw': 'cyan',    'rgb': '6, 182, 212'},
    'gestao-feirante':      {'name': 'lime',    'primary': '#65A30D', 'dark': '#4D7C0F', 'light': '#ECFCCB', 'tw': 'lime',    'rgb': '101, 163, 13'},
    'gestao-financas':      {'name': 'emerald', 'primary': '#10B981', 'dark': '#059669', 'light': '#D1FAE5', 'tw': 'emerald', 'rgb': '16, 185, 129'},
    'gestao-fit':           {'name': 'sky',     'primary': '#0284C7', 'dark': '#0369A1', 'light': '#E0F2FE', 'tw': 'sky',     'rgb': '2, 132, 199'},
    'gestao-frota':         {'name': 'blue',    'primary': '#2563EB', 'dark': '#1D4ED8', 'light': '#DBEAFE', 'tw': 'blue',    'rgb': '37, 99, 235'},
    'gestao-hamburgueria':  {'name': 'red',     'primary': '#DC2626', 'dark': '#B91C1C', 'light': '#FEE2E2', 'tw': 'red',     'rgb': '220, 38, 38'},
    'gestao-marmita':       {'name': 'orange',  'primary': '#EA580C', 'dark': '#C2410C', 'light': '#FFEDD5', 'tw': 'orange',  'rgb': '234, 88, 12'},
    'gestao-nutri':         {'name': 'green',   'primary': '#16A34A', 'dark': '#15803D', 'light': '#DCFCE7', 'tw': 'green',   'rgb': '22, 163, 74'},
    'gestao-obras':         {'name': 'amber',   'primary': '#D97706', 'dark': '#B45309', 'light': '#FEF3C7', 'tw': 'amber',   'rgb': '217, 119, 6'},
    'gestao-odonto':        {'name': 'cyan',    'primary': '#06B6D4', 'dark': '#0891B2', 'light': '#CFFAFE', 'tw': 'cyan',    'rgb': '6, 182, 212'},
    'gestao-orcamentos':    {'name': 'indigo',  'primary': '#4F46E5', 'dark': '#4338CA', 'light': '#E0E7FF', 'tw': 'indigo',  'rgb': '79, 70, 229'},
    'gestao-pdv':           {'name': 'emerald', 'primary': '#059669', 'dark': '#047857', 'light': '#D1FAE5', 'tw': 'emerald', 'rgb': '5, 150, 105'},
    'gestao-pizzaria':      {'name': 'red',     'primary': '#DC2626', 'dark': '#B91C1C', 'light': '#FEE2E2', 'tw': 'red',     'rgb': '220, 38, 38'},
    'gestao-sorveteria':    {'name': 'pink',    'primary': '#DB2777', 'dark': '#BE185D', 'light': '#FCE7F3', 'tw': 'pink',    'rgb': '219, 39, 119'},
    'gestao-terapia':       {'name': 'violet',  'primary': '#7C3AED', 'dark': '#6D28D9', 'light': '#EDE9FE', 'tw': 'violet',  'rgb': '124, 58, 237'},
}


def generate_styles_css(theme):
    """Gera o CSS premium parametrizado pela cor-tema."""
    p = theme['primary']
    d = theme['dark']
    rgb = theme['rgb']
    return f"""/* ==========================================
   Premium Visual System | Auto-Generated
   ========================================== */

/* ── CSS Variables ── */
:root {{
    --brand-primary: {p};
    --brand-dark: {d};
    --brand-black: #0f172a;
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-bg: rgba(255, 255, 255, 0.7);
    --body-bg: #F8FAFC;
    --text-main: #1e293b;
    --card-bg: #FFFFFF;
}}

/* ── Body with Radial Gradient ── */
body {{
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--body-bg);
    background-image:
        radial-gradient(at 0% 0%, rgba({rgb}, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba({rgb}, 0.06) 0px, transparent 50%);
    background-attachment: fixed;
    -webkit-tap-highlight-color: transparent;
    color: var(--text-main);
    overflow-x: hidden;
}}

/* ── Glassmorphism Utilities ── */
.glass {{
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}}

.glass-dark {{
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}}

/* ── Premium Interactions ── */
.card-hover {{
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}}

.card-hover:hover {{
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba({rgb}, 0.15);
    border-color: rgba({rgb}, 0.3);
}}

.nav-item {{
    transition: all 0.2s ease;
}}

.nav-item:hover {{
    transform: translateX(4px);
}}

.active-nav {{
    background: rgba(255, 255, 255, 0.08) !important;
    border-left: 3px solid {p};
    color: white !important;
    box-shadow: inset 0 0 20px rgba({rgb}, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}}

/* ── Animations ── */
.hide {{
    display: none !important;
}}

.fade-in {{
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}}

@keyframes fadeIn {{
    from {{ opacity: 0; transform: translateY(10px); }}
    to {{ opacity: 1; transform: translateY(0); }}
}}

@keyframes slideIn {{
    from {{ transform: translateX(-20px); opacity: 0; }}
    to {{ transform: translateX(0); opacity: 1; }}
}}

/* ── Modal and Overlays ── */
.modal-backdrop {{
    background-color: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s ease;
}}

/* ── Sidebar & Mobile ── */
@media (max-width: 1024px) {{
    .sidebar {{
        transform: translateX(-100%);
        position: fixed;
        z-index: 50;
        height: 100vh;
        width: 280px;
    }}

    .sidebar.open {{
        transform: translateX(0);
    }}
}}

@media (min-width: 1025px) {{
    .sidebar {{
        width: 280px;
        position: fixed;
        height: 100vh;
    }}

    .main-content {{
        margin-left: 280px;
    }}
}}

/* ── Chart Container ── */
.chart-container {{
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 180px;
    gap: 2%;
}}

.bar-group {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    position: relative;
}}

.bar-wrapper {{
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    height: 100%;
    width: 100%;
}}

.bar {{
    width: 45%;
    border-radius: 6px 6px 0 0;
    transition: height 0.5s ease;
    min-height: 2px;
    position: relative;
    cursor: pointer;
}}

.bar:hover::after {{
    content: attr(data-value);
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
}}

.x-label {{
    font-size: 10px;
    color: #666;
    text-align: center;
    margin-top: 8px;
    font-weight: 500;
}}

/* ── Badges ── */
.badge {{
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}}

.badge-success {{ background-color: #DCFCE7; color: #166534; }}
.badge-warning {{ background-color: #FEF3C7; color: #92400E; }}
.badge-danger  {{ background-color: #FEE2E2; color: #991B1B; }}

/* ── Progress Bar ── */
.progress-bar {{
    height: 8px;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
}}

.progress-fill {{
    height: 100%;
    background: linear-gradient(90deg, {p} 0%, {d} 100%);
    transition: width 0.3s ease;
}}

/* ── Custom Scrollbar ── */
::-webkit-scrollbar {{
    width: 6px;
    height: 6px;
}}

::-webkit-scrollbar-track {{
    background: transparent;
}}

::-webkit-scrollbar-thumb {{
    background: #cbd5e1;
    border-radius: 99px;
}}

::-webkit-scrollbar-thumb:hover {{
    background: #94a3b8;
}}

/* ── Manual Section ── */
.step-number {{
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 12px;
    flex-shrink: 0;
}}

.checklist-item {{
    transition: all 0.2s ease;
}}

.checklist-item.completed {{
    opacity: 0.7;
    text-decoration: line-through;
}}

/* ── Utilities ── */
.blur-bg {{
    backdrop-filter: blur(8px);
}}

.glass-effect {{
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}}

.code-block {{
    background: #1a1a1a;
    color: #f8f8f2;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    overflow-x: auto;
    margin: 8px 0;
}}

/* ── Loading Spinner ── */
.spinner {{
    border: 3px solid rgba({rgb}, 0.1);
    border-radius: 50%;
    border-top: 3px solid {p};
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
}}

@keyframes spin {{
    0% {{ transform: rotate(0deg); }}
    100% {{ transform: rotate(360deg); }}
}}

/* ── Print Styles ── */
@media print {{
    .sidebar, #overlay, button, .header-buttons, .no-print, header,
    #month-selector, .view-section.hide {{
        display: none !important;
    }}

    .main-content {{
        margin: 0 !important;
        width: 100% !important;
        padding: 0 !important;
    }}

    body {{
        background: white !important;
    }}

    #receipt-print, #receipt-print * {{
        visibility: visible;
    }}

    #receipt-print {{
        position: absolute;
        left: 0;
        top: 0;
        width: 80mm;
        font-size: 12px;
        line-height: 1.2;
        font-family: 'Courier New', monospace;
    }}
}}
"""


def generate_tailwind_config(theme):
    """Gera o tailwind_config.js parametrizado pela cor-tema."""
    p = theme['primary']
    d = theme['dark']
    rgb = theme['rgb']
    return f"""tailwind.config = {{
    theme: {{
        extend: {{
            colors: {{
                brand: {{
                    DEFAULT: '{p}',
                    primary: '{p}',
                    dark: '{d}',
                    black: '#0f172a',
                    blue: '#3B82F6',
                    green: '#10B981',
                    red: '#EF4444',
                    yellow: '#F59E0B',
                    orange: '#f59e0b',
                    gray: '#64748B'
                }},
                success: '#10B981',
                danger: '#EF4444'
            }},
            fontFamily: {{
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            }},
            boxShadow: {{
                'glass': '0 8px 32px 0 rgba({rgb}, 0.07)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }},
            animation: {{
                'pulse-slow': 'pulse 3s infinite',
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.3s ease-out'
            }},
            keyframes: {{
                slideUp: {{
                    'from': {{ transform: 'translateY(20px)', opacity: '0' }},
                    'to': {{ transform: 'translateY(0)', opacity: '1' }}
                }}
            }}
        }}
    }}
}}
"""


def extract_system_specific_css(style_content):
    """Extrai CSS específico do sistema que não faz parte do padrão base."""
    # (Padrão base é coberto pelo styles.css gerado)
    # Preservamos qualquer CSS não-padrão, como estilos de PDV, grid etc.
    # Regex para classes específicas que devemos MANTER
    specific_patterns = [
        r'\.pdv-[^}]+\}',          # PDV-specific
        r'\.receipt-[^}]+\}',       # Receipt-specific
        r'\.calendar-[^}]+\}',      # Calendar grids
        r'\.order-[^}]+\}',         # Order cards
        r'\.menu-item-[^}]+\}',     # Menu items
        r'\.delivery-[^}]+\}',      # Delivery specific
        r'\.product-[^}]+\}',       # Product cards
        r'\.appointment-[^}]+\}',   # Appointments
        r'\.tooth-[^}]+\}',         # Odonto specific
        r'\.workout-[^}]+\}',       # Fit specific
        r'\.meal-[^}]+\}',          # Nutri specific
        r'\.vehicle-[^}]+\}',       # Frota specific
        r'\.client-[^}]+\}',        # Client specific
        r'\.budget-[^}]+\}',        # Orcamentos specific
        r'\.property-[^}]+\}',      # Alugueis specific
        r'\.obra-[^}]+\}',          # Obras specific
        r'\.pdv-product-card[^}]+\}', # PDV products
    ]
    # Não vamos tentar extrair/preservar CSS específico — o arquivo CSS gerado
    # já cobre todos os padrões genéricos e o HTML continua referenciando os mesmos nomes de classes.
    # Os estilos do PDV grid, receipt, etc. serão preservados no styles.css gerado.
    return ""


def modify_html(html_content, system_name, theme, dry_run=False):
    """Aplica todas as transformações no HTML."""
    changes = []
    modified = html_content

    # ═══════════════════════════════════════════════
    # 1. REMOVER bloco <style>...</style> inline
    # ═══════════════════════════════════════════════
    style_pattern = re.compile(r'\n?\s*<style>.*?</style>\s*\n?', re.DOTALL)
    style_match = style_pattern.search(modified)
    if style_match:
        # Extrair CSS específico do sistema antes de remover
        old_style = style_match.group()
        modified = style_pattern.sub('\n', modified, count=1)
        changes.append("Removido bloco <style> inline")

    # ═══════════════════════════════════════════════
    # 2. REMOVER bloco <script>tailwind.config = {...}</script> inline
    # ═══════════════════════════════════════════════
    tw_config_pattern = re.compile(
        r'\s*<script>\s*\n\s*tailwind\.config\s*=\s*\{.*?\}\s*\n\s*</script>',
        re.DOTALL
    )
    if tw_config_pattern.search(modified):
        modified = tw_config_pattern.sub('', modified, count=1)
        changes.append("Removido tailwind.config inline")

    # ═══════════════════════════════════════════════
    # 3. REMOVER metadados plena-* obsoletos
    # ═══════════════════════════════════════════════
    plena_meta_pattern = re.compile(r'\s*<meta name="plena-[^"]*"[^>]*>\s*')
    if plena_meta_pattern.search(modified):
        modified = plena_meta_pattern.sub('\n', modified)
        changes.append("Removidos meta tags plena-*")

    # ═══════════════════════════════════════════════
    # 4. INJETAR Inter Font + assets CSS/JS (antes de </head>)
    # ═══════════════════════════════════════════════
    injection_block = """
    <!-- Premium Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Premium Assets -->
    <script src="assets/js/tailwind_config.js"></script>
    <link rel="stylesheet" href="assets/css/styles.css">
"""
    # Verificar se já injetado
    if 'assets/css/styles.css' not in modified:
        modified = modified.replace('</head>', injection_block + '</head>')
        changes.append("Injetado Inter Font + assets CSS/JS")

    # ═══════════════════════════════════════════════
    # 5. CORRIGIR manifest inline → link para arquivo
    # ═══════════════════════════════════════════════
    inline_manifest = re.compile(r'<link\s+rel="manifest"\s+href="data:application/manifest\+json,[^"]*">')
    if inline_manifest.search(modified):
        modified = inline_manifest.sub('<link rel="manifest" href="manifest.json">', modified)
        changes.append("Corrigido manifest inline → manifest.json")
    # Também fix manifests com href= e aspas simples
    inline_manifest2 = re.compile(r"<link\s+rel=\"manifest\"\s+href='data:application/manifest\+json,[^']*'>")
    if inline_manifest2.search(modified):
        modified = inline_manifest2.sub('<link rel="manifest" href="manifest.json">', modified)
        changes.append("Corrigido manifest inline (aspas simples)")

    # ═══════════════════════════════════════════════
    # 6. SUBSTITUIR referências plena-* por brand-*
    # ═══════════════════════════════════════════════
    # Mapear plena-blue, plena-pink, etc → brand-primary no contexto de classes CSS
    plena_refs = re.findall(r'plena-\w+', modified)
    if plena_refs:
        unique_refs = set(plena_refs)
        for ref in unique_refs:
            # Mapear: plena-blue → brand-primary, plena-pink → brand-primary, etc
            color_name = ref.replace('plena-', '')
            # Para cores temáticas, substituir pela cor brand principal
            if color_name in ('blue', 'pink', 'green', 'orange', 'purple', 'red', 'teal', 'cyan', 'amber', 'indigo', 'emerald', 'violet', 'lime', 'sky', 'rose', 'slate'):
                modified = modified.replace(ref, 'brand-primary')
            else:
                modified = modified.replace(ref, f'brand-{color_name}')
        changes.append(f"Substituídas {len(plena_refs)} referências plena-* → brand-*")

    # ═══════════════════════════════════════════════
    # 7. UPGRADE sidebar: adicionar glass-dark e melhorar header
    # ═══════════════════════════════════════════════
    # Sidebar: substituir bg-brand-black → glass-dark com classes premium
    old_sidebar = re.compile(
        r'class="sidebar\s+bg-brand-black\s+text-white\s+transition-transform\s+duration-300\s+flex\s+flex-col\s+shadow-2xl"'
    )
    new_sidebar = 'class="sidebar glass-dark text-white transition-transform duration-300 flex flex-col shadow-2xl border-r border-white/5"'
    if old_sidebar.search(modified):
        modified = old_sidebar.sub(new_sidebar, modified)
        changes.append("Sidebar: bg-brand-black → glass-dark")

    # Sidebar header: upgrade gradient
    old_header = re.compile(
        r'class="h-20\s+flex\s+items-center\s+px-6\s+bg-gradient-to-r\s+from-brand-primary\s+to-brand-\w+"'
    )
    new_header = f'class="h-20 flex items-center px-6 bg-gradient-to-r from-[{theme["dark"]}]/50 to-transparent border-b border-white/5"'
    if old_header.search(modified):
        modified = old_header.sub(new_header, modified)
        changes.append("Sidebar header: gradient premium")

    return modified, changes


def process_system(system_path, system_name, dry_run=False):
    """Processa um único sistema."""
    index_path = os.path.join(system_path, 'index.html')
    assets_css_dir = os.path.join(system_path, 'assets', 'css')
    assets_js_dir = os.path.join(system_path, 'assets', 'js')
    styles_path = os.path.join(assets_css_dir, 'styles.css')
    config_path = os.path.join(assets_js_dir, 'tailwind_config.js')

    if not os.path.isfile(index_path):
        return {'status': 'SKIP', 'reason': 'index.html não encontrado'}

    theme = THEME_MAP.get(system_name)
    if not theme:
        return {'status': 'SKIP', 'reason': 'Sem mapeamento de tema'}

    # Ler HTML
    with open(index_path, 'r', encoding='utf-8', errors='replace') as f:
        html_content = f.read()

    # Verificar se já foi atualizado
    if 'assets/css/styles.css' in html_content and os.path.isfile(styles_path):
        return {'status': 'SKIP', 'reason': 'Já atualizado previamente'}

    # Processar HTML
    modified_html, changes = modify_html(html_content, system_name, theme, dry_run)

    if dry_run:
        return {
            'status': 'READY',
            'changes': changes,
            'css_size': len(generate_styles_css(theme)),
            'config_size': len(generate_tailwind_config(theme)),
            'html_original_size': len(html_content),
        }

    # ── BACKUP ──
    backup_path = index_path + '.bak.premium'
    if not os.path.exists(backup_path):
        shutil.copy2(index_path, backup_path)

    # ── Criar diretórios assets ──
    os.makedirs(assets_css_dir, exist_ok=True)
    os.makedirs(assets_js_dir, exist_ok=True)

    # ── Gerar styles.css ──
    with open(styles_path, 'w', encoding='utf-8') as f:
        f.write(generate_styles_css(theme))

    # ── Gerar tailwind_config.js ──
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(generate_tailwind_config(theme))

    # ── Salvar HTML modificado ──
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(modified_html)

    return {
        'status': 'OK',
        'changes': changes,
        'files_created': ['assets/css/styles.css', 'assets/js/tailwind_config.js'],
        'backup': os.path.basename(backup_path),
    }


def main():
    dry_run = '--dry-run' in sys.argv
    mode = "DRY-RUN" if dry_run else "EXECUÇÃO"

    print(f"")
    print(f"=" * 60)
    print(f"  UPGRADE PREMIUM BATCH -- Modo: {mode}")
    print(f"=" * 60)
    print()

    # Descobrir sistemas
    systems = []
    for item in sorted(os.listdir(BASE_DIR)):
        full_path = os.path.join(BASE_DIR, item)
        if os.path.isdir(full_path) and item.startswith('gestao-') and item not in EXCLUDE:
            systems.append((item, full_path))

    print(f"  Sistemas encontrados: {len(systems)}")
    print(f"  Excluídos: {', '.join(sorted(EXCLUDE))}")
    print()

    results = {'OK': 0, 'READY': 0, 'SKIP': 0, 'ERROR': 0}
    details = []

    for name, path in systems:
        try:
            result = process_system(path, name, dry_run)
            results[result['status']] += 1
            details.append((name, result))

            icon = {'OK': '[OK]', 'READY': '[RDY]', 'SKIP': '[SKIP]', 'ERROR': '[ERR]'}.get(result['status'], '?')
            status_str = result.get('reason', '') or f"{len(result.get('changes', []))} mudanças"
            print(f"  {icon} {name:<30} {status_str}")

            if result.get('changes'):
                for c in result['changes']:
                    print(f"     └─ {c}")

        except Exception as e:
            results['ERROR'] += 1
            details.append((name, {'status': 'ERROR', 'error': str(e)}))
            print(f"  [ERR] {name:<30} ERRO: {e}")

    # Resumo
    label = 'Processados com sucesso' if not dry_run else 'Prontos para processar'
    print()
    print("=" * 60)
    print(f"  RESUMO")
    print("-" * 60)
    print(f"  {label}: {results.get('OK', 0) + results.get('READY', 0)}")
    print(f"  Pulados (ja atualizados): {results.get('SKIP', 0)}")
    print(f"  Erros: {results.get('ERROR', 0)}")
    print("=" * 60)
    print()

    if dry_run:
        print("  [i] Nenhum arquivo foi modificado (modo dry-run)")
        print("  --> Para aplicar: python upgrade_premium_batch.py")
    else:
        print(f"  [OK] Concluido em {datetime.now().strftime('%H:%M:%S')}")
        print("  [i] Backups salvos como *.bak.premium")


if __name__ == '__main__':
    main()
