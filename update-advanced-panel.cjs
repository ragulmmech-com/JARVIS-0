const fs = require('fs');

let content = fs.readFileSync('src/components/AdvancedWidgetsPanel.tsx', 'utf-8');

// Change widgetMessages state to widgetHistories
content = content.replace(
  /const \[widgetMessages, setWidgetMessages\] = useState<Message\[\]>\(\(\) => \{[\s\S]*?\}\);/m,
  `const [widgetHistories, setWidgetHistories] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem("jarvis_tactical_widget_histories");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const widgetMessages = widgetHistories[widgetModel] || [];
  
  const setWidgetMessages = (updater) => {
    setWidgetHistories(prev => {
      const current = prev[widgetModel] || [];
      const newMessages = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [widgetModel]: newMessages };
    });
  };
  `
);

// Save back to localStorage on change
content = content.replace(
  /localStorage\.setItem\("jarvis_tactical_widget_chat", JSON\.stringify\(widgetMessages\)\);/,
  `localStorage.setItem("jarvis_tactical_widget_histories", JSON.stringify(widgetHistories));`
);
content = content.replace(
  /}, \[widgetMessages\]\);/,
  `}, [widgetHistories]);`
);

// Add state for copiedId
content = content.replace(
  /const \[isWidgetChatProcessing, setIsWidgetChatProcessing\] = useState\(false\);/,
  `const [isWidgetChatProcessing, setIsWidgetChatProcessing] = useState(false);\n  const [copiedId, setCopiedId] = useState<string | null>(null);`
);

// Add copy and delete handlers
content = content.replace(
  /const handleWidgetChatSubmit = async/,
  `const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handleDeleteMessage = (id: string) => {
    setWidgetMessages(prev => prev.filter(m => m.id !== id));
  };
  
  const handleWidgetChatSubmit = async`
);

// Update rendering of messages to add Copy and Delete buttons
content = content.replace(
  /className="text\[#00f3ff\] uppercase font-bold">[\s\S]*?<span>\{new Date\(msg.timestamp \|\| Date.now\(\)\).toLocaleTimeString\(\)\}<\/span>/m,
  `className="text-[#00f3ff] uppercase font-bold">
                      {msg.role === "user" ? "YOU" : msg.modelBadge?.toUpperCase() || "AI"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                      {msg.text && (
                        <button
                          onClick={() => handleCopy(msg.text || "", msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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

fs.writeFileSync('src/components/AdvancedWidgetsPanel.tsx', content);
