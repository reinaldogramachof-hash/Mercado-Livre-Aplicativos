#!/usr/bin/env python3
"""
=============================================================================
  INJECT MASTER PASSWORD — Gestão Systems
  Injeta lógica de ativação com senha mestre em todos os sistemas.
  Resolve o problema de 'activateLicense is not defined' e permite testes.
=============================================================================
  Uso:
    python inject_master_pass.py
=============================================================================
"""

import os
import sys

# ── Diretório raiz ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Payload do Script ──
# Este script define activateLicense globalmente e implementa o bypass
MASTER_SCRIPT = """
    <!-- 🔒 MASTER PASSWORD & ACTIVATION LOGIC (INJECTED) -->
    <script>
        window.activateLicense = async function(e) {
            if(e) e.preventDefault();
            
            const keyInput = document.getElementById('license-key');
            const emailInput = document.getElementById('license-email');
            const btn = document.getElementById('btn-activate');
            
            if(!keyInput || !emailInput) return;
            
            const key = keyInput.value.trim();
            const email = emailInput.value.trim();
            
            if (!key || !email) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            // 🔑 SENHA MESTRE PARA TESTES
            const MASTER_KEYS = ['MASTER123', 'ADMIN_ML', 'TESTE2026'];
            
            if (MASTER_KEYS.includes(key.toUpperCase())) {
                console.log('🔓 Master Access Granted');
                localStorage.setItem('plena_license', key);
                localStorage.setItem('ml_license_email', email);
                localStorage.setItem('ml_master_mode', 'true');
                
                if(btn) {
                    const originalText = btn.innerText;
                    btn.innerText = '🔓 Acesso Liberado...';
                    btn.classList.remove('from-emerald-600', 'to-emerald-700', 'from-brand-primary', 'to-brand-dark');
                    btn.classList.add('bg-blue-600', 'text-white'); // Fallback style
                }
                
                setTimeout(() => {
                    alert('Modo de Teste/Admin Ativado com Sucesso!');
                    window.location.reload();
                }, 500);
                return;
            }

            // 🌍 FLUXO PADRÃO (API)
            if(btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Verificando...';
                btn.disabled = true;
                
                try {
                    // Tenta endpoint relativo padrão dos sistemas Gestão
                    const output = document.getElementById('activation-error');
                    if(output) output.classList.add('hidden');

                    const response = await fetch('../api_licenca_ml.php?action=activate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ license_key: key, email: email })
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        localStorage.setItem('plena_license', key);
                        localStorage.setItem('ml_license_email', email);
                        localStorage.removeItem('ml_master_mode');
                        alert('Licença Ativada com Sucesso!');
                        window.location.reload();
                    } else {
                        const msg = data.message || 'Chave inválida ou erro no servidor.';
                        if(output) {
                            output.textContent = msg;
                            output.classList.remove('hidden');
                        } else {
                            alert('Erro: ' + msg);
                        }
                    }
                } catch (err) {
                    console.error(err);
                    alert('Erro de conexão com o servidor de validação.');
                } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        };
    </script>
"""

def process_system(system_path, system_name):
    index_path = os.path.join(system_path, 'index.html')
    
    if not os.path.isfile(index_path):
        return 'SKIP (no index)'

    with open(index_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Verificar se já injetado
    if 'MASTER PASSWORD & ACTIVATION LOGIC' in content:
        return 'SKIP (already injected)'

    # Injetar antes do </body>
    if '</body>' in content:
        new_content = content.replace('</body>', f'{MASTER_SCRIPT}\n</body>')
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return 'OK (Injected)'
    
    return 'ERROR (No body tag)'

def main():
    print("="*60)
    print("  INJECT MASTER PASS - START")
    print("="*60)
    
    count = 0
    injected = 0
    
    # Processar TODAS as pastas gestao-*, sem exceção desta vez
    # (Pois queremos master pass em tudo)
    for item in sorted(os.listdir(BASE_DIR)):
        full_path = os.path.join(BASE_DIR, item)
        if os.path.isdir(full_path) and item.startswith('gestao-'):
            res = process_system(full_path, item)
            print(f"[{res}] {item}")
            if 'OK' in res:
                injected += 1
            count += 1
            
    print("-" * 60)
    print(f"Total: {count} | Injetados: {injected}")
    print("=" * 60)

if __name__ == '__main__':
    main()
