import os

# Configuration
TARGET_DIR = r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia"
EXTENSIONS = {'.html', '.js', '.css', '.php', '.json', '.txt'}

def fix_content(content):
    # 1. Attempt to fix "Double Encoding" (UTF-8 interpreted as Latin-1)
    # Common artifacts: Ã© (é), Ã£ (ã), Ã­ (í), etc.
    # Logic: If we encode to latin1 and it results in valid UTF-8 bytes, decode back as UTF-8.
    
    fixed = content
    try:
        # Heuristic: Check for characteristic Mojibake sequences
        if 'Ã' in content:
            # Try to reverse the damage
            candidate = content.encode('latin1').decode('utf-8')
            
            # Validation: If candidate is shorter (multi-char becoming single char) and valid
            if len(candidate) < len(content):
                print("    -> Encoding fix applied (Latin1 -> UTF-8 reversal)")
                fixed = candidate
    except Exception as e:
        # If encode/decode fails, it might not be a simple full-file error or contains mixed content.
        # Fallback to manual replacement for common cases if safe?
        pass

    # 2. Fix Line Endings and Excessive Empty Lines
    lines = fixed.splitlines()
    cleaned_lines = []
    gap_count = 0
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            gap_count += 1
            if gap_count <= 1: # Allow max 1 empty line
                cleaned_lines.append("")
        else:
            gap_count = 0
            cleaned_lines.append(line) # Keep original indentation/content
            
    return "\n".join(cleaned_lines)

def process_file(filepath):
    print(f"Processing: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        new_content = fix_content(content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("  [FIXED] Saved changes.")
        else:
            print("  [OK] No changes needed.")
            
    except Exception as e:
        print(f"  [ERROR] {e}")

def main():
    print(f"Starting sanitization in: {TARGET_DIR}")
    for root, dirs, files in os.walk(TARGET_DIR):
        # Skip hidden folders
        if '.git' in root or '.agent' in root:
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXTENSIONS:
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
