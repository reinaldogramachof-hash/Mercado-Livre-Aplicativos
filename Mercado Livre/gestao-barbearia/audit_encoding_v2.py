
import re
import os

files_to_check = [
    r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html',
    r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\js\app_core.js'
]

# Common mojibake patterns
mojibake_pattern = re.compile(r'[ÃÂ][\x80-\xBF]|â[\x80-\xBF]{2}')

print("=== RELATORIO DE AUDITORIA DE ENCODING (V2) ===\n")

for file_path in files_to_check:
    print(f"Analisando: {os.path.basename(file_path)}")
    try:
        # Use utf-8-sig to handle BOM
        with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
            lines = f.readlines()
        
        found_issues = False
        for i, line in enumerate(lines):
            matches = mojibake_pattern.findall(line)
            if matches:
                found_issues = True
                # Print safe representation
                safe_line = line.strip().encode('ascii', 'backslashreplace').decode('ascii')
                print(f"  [Linha {i+1}] Mojibake detectado: {safe_line[:100]}...")
        
        if not found_issues:
            print("  Nenhum erro de encoding (mojibake) detectado.")

    except Exception as e:
        print(f"  Erro ao ler arquivo: {e}")
    print("\n")
