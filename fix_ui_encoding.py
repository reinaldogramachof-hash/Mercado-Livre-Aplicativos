import os

files_to_fix = [
    r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html",
    r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\js\app_core.js"
]

replacements = {
    # Common Mojibake
    "Ãƒ": "Ã",  # Double encoding of Ã
    "Ã£": "ã",
    "Ã¡": "á",
    "Ã©": "é",
    "Ãª": "ê",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãµ": "õ",
    "Ã§": "ç",
    "Ãº": "ú",
    "Ã ": "à ", # Ã followed by space is often à
    "Ã‚": "Â",
    "Ã”": "Ô",
    "Ãš": "Ú",
    "Ã‡": "Ç",
    "Ã•": "Õ",
    "Ã‰": "É",
    "Ã“": "Ó",
    "Ã¢": "â",
    "Ã ": "à",
    
    # Specific words found
    "GestÃ£o": "Gestão",
    "RelatÃ³rios": "Relatórios",
    "ConfiguraÃ§Ãµes": "Configurações",
    "ServiÃ§os": "Serviços",
    "INICIALIZAÇÃƒO": "INICIALIZAÇÃO",
    "UTILITÃ RIOS": "UTILITÁRIOS",
    "NAVEGAÇÃƒO": "NAVEGAÇÃO",
    "COMISSÃƒO": "COMISSÃO",
    "Ã cone": "Ícone",
    "sÃ£o": "são",
    "não": "não", # just in case
    "Ã©": "é",
    "Ã ": "à",
    "Ã—": "x", # sometimes multiplication sign
    "â˜°": "☰", # Menu icon hamburger if mojibaked to â˜°
    "âœ“": "✓",
    "âš ï¸ ": "⚠️"
}

# Additional Visual Fixes (Borders for numbers in manual)
# We will inject 'border-2' to the classes
ui_replacements = {
    # Step Numbers (Large)
    'class="step-number bg-gradient-to-r': 'class="step-number border-2 border-white/20 shadow-lg bg-gradient-to-r',
    # Step Items (Small A, B, C) - Blue
    'rounded-full bg-blue-100 text-blue-700': 'rounded-full bg-blue-100 text-blue-700 border-2 border-blue-200',
    # Step Items - Green
    'rounded-full bg-green-100 text-green-700': 'rounded-full bg-green-100 text-green-700 border-2 border-green-200 shadow-sm',
    # Step Items - Purple
    'rounded-full bg-purple-100 text-purple-700': 'rounded-full bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-sm',
     # Step Items - Yellow
    'rounded-full bg-yellow-100 text-yellow-700': 'rounded-full bg-yellow-100 text-yellow-700 border-2 border-yellow-200 shadow-sm',
}

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply encoding fixes first
        for bad, good in replacements.items():
            content = content.replace(bad, good)
            
        # Apply UI fixes only for HTML
        if filepath.endswith(".html"):
            for old_class, new_class in ui_replacements.items():
                content = content.replace(old_class, new_class)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

for f in files_to_fix:
    if os.path.exists(f):
        fix_file(f)
    else:
        print(f"File not found: {f}")
