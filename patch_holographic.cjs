const fs = require('fs');
let code = fs.readFileSync('src/components/HolographicDashboard.tsx', 'utf8');

const replacement = `              <option value="jarvis-core-mk1" className="bg-[#051326] text-[#00f3ff]">Core MK1 (God Speed)</option>
              <option value="jarvis-core-mk2" className="bg-[#051326] text-[#00f3ff]">Core MK2 (Deep Intel)</option>
              <option value="jarvis-core-mk3" className="bg-[#051326] text-[#00f3ff]">Core MK3 (Universal)</option>
              <option value="jarvis-core-mk4" className="bg-[#051326] text-[#00f3ff]">Core MK4 (Strategic)</option>
              <option value="jarvis-core-mk5" className="bg-[#051326] text-[#00f3ff]">Core MK5 (Deep Thought)</option>`;

code = code.replace(/<option value="jarvis-core-mk1"[\s\S]*?Logic Matrix<\/option>/, replacement);

fs.writeFileSync('src/components/HolographicDashboard.tsx', code);
console.log("Patched HolographicDashboard successfully");
