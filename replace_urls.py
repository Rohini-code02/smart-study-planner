import os
import re

components_dir = r"C:\Users\rohin\OneDrive\Documents\lastandfinal\src\components"
files_to_update = [
    "Login.jsx",
    "Signup.jsx",
    "Dashboard.jsx",
    "SubjectSetup.jsx",
    "TimetableGenerator.jsx",
    "MyStudyPlan.jsx",
    "ProgressDashboard.jsx",
    "Profile.jsx",
]

api_import = "import API_BASE_URL from '../config/api.js';\n"

for filename in files_to_update:
    filepath = os.path.join(components_dir, filename)
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {filename}")
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add API_BASE_URL import after the first import line (only if not already present)
    if "from '../config/api.js'" not in content:
        # Insert after the last CSS import or first import block
        first_import_end = content.rfind("import '") 
        # Find end of that line
        line_end = content.find('\n', first_import_end)
        if line_end == -1:
            line_end = len(content)
        content = content[:line_end + 1] + '\n' + api_import + content[line_end + 1:]

    # 2. Replace all occurrences of 'http://localhost:5000' with ${API_BASE_URL}
    # Inside template literals: `http://localhost:5000/...` -> `${API_BASE_URL}/...`
    content = re.sub(
        r"'http://localhost:5000(/api/[^']*)'",
        r"'${API_BASE_URL}\1'",
        content
    )
    # Convert newly created single-quote strings with ${} to template literals
    content = re.sub(
        r"'(\$\{API_BASE_URL\}/api/[^']*)'",
        r"`\1`",
        content
    )
    # Handle already template-literal ones (backtick with localhost)
    content = re.sub(
        r"`http://localhost:5000(/api/[^`]*)`",
        r"`\${API_BASE_URL}\1`",
        content
    )
    # Handle plain string (no template)  e.g. fetch('http://localhost:5000/api/users/login'
    content = re.sub(
        r"fetch\('http://localhost:5000(/api/[^']+)'\)",
        r"fetch(`${API_BASE_URL}\1`)",
        content
    )
    # Cleanup any double-converted ones
    content = content.replace('${API_BASE_URL}${API_BASE_URL}', '${API_BASE_URL}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated: {filename}")

print("\nAll files updated successfully!")
