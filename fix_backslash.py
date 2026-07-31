import os

components_dir = r"C:\Users\rohin\OneDrive\Documents\lastandfinal\src\components"
files = ['Dashboard.jsx', 'SubjectSetup.jsx', 'MyStudyPlan.jsx']

bad = '\\${API_BASE_URL}'
good = '${API_BASE_URL}'

for f in files:
    path = os.path.join(components_dir, f)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    fixed = content.replace(bad, good)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(fixed)
    print(f'Fixed: {f}')

print('Done!')
