const fs = require('fs');

let code = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');

// Replace the previous safety logic
const newLogic = `
  // Filter out system files like .DS_Store or Thumbs.db
  let validFiles = files.filter(f => !f.name.startsWith(".") && f.name !== "Thumbs.db");

  // Removed MAX_FILES limit as requested (Takes all files)

  const results: MediaAttachment[] = [];
  let totalSizeProcessed = 0;
  const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1 GB max total

  // Process files in batches
  for (const file of validFiles) {
    try {
      if (totalSizeProcessed + file.size > MAX_TOTAL_SIZE) {
         if (typeof window !== "undefined") alert("⚠️ Max upload size limit (1GB) reached. Remaining files skipped.");
         break;
      }
      
      const MAX_SINGLE_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
      if (file.size > MAX_SINGLE_FILE_SIZE) {
         if (typeof window !== "undefined") alert(\`⚠️ File \${file.name} exceeds the 1GB limit and was skipped.\`);
         continue;
      }

      totalSizeProcessed += file.size;
`;

code = code.replace(
  /\/\/ Filter out system files like \.DS_Store or Thumbs\.db[\s\S]*?totalSizeProcessed \+= file\.size;/m,
  newLogic
);

fs.writeFileSync('src/lib/mediaUpload.ts', code);
console.log("Updated limits to 1GB successfully!");
