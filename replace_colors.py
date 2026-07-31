import os
import re

directory = r"C:\Users\rohin\OneDrive\Documents\lastandfinal\src\components"
files_to_update = ["MyStudyPlan.css", "Profile.css", "ProgressDashboard.css", "SubjectSetup.css", "TimetableGenerator.css"]

replacements = {
    re.compile(r'#357abd', re.IGNORECASE): 'var(--accent-hover)',
    re.compile(r'#e68f00', re.IGNORECASE): 'var(--accent-warning-hover)',
}

for filename in files_to_update:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pattern, replacement in replacements.items():
        content = pattern.sub(replacement, content)
        
    with open(filepath, 'w') as f:
        f.write(content)

print("Hover replacement complete.")
