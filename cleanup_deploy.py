
import os
import shutil
import glob

DESKTOP = r"C:\Users\reina\OneDrive\Desktop\Mercado Livre Aplicativos"

# Items to KEEP
KEEP_FILES = ["deploy_v8.3_final.zip"]
KEEP_DIRS = ["deploy_v8.3_final"]

def cleanup():
    # 1. Delete Zips
    zip_pattern = os.path.join(DESKTOP, "deploy_v*.zip")
    for file_path in glob.glob(zip_pattern):
        filename = os.path.basename(file_path)
        if filename not in KEEP_FILES:
            try:
                os.remove(file_path)
                print(f"Deleted file: {filename}")
            except Exception as e:
                print(f"Error deleting {filename}: {e}")
        else:
            print(f"KEPT file: {filename}")

    # 2. Delete Directories
    # glob pattern for directories is a bit trickier, we'll iterate listing
    for item in os.listdir(DESKTOP):
        full_path = os.path.join(DESKTOP, item)
        if os.path.isdir(full_path) and item.startswith("deploy_v"):
            if item not in KEEP_DIRS:
                try:
                    shutil.rmtree(full_path)
                    print(f"Deleted folder: {item}")
                except Exception as e:
                    print(f"Error deleting folder {item}: {e}")
            else:
                print(f"KEPT folder: {item}")

    # 3. Delete scripts
    script_pattern = os.path.join(DESKTOP, "package_deploy_v*.py")
    for file_path in glob.glob(script_pattern):
         try:
            os.remove(file_path)
            print(f"Deleted script: {os.path.basename(file_path)}")
         except Exception as e:
            print(f"Error deleting script: {e}")
            
    # Delete inspector scripts
    for s in ["inspect_zip.py", "inspect_zip_full.py"]:
        p = os.path.join(DESKTOP, s)
        if os.path.exists(p):
            os.remove(p)
            print(f"Deleted script: {s}")

if __name__ == "__main__":
    cleanup()
