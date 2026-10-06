const fs = require('fs');

let content = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

// Fix history payload to not include empty text parts
content = content.replace(
  /const historyPayload = widgetMessages\.slice\(-8\)\.map\(m => \(\{\s*role: m\.role,\s*parts: \[\{ text: m\.text \|\| "" \}\]\s*\}\)\);/m,
  `const historyPayload = widgetMessages.slice(-8).map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        else parts.push({ text: " " }); // Prevent empty text error from Gemini
        return { role: m.role, parts };
      });`
);

// Fix error throwing to show exact server error
content = content.replace(
  /if \(!res\.ok\) \{\s*throw new Error\(`HTTP \$\{res\.status\}`\);\s*\}/m,
  `if (!res.ok) {
        if (res.status === 413) throw new Error("File too large (exceeds limit).");
        try {
          const errorData = await res.json();
          throw new Error(errorData.error || \`HTTP \${res.status}\`);
        } catch {
          throw new Error(\`HTTP \${res.status}\`);
        }
      }`
);

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', content);
