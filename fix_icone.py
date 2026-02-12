import os

filepath = r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html"

with open(filepath, 'rb') as f:
    content = f.read()

# Procurar "cone da engrenagem" em bytes
target = b"cone da engrenagem"
idx = content.find(target)

if idx != -1:
    # Ver o que tem antes
    start = max(0, idx - 10)
    snippet = content[start:idx+len(target)]
    print(f"Snippet found: {snippet}")
    
    # Substituir "Ã cone" (seja lá quais bytes forem) por "Ícone"
    # Assumindo que queremos Ícone (UTF-8: \xc3\x8d\x63\x6f\x6e\x65)
    
    # Vamos pegar o trecho `<p class="text-gray-600 text-xs">` até `</p>` envolvendo o target
    # E substituir o miolo.
    
    str_content = content.decode('utf-8', errors='ignore')
    if "cone da engrenagem" in str_content:
        # Tentar replace via string manipulação bruta
        fixed_content = str_content.replace("Ã cone da engrenagem", "Ícone da engrenagem")
        
        # Se falhar (caractere diferente de espaço), tentar wildcard regex
        import re
        fixed_content = re.sub(r'>.{1,3}cone da engrenagem<', '>Ícone da engrenagem<', fixed_content)
        
        if fixed_content != str_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print("Fixed file via regex/replace.")
        else:
            print("No changes made via string replace. Regex didnt match?")
else:
    print("Target string not found in bytes.")
