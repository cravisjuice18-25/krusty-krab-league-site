"""Check local page dependencies and JavaScript syntax without extra packages."""
from pathlib import Path
import re
import subprocess
root = Path(__file__).resolve().parent.parent
errors = []
for page in root.glob('*.html'):
    if page.name == 'team-template.html':
        continue  # internal legacy layout reference
    for target in re.findall(r'(?:href|src)="([^"]+)"', page.read_text()):
        if target.startswith(('https:', 'http:', '#')):
            continue
        local = target.split('?')[0]
        if local.endswith(('.html', '.js', '.css')) and not (root / local).is_file():
            errors.append(f'{page.name}: missing {local}')
for script in root.glob('*.js'):
    if subprocess.run(['node', '--check', str(script)], capture_output=True).returncode:
        errors.append(f'{script.name}: invalid JavaScript')
if errors:
    raise SystemExit('\n'.join(errors))
print('Local page links, script dependencies, and JavaScript syntax passed.')
