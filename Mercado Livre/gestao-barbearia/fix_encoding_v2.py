
import os

path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
except:
    print("Could not read as utf-8, trying latin-1")
    with open(path, 'r', encoding='latin-1') as f:
        content = f.read()

# Replace specific broken strings
# Using the exact representation seen in view_file
corrections = {
    'Ã cone': 'Ícone',
    '📲±': '📱',
    'ConferÃªncia': 'Conferência'
}

for old, new in corrections.items():
    if old in content:
        print(f"Fixing {old}...")
        content = content.replace(old, new)
    else:
        print(f"Could not find {old}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
