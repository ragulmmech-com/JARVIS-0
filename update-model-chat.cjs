const fs = require('fs');

let content = fs.readFileSync('src/components/ModelChatModal.tsx', 'utf-8');

// Add handleDeleteMessage
content = content.replace(
  /const handleCopy = /,
  `const handleDeleteMessage = (id: string) => {
    setModelMessages(prev => prev.filter(m => m.id !== id));
  };
  
  const handleCopy = `
);

// Add Trash button next to Copy button
content = content.replace(
  /\{copiedId === msg\.id \? <Check className="w-3 h-3 text-emerald-400" \/> : <Copy className="w-3 h-3" \/>\}\s*<\/button>\s*\)\}\s*<\/div>/,
  `{copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>`
);

// Check if Trash2 is imported
if (!content.includes('Trash2')) {
  content = content.replace(/import \{ ([^}]+) \} from "lucide-react";/, 'import { $1, Trash2 } from "lucide-react";');
}

fs.writeFileSync('src/components/ModelChatModal.tsx', content);
