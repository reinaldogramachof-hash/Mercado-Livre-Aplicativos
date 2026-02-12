
path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Try explicit unicode codepoints based on previous crash
# \u00c3\u008d is Ã + control char
target = '\u00c3\u008dcone'
replacement = 'Ícone'

if target in content:
    print(f"Found broken sequence 2 (Ã + 8D). Replacing...")
    content = content.replace(target, replacement)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed.")
else:
    print("Broken sequence 2 not found.")
