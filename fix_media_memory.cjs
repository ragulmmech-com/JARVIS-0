const fs = require('fs');

let code = fs.readFileSync('src/lib/mediaUpload.ts', 'utf8');

const replacement = `
  // Smart filter to aggressively prevent typical folder crashers (node_modules, .git)
  let validFiles = files.filter(f => {
    if (f.name.startsWith(".") && !f.name.endsWith(".env")) return false;
    if (f.name === "Thumbs.db") return false;
    
    // Check path for massive blackhole folders
    const path = (f as any).webkitRelativePath || "";
    if (path.includes("node_modules/") || path.includes(".git/") || path.includes(".next/") || path.includes("dist/") || path.includes("build/")) {
      return false;
    }
    return true;
  });

  const results: MediaAttachment[] = [];
  let totalSizeProcessed = 0;
  let totalTextSize = 0;
  
  // Hard limits to prevent V8 Engine Out-Of-Memory (OOM) crashes
  const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1 GB max physical total
  const MAX_TEXT_MEMORY = 6 * 1024 * 1024; // 6 MB max raw text (Gemini 2M token limit)

  // Sort files so important code/text files are processed first before hitting memory limits
  validFiles.sort((a, b) => {
    const aIsText = isTextFile(a) ? -1 : 1;
    const bIsText = isTextFile(b) ? -1 : 1;
    return aIsText - bIsText;
  });

  // Process files in batches to allow garbage collection and UI painting
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    try {
      if (totalSizeProcessed + file.size > MAX_TOTAL_SIZE) {
         if (typeof window !== "undefined") console.warn("Max upload size limit (1GB) reached. Remaining files skipped.");
         break;
      }
      
      const MAX_SINGLE_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
      if (file.size > MAX_SINGLE_FILE_SIZE) {
         if (typeof window !== "undefined") console.warn(\`File \${file.name} exceeds single file limit.\`);
         continue;
      }

      totalSizeProcessed += file.size;
`;

code = code.replace(
  /\/\/ Filter out system files like \.DS_Store or Thumbs\.db[\s\S]*?totalSizeProcessed \+= file\.size;/m,
  replacement
);

// We also need to update the text reading logic to prevent massive string allocation crashes
const textReadLogic = `
      if (isImg) {
        if (file.size > 800 * 1024) {
          url = await compressImageFile(file, 1600, 0.85);
        } else {
          url = await readFileAsDataUrl(file);
        }
      } else if (isText) {
        if (totalTextSize > MAX_TEXT_MEMORY) {
            extractedText = "// [TRUNCATED]: J.A.R.V.I.S. Memory protection enabled. Max context length reached.";
            url = ""; 
        } else {
            extractedText = await readFileAsText(file);
            totalTextSize += extractedText.length;
            if (extractedText.length > 1024 * 1024) { // 1MB text limit per file
                extractedText = extractedText.substring(0, 1024 * 1024) + "\n// [TRUNCATED] File too large.";
            }
            // Do NOT generate dataUrl for huge text files to save base64 memory
            url = ""; 
        }
      } else {
        // If it's a huge binary/video file, DO NOT load it into base64 if it's > 20MB (Gemini inline data limit)
        if (file.size > 20 * 1024 * 1024) {
            console.warn(\`Binary file \${file.name} exceeds 20MB base64 limit, skipping dataUrl to prevent crash.\`);
            url = ""; 
        } else {
            url = await readFileAsDataUrl(file);
        }
      }
`;

code = code.replace(
  /if \(isImg\) \{[\s\S]*?url = await readFileAsDataUrl\(file\);\s*\}/m,
  textReadLogic
);


fs.writeFileSync('src/lib/mediaUpload.ts', code);
console.log("Updated memory protection logic!");
