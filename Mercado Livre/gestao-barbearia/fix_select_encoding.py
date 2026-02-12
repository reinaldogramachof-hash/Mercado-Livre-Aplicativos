
import os

file_path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'value="contas"' in line:
        # Replace the content inside the tag
        # We know the structure is <option value="contas">...</option>
        prefix = line.split('>')[0] + '>'
        suffix = '</option>\n'
        # Construct correct line guarding indent
        indent = line[:line.find('<')]
        new_line = f'{indent}<option value="contas">Contas (Água/Luz/Net)</option>\n'
        new_lines.append(new_line)
        print(f"Fixed line: {new_line.strip()}")
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
