import re

with open('src/components/StorageModal.tsx', 'r') as f:
    content = f.read()

# 1. Remove googleDriveService imports
content = re.sub(
    r'import\s+\{[\s\S]*?\}\s+from\s+"../lib/googleDriveService";\n',
    '',
    content
)

# 2. Change state declarations and remove drive states
content = re.sub(
    r'// Active sub-view: "drive" \(1\.\) or "ai_storage" \(2\.\) or "all"\n\s+const \[activeSection, setActiveSection\] = useState<"drive" \| "ai_storage">\("drive"\);\n\n\s+// --- GOOGLE DRIVE STATE ---\n[\s\S]*?const \[isLoadingBackups, setIsLoadingBackups\] = useState\(false\);\n',
    r'// Active sub-view: "ai_storage"\n  const [activeSection, setActiveSection] = useState<"ai_storage">("ai_storage");\n',
    content
)

# 3. Remove initAuth from useEffect
content = re.sub(
    r'\s+// Init Firebase Auth\n\s+const unsubscribe = initAuth\([\s\S]*?\);\n\n\s+return \(\) => \{\n\s+unsubscribe\(\);\n\s+\};\n',
    '',
    content
)

# 4. Remove fetchDriveBackups and Drive Handlers
content = re.sub(
    r'  const fetchDriveBackups = async \(token: string\) => \{[\s\S]*?// 2\.\) SYNC TO AI STORAGE \(INDEXEDDB\) HANDLERS',
    '  // 2.) SYNC TO AI STORAGE (INDEXEDDB) HANDLERS',
    content
)

# 5. Remove Drive overview health card
content = re.sub(
    r'\s+<div className="bg-\[#051329\]/80 border border-\[var\(--theme-primary\)\]/20 p-2\.5 rounded-xl flex flex-col justify-between">\n\s+<span className="text-gray-400 text-\[10px\]">GOOGLE DRIVE CLOUD</span>[\s\S]*?</div>',
    '',
    content
)

# 6. Change Navigation Tabs to only have AI storage, or just remove the tabs since there's only one now.
# Let's just remove the Navigation tabs entirely since there's only 1 option, and adjust the header.
content = re.sub(
    r'\s+<span className="text-\[10px\] font-mono px-2 py-0\.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">\n\s+DUAL-STORAGE ENGINE\n\s+</span>',
    r'\n                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">\n                  LOCAL AI ENGINE\n                </span>',
    content
)

content = re.sub(
    r'\s+{/\* NAVIGATION TABS: OPTION 1 & OPTION 2 \*/}.*?{/\* TAB BODY CONTENT \*/}',
    '\n        {/* TAB BODY CONTENT */}',
    content,
    flags=re.DOTALL
)

# 7. Remove Drive Section Content
content = re.sub(
    r'\s+{/\* SECTION 1: SYNC TO DRIVE \*/}.*?{/\* SECTION 2: SYNC TO AI STORAGE \(INDEXEDDB\) \*/}',
    '\n          {/* SECTION: SYNC TO AI STORAGE (INDEXEDDB) */}',
    content,
    flags=re.DOTALL
)

# 8. Remove the activeSection check for ai_storage since it's the only one
content = re.sub(
    r'\{activeSection === "ai_storage" && \(\n\s+<div className="space-y-4">',
    '<div className="space-y-4">',
    content
)
# Match the closing brace of activeSection === "ai_storage" && (
content = re.sub(
    r'</p>\n\s+</div>\n\s+</div>\n\s+</div>\n\s+\)\}\n\s+</div>',
    '</p>\n                </div>\n              </div>\n            </div>\n        </div>',
    content
)

# 9. Remove Drive Confirmation Restore Modal
content = re.sub(
    r'\s+{/\* CONFIRMATION MODAL FOR RESTORE \(Required by Workspace Integration Skill\) \*/}.*?{/\* MODAL FOOTER \*/}',
    '\n        {/* MODAL FOOTER */}',
    content,
    flags=re.DOTALL
)

# 10. Update footer text
content = content.replace('Dual Storage Active', 'AI Storage Active')

with open('src/components/StorageModal.tsx', 'w') as f:
    f.write(content)

print("Done")
