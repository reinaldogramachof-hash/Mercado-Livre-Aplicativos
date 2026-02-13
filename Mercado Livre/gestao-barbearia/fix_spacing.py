import os

# Configuration
TARGET_DIR = r"c:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos\Mercado Livre\gestao-barbearia"
EXTENSIONS = {'.html', '.js', '.css', '.php'}

def fix_spacing(content):
    lines = content.splitlines()
    cleaned_lines = []
    
    # Heuristic: If > 40% of lines are empty, assume double-spacing artifact
    empty_count = sum(1 for line in lines if not line.strip())
    total_count = len(lines)
    is_double_spaced = (total_count > 10) and ((empty_count / total_count) > 0.4)
    
    last_was_empty = False
    
    for line in lines:
        stripped = line.strip()
        is_empty = not stripped
        
        if is_empty:
            if is_double_spaced:
                # In double-spaced files, ignore single empty lines (they are artifacts)
                # Only keep if previous was ALSO empty (meaning a triple-gap originally, reduced here)
                pass 
            elif not last_was_empty:
                cleaned_lines.append("")
            last_was_empty = True
        else:
            cleaned_lines.append(line)
            last_was_empty = False
            
    return "\n".join(cleaned_lines)

def process_file(filepath):
    print(f"Processing: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = fix_spacing(content)
        
        # Only save if substantial change (bytes reduced) or different
        if len(new_content) < len(content):
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("  [FIXED] Removed excess spacing.")
        else:
             print("  [OK] Spacing seems fine.")
    except Exception as e:
        print(f"  [ERROR] {e}")

def main():
    print(f"Starting spacing cleanup in: {TARGET_DIR}")
    for root, dirs, files in os.walk(TARGET_DIR):
        if '.git' in root or '.agent' in root:
            continue
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXTENSIONS:
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
