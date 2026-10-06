const fs = require('fs');

let content = fs.readFileSync('src/components/ModelChatModal.tsx', 'utf-8');

// Fix history payload to not include empty text parts
content = content.replace(
  /const historyPayload = modelMessages\.slice\(-12\)\.map\(m => \(\{\s*role: m\.role,\s*parts: \[\{ text: m\.text \|\| "" \}\]\s*\}\)\);/m,
  `const historyPayload = modelMessages.slice(-12).map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        else parts.push({ text: " " });
        return { role: m.role, parts };
      });`
);

// Fix error throwing
content = content.replace(
  /if \(!res\.ok\) \{\s*if \(res\.status === 413\) throw new Error\("File too large \(exceeds 32MB limit\)\."\);\s*throw new Error\(`HTTP Error \$\{res\.status\}`\);\s*\}/m,
  `if (!res.ok) {
        if (res.status === 413) throw new Error("File too large (exceeds limit).");
        try {
          const errorData = await res.json();
          throw new Error(errorData.error || \`HTTP Error \${res.status}\`);
        } catch {
          throw new Error(\`HTTP Error \${res.status}\`);
        }
      }`
);

fs.writeFileSync('src/components/ModelChatModal.tsx', content);
