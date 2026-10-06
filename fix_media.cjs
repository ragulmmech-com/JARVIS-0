const fs = require('fs');

let code = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');

const safetyLogic = `
  // Filter out system files like .DS_Store or Thumbs.db
  let validFiles = files.filter(f => !f.name.startsWith(".") && f.name !== "Thumbs.db");

  // SAFETY LIMIT: Prevent DOM & Memory crashes from massive folder uploads
  const MAX_FILES = 20;
  if (validFiles.length > MAX_FILES) {
    if (typeof window !== "undefined") {
      alert(\`⚠️ SAFETY LIMIT REACHED: You attempted to upload \${validFiles.length} files. To prevent memory crash, J.A.R.V.I.S. will only process the first \${MAX_FILES} files.\`);
    }
    validFiles = validFiles.slice(0, MAX_FILES);
  }

  const results: MediaAttachment[] = [];
  let totalSizeProcessed = 0;
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB max total

  // Process files in batches
  for (const file of validFiles) {
    try {
      if (totalSizeProcessed + file.size > MAX_TOTAL_SIZE) {
         if (typeof window !== "undefined") alert("⚠️ Max upload size limit (100MB) reached. Remaining files skipped.");
         break;
      }
      
      const MAX_SINGLE_FILE_SIZE = 30 * 1024 * 1024; // 30 MB
      if (file.size > MAX_SINGLE_FILE_SIZE) {
         if (typeof window !== "undefined") alert(\`⚠️ File \${file.name} exceeds the 30MB limit and was skipped.\`);
         continue;
      }

      totalSizeProcessed += file.size;
`;

code = code.replace(
  /\/\/ Filter out system files like \.DS_Store or Thumbs\.db[\s\S]*?\/\/ Process files in batches\s*for \(const file of validFiles\) \{\s*try \{/m,
  safetyLogic
);

fs.writeFileSync('src/lib/mediaUpload.ts', code);
console.log("Updated mediaUpload.ts successfully!");
