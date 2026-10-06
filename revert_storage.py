import re

# 1. Update src/App.tsx
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*StorageModal\s*\}\s+from\s+"./components/StorageModal";\n', '', content)
content = re.sub(r'\s+if\s*\(tab === "storage"\)\s*\{\n\s+setIsStorageModalOpen\(true\);\n\s+return;\n\s+\}', '', content)
content = re.sub(r'\s+const\s+\[isStorageModalOpen,\s*setIsStorageModalOpen\]\s*=\s*useState<boolean>\(false\);\n', '\n', content)
content = re.sub(r'\s+onOpenStorage=\{\(\)\s*=>\s*setIsStorageModalOpen\(true\)\}\n\s+isStorageOpen=\{isStorageModalOpen\}\n', '\n', content)
content = re.sub(r'\s+\{/\*\s*J\.A\.R\.V\.I\.S\.\s*DUAL-STORAGE MANAGEMENT VAULT[\s\S]*?<StorageModal[\s\S]*?/>\n', '\n', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

# 2. Update src/types.ts
with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace(' | "persona" | "storage"', ' | "persona"')

with open('src/types.ts', 'w') as f:
    f.write(content)

print("App & types reverted")
