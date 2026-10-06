import re

# 1. Update src/components/SystemSidebarNav.tsx
with open('src/components/SystemSidebarNav.tsx', 'r') as f:
    content = f.read()

content = content.replace('onOpenStorage?: () => void;', '')
content = content.replace('isStorageOpen?: boolean;', '')
content = content.replace('onOpenStorage,', '')
content = content.replace('isStorageOpen = false,', '')

content = re.sub(r'\{ id: "storage", icon: HardDrive, label: "Storage & Sync" \},\n\s+', '', content)
content = re.sub(r',\s*HardDrive', '', content)
content = re.sub(r'HardDrive,\s*', '', content)

content = re.sub(r'\s+\{/\* STORAGE & SYNC VAULT.*?</button>', '', content, flags=re.DOTALL)

with open('src/components/SystemSidebarNav.tsx', 'w') as f:
    f.write(content)


# 2. Update src/components/AllChatsHistoryModal.tsx
with open('src/components/AllChatsHistoryModal.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'import\s+\{\s*deleteSessionFromAiStorage\s*\}\s+from\s+"../lib/aiStorageService";\n', '', content)
content = re.sub(r',\s*HardDrive,\s*ShieldCheck', '', content)
content = content.replace('onOpenStorageVault?: () => void;', '')
content = content.replace('onOpenStorageVault,', '')

content = re.sub(r'\s+// Synchronize purge to AI Storage.*?\}\);', '', content, flags=re.DOTALL)
content = re.sub(r'\s+\{/\* Storage Vault Direct Button \*/\}.*?</button>\n\s+\)\}', '', content, flags=re.DOTALL)
content = re.sub(r'\s+\{/\* MILITARY DATA SECURITY & SYNC BAR \*/\}.*?</div>\n\s+</div>', '', content, flags=re.DOTALL)


with open('src/components/AllChatsHistoryModal.tsx', 'w') as f:
    f.write(content)

print("Nav & Modal reverted")
