
import os
import shutil
import zipfile

# Absolute paths
SOURCE_DIR = r"C:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos"
UPDATE_DIR = os.path.join(SOURCE_DIR, "update_v8.3_sales_system")
ZIP_FILE = os.path.join(SOURCE_DIR, "update_v8.3_sales_system.zip")

# Strictly requested items
INCLUDE_FILES = ["api_licenca_ml.php", "api_vendas.php"]
INCLUDE_DIRS = ["admin-vendas", "loja"]

def create_update_pkg():
    if os.path.exists(UPDATE_DIR):
        try:
            shutil.rmtree(UPDATE_DIR)
        except:
            pass
    os.makedirs(UPDATE_DIR)
    print(f"Created update directory: {UPDATE_DIR}")

    # 1. Copy Files
    for file in INCLUDE_FILES:
        src = os.path.join(SOURCE_DIR, file)
        dst = os.path.join(UPDATE_DIR, file)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Copied file: {file}")

    # 2. Copy Directories
    for dir_name in INCLUDE_DIRS:
        src = os.path.join(SOURCE_DIR, dir_name)
        dst = os.path.join(UPDATE_DIR, dir_name)
        if os.path.exists(src):
            shutil.copytree(src, dst)
            print(f"Copied directory: {dir_name}")

    # 3. Create api_data (ONLY NEW JSONS)
    # We do NOT want to overwrite existing licenses DB
    api_data_dst = os.path.join(UPDATE_DIR, "api_data")
    os.makedirs(api_data_dst, exist_ok=True)
    
    new_jsons = ["sales_coupons.json", "sales_transactions.json"]
    for f_name in new_jsons:
        with open(os.path.join(api_data_dst, f_name), "w", encoding="utf-8") as f:
            if "coupons" in f_name:
                f.write("{}")
            else:
                f.write("[]")
    print("Created api_data with sales JSONs only.")

    # 4. Zip it (Flat)
    print(f"Creating zip file: {ZIP_FILE}")
    with zipfile.ZipFile(ZIP_FILE, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(UPDATE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, UPDATE_DIR)
                zipf.write(file_path, rel_path)
    print(f"Zip created: {ZIP_FILE}")

if __name__ == "__main__":
    create_update_pkg()
