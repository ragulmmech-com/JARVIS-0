#!/bin/bash
sed -i 's/JSON.stringify(messages)/JSON.stringify(messages.map(m => m.image \&\& m.image.length > 100000 ? { ...m, image: undefined, text: (m.text || "") + "\\n[File data removed from local history to preserve memory quota]" } : m))/g' src/App.tsx
sed -i 's/JSON.stringify(next)/JSON.stringify(next.map(s => ({ ...s, messages: s.messages.map(m => m.image \&\& m.image.length > 100000 ? { ...m, image: undefined, text: (m.text || "") + "\\n[File data removed from local history to preserve memory quota]" } : m) })))/g' src/App.tsx
