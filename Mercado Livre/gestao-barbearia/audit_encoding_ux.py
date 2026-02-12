
import re
import os

files_to_check = [
    r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html',
    r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\js\app_core.js'
]

# Common mojibake patterns (UTF-8 interpreted as Latin-1/Windows-1252)
# Ã£ (ã), Ã© (é), Ã¡ (á), Ã³ (ó), Ã (í), Ã§ (ç), Ãª (ê), etc.
mojibake_pattern = re.compile(r'[ÃÂ][\x80-\xBF]|â[\x80-\xBF]{2}|')

print("=== RELATÓRIO DE AUDITORIA DE ENCODING E UX ===\n")

for file_path in files_to_check:
    print(f"Analisando: {os.path.basename(file_path)}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        found_encoding_issues = False
        for i, line in enumerate(lines):
            matches = mojibake_pattern.findall(line)
            if matches:
                found_encoding_issues = True
                print(f"  [Linha {i+1}] Possível erro de encoding: {line.strip()[:100]}...")
        
        if not found_encoding_issues:
            print("  Nenhum erro óbvio de encoding encontrado.")

    except Exception as e:
        print(f"  Erro ao ler arquivo: {e}")
    print("\n")

print("=== ANÁLISE DE ELEMENTOS NUMÉRICOS (Manual/Passos) ===\n")

# Check for numbers that might need styling in app.html
if os.path.exists(files_to_check[0]):
    with open(files_to_check[0], 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for single digits inside divs or spans that might be indicators
    # Pattern: >d< or > d < inside specific structural tags
    # This is heuristic.
    
    # Check specifically for the manual steps classes
    # We want to see if there are any 'step-number' classes that don't have 'rounded-full'
    
    step_numbers = re.finditer(r'class="[^"]*step-number[^"]*"', content)
    print("Verificando classes '.step-number':")
    for match in step_numbers:
        cls = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        if 'rounded-full' not in cls:
             print(f"  [Linha {line_num}] .step-number SEM rounded-full: {cls}")
        else:
             pass # print(f"  [Linha {line_num}] OK: {cls}")

    # Look for other potential step indicators (e.g., inside lists)
    # <div ...>1</div> pattern where the div is small
    
print("\nAuditoria concluída.")
