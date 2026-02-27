import os
import re

# Configuração
ROOT_DIR = r"C:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos"
TARGET_FILE = "js\\app_core.js" # Use correct separator

# Padrão antigo (para buscar e substituir) - Flexibilizando espaços
OLD_CODE_PATTERN = r'alert\("Erro: "\s*\+\s*\(data\.message\s*\|\|\s*"Falha no registro do recibo\."\)\);\s*if\s*\(btn\)\s*\{\s*btn\.disabled\s*=\s*false;\s*btn\.innerText\s*=\s*"Confirmar Recebimento";\s*\}'

# Novo código (Melhor feedback)
NEW_CODE = r'''console.error("Erro Recibo:", data);
            alert("Atenção: Não foi possível registrar o recibo automaticamente.\nErro: " + (data.message || "Falha de comunicação."));
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Tentar Novamente";
            }'''

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"[ERR] Erro ao ler {file_path}: {e}")
        return False

    # Debug: Check if file contains "Confirmar Recebimento"
    if "Confirmar Recebimento" not in content:
        # Maybe it's already updated or different structure
        if "Tentar Novamente" in content:
             print(f"[SKIP] Já atualizado: {file_path}")
             return True
        else:
             print(f"[INFO] Arquivo não contém o código alvo: {file_path}")
             return False

    # Tenta substituição
    match = re.search(OLD_CODE_PATTERN, content)
    if match:
        new_content = re.sub(OLD_CODE_PATTERN, NEW_CODE, content)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"[OK] Atualizado: {file_path}")
        return True
    else:
        print(f"[FAIL] Padrão Regex não casou em: {file_path}")
        return False

def main():
    print("Iniciando atualização em massa do app_core.js...")
    count = 0
    # Walk through root dir
    for root, dirs, files in os.walk(ROOT_DIR):
        # Check if we are in a 'gestao-' folder
        if "gestao-" in os.path.basename(root):
            # Check if js/app_core.js exists in this folder or subfolder
             target_path = os.path.join(root, "js", "app_core.js")
             if os.path.exists(target_path):
                 print(f"Processando: {target_path}")
                 if process_file(target_path):
                     count += 1
    
    print(f"\nConcluído! {count} arquivos modificados.")

if __name__ == "__main__":
    main()
