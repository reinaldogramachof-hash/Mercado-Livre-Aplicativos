import os

files_to_fix = [
    r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html",
    r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\js\app_core.js"
]

replacements = {
    # Textos que falharam no multi_replace ou script anterior
    "Ã cone": "Ícone",  # Pode ser que o espaço seja normal
    "Ã\xa0s": "às",      # Ã + no-break space? ou 0xA0
    "UTILITÃ RIOS": "UTILITÁRIOS",
    
    # Emojis (UTF-8 interpretado como Latin-1/Windows-1252)
    "ðŸ’°": "💸",
    "ðŸ“…": "📅",
    "ðŸ’¡": "💡",
    "âš ": "⚠️",
    "âœ“": "✓",
    "â˜°": "☰",
    "ðŸ“": "📲" # Possível chute, verificar contexto
}

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Correção específica para Ã cone que pode ter variações
        content = content.replace("Ã cone", "Ícone")
        
        for bad, good in replacements.items():
            content = content.replace(bad, good)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed emojis in: {filepath}")
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

for f in files_to_fix:
    if os.path.exists(f):
        fix_file(f)
