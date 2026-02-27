import os
import re

# Configuração
ROOT_DIR = r"C:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos"
TARGET_FILE = "js/app_core.js"

# Padrão antigo (para buscar e substituir)
# Vamos buscar um trecho unico da funcao antiga para garantir que estamos no lugar certo
OLD_CODE_PATTERN = r'alert\("Erro: " \+ \(data\.message \|\| "Falha no registro do recibo\."\)\);\s*if \(btn\) \{\s*btn\.disabled = false;\s*btn\.innerText = "Confirmar Recebimento";\s*\}'

# Novo código (Melhor feedback)
NEW_CODE = r'''console.error("Erro Recibo:", data);
            alert("Atenção: Não foi possível registrar o recibo automaticamente.\nErro: " + (data.message || "Falha de comunicação."));
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Tentar Novamente";
            }'''

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verifica se o arquivo tem o código antigo
    if re.search(OLD_CODE_PATTERN, content):
        new_content = re.sub(OLD_CODE_PATTERN, NEW_CODE, content)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"[OK] Atualizado: {file_path}")
        return True
    elif "Tentar Novamente" in content:
         print(f"[SKIP] Já atualizado: {file_path}")
    else:
        print(f"[FAIL] Padrão não encontrado em: {file_path}")
    return False

def main():
    print("Iniciando atualização em massa do app_core.js...")
    count = 0
    for item in os.listdir(ROOT_DIR):
        item_path = os.path.join(ROOT_DIR, item)
        if os.path.isdir(item_path) and item.startswith("gestao-"):
            target = os.path.join(item_path, TARGET_FILE)
            if os.path.exists(target):
                if process_file(target):
                    count += 1
            else:
                print(f"[WARN] Arquivo não encontrado: {target}")

    print(f"\nConcluído! {count} arquivos atualizados.")

if __name__ == "__main__":
    main()
