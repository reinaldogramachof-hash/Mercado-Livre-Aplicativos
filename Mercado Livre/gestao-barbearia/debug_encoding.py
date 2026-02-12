
path = r'c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia\app.html'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        print("Opened as UTF-8")
except:
    print("Failed UTF-8, trying Latin-1")
    with open(path, 'r', encoding='latin-1') as f:
        content = f.read()
        print("Opened as Latin-1")

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'aria-label' in line and 'Tesoura' in line:
        print(f"Line {i}: {repr(line)}")
    if 'text-blue-700' in line and 'rounded-full' in line and 'Mobile' in line:
         print(f"Line {i}: {repr(line)}")
