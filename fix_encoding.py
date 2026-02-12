import os

base_path = r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos"
files = [
    r"Mercado Livre\gestao-barbearia\js\app_core.js",
    r"Mercado Livre\gestao-barbearia\css\styles.css",
    r"Mercado Livre\gestao-barbearia\app.html"
]

def fix_file(path):
    print(f"Fixing {path}...")
    try:
        with open(path, 'rb') as f:
            content = f.read()
            
        # First try to decode as utf-8 (current state)
        text = content.decode('utf-8')
        
        # Heuristic to detect mojibake
        # If we see characters that look like double-encoded UTF-8, we try to fix
        fixed_text = text
        try:
            # This reverses the "Read UTF-8 bytes as CP1252 characters, then saved those characters as UTF-8"
            # Example: 'ç' (bytes C3 A7) -> read as 'Ã' and '§' -> saved as bytes C3 83 C2 A7
            # encode('cp1252') turns C3 83 C2 A7 back into C3 A7 (bytes)
            # decode('utf-8') turns C3 A7 back into 'ç'
            fixed_text = text.encode('cp1252').decode('utf-8')
        except UnicodeEncodeError:
            print("  Fallback: Could not reverse-encode via cp1252. Doing manual replacement.")
            replacements = {
                'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã ': 'à',
                'Ã©': 'é', 'Ãª': 'ê', 
                'Ã­': 'í', 
                'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 
                'Ãº': 'ú', 
                'Ã§': 'ç', 
                'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‡': 'Ç', 'Ã€': 'À',
                'Ã ': 'à'
            }
            for k, v in replacements.items():
                fixed_text = fixed_text.replace(k, v)
        except UnicodeDecodeError:
            print("  Fallback: Decode error during fix.")
            pass

        # Remove invalid trailing tags in JS
        if path.endswith('.js'):
             fixed_text = fixed_text.replace('</script>', '')
             fixed_text = fixed_text.replace('</body>', '')
             fixed_text = fixed_text.replace('</html>', '')

        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed_text)
        print("  Fixed and saved.")
        
    except Exception as e:
        print(f"  Error: {e}")

for f in files:
    full_path = os.path.join(base_path, f)
    if os.path.exists(full_path):
        fix_file(full_path)
    else:
        print(f"File not found: {full_path}")
