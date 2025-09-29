import json
import os
import zipfile
from datetime import datetime

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        # Exclude the versions directory from being zipped
        if 'versions' in dirs:
            dirs.remove('versions')
        for file in files:
            file_path = os.path.join(root, file)
            try:
                ziph.write(file_path)
            except Exception as e:
                print(f"Error zipping {file_path}: {e}")

# Load the manifest file
with open('manifest.json', 'r') as file:
    manifest = json.load(file)

# Increment version based on the current date
current_date = datetime.now().strftime("%Y.%m.%d")
version_base = current_date
existing_version = manifest.get('version')

if existing_version.startswith(version_base):
    # Increment the last version number
    last_number = int(existing_version.split('.')[-1]) + 1
    new_version = f"{version_base}.{last_number}"
else:
    new_version = f"{version_base}.1"

manifest['version'] = new_version

# Save the updated manifest file
with open('manifest.json', 'w') as file:
    json.dump(manifest, file, indent=4)

# Create a versions directory if it doesn't exist
if not os.path.exists('versions'):
    os.makedirs('versions')

# Create a zip file with the new version name in the versions folder
zip_path = os.path.join('versions', f"{new_version}.zip")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, allowZip64=True) as zipf:
    zipdir('.', zipf)

# Output the new version for use in other steps
print(new_version)
