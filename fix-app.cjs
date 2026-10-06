const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add Import
if (!content.includes('ProjectChatModal')) {
  content = content.replace(
    /import \{ ModelChatModal \} from "\.\/components\/ModelChatModal";/,
    'import { ModelChatModal } from "./components/ModelChatModal";\nimport { ProjectChatModal } from "./components/ProjectChatModal";'
  );
}

// Add state
if (!content.includes('isProjectChatOpen')) {
  content = content.replace(
    /const \[isEngineChatOpen, setIsEngineChatOpen\] = useState\(false\);/,
    'const [isEngineChatOpen, setIsEngineChatOpen] = useState(false);\n  const [isProjectChatOpen, setIsProjectChatOpen] = useState(false);'
  );
}

// Pass onOpenProject to AdvancedControlRibbon
content = content.replace(
  /onNewChat=\{handleNewChat\}/,
  'onNewChat={handleNewChat}\n        onOpenProject={() => setIsProjectChatOpen(true)}'
);

// Add Component to render
const projectModal = `
      {/* Project Workspace Chatbox */}
      <ProjectChatModal
        isOpen={isProjectChatOpen}
        onClose={() => setIsProjectChatOpen(false)}
      />
`;
content = content.replace(
  /\{\/\* Dedicated Engine Chatbox \(JARVIS Cores\) \*\/\}/,
  projectModal + '\n\n      {/* Dedicated Engine Chatbox (JARVIS Cores) */}'
);

fs.writeFileSync('src/App.tsx', content);
