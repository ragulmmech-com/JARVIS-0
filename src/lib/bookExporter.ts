import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface BookChapter {
  title: string;
  content: string;
}

export interface BookData {
  title: string;
  author: string;
  genre?: string;
  price?: string;
  freeAvailable?: boolean;
  legalSource?: string;
  sourceUrl?: string;
  summary: string;
  chapters?: BookChapter[];
  fullText?: string;
}

const escapeXml = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Trigger browser file download from Blob or data URL
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * 1. Export Book as formatted Microsoft Word Document (.docx)
 * Supports full Tamil unicode, bold headings, metadata table, and chapters.
 */
export async function exportBookAsDocx(book: BookData): Promise<void> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const cleanTitle = book.title || "Book Document";
  const cleanAuthor = book.author || "Unknown Author";
  const cleanGenre = book.genre || "General Literature";
  const cleanPrice = book.price || "Free Open Access";
  const cleanSource = book.legalSource || "Project Gutenberg / Tamil Virtual Academy";

  // Build document body paragraphs
  const contentLines = (book.fullText || book.summary || "").split("\n");
  const paragraphsXml = contentLines
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`;
      }
      if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
        const hText = trimmed.replace(/^#+\s*/, "");
        return `<w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:sz w:val="30"/>
              <w:color w:val="0D9488"/>
            </w:rPr>
            <w:t>${escapeXml(hText)}</w:t>
          </w:r>
        </w:p>`;
      }
      return `<w:p>
        <w:pPr>
          <w:spacing w:after="140" w:line="320" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:sz w:val="24"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`;
    })
    .join("");

  // Additional chapters if provided
  let chaptersXml = "";
  if (book.chapters && book.chapters.length > 0) {
    chaptersXml = book.chapters
      .map(
        ch => `
      <w:p>
        <w:pPr>
          <w:spacing w:before="360" w:after="180"/>
          <w:pageBreakBefore/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="34"/>
            <w:color w:val="0369A1"/>
          </w:rPr>
          <w:t>${escapeXml(ch.title)}</w:t>
        </w:r>
      </w:p>
      ${ch.content
        .split("\n")
        .map(
          l => `
        <w:p>
          <w:pPr><w:spacing w:after="140" w:line="320" w:lineRule="auto"/></w:pPr>
          <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(l)}</w:t></w:r>
        </w:p>`
        )
        .join("")}
    `
      )
      .join("");
  }

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Title -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="480" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="48"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>${escapeXml(cleanTitle)}</w:t>
      </w:r>
    </w:p>

    <!-- Subtitle / Author -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="26"/>
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t>Author: ${escapeXml(cleanAuthor)}</w:t>
      </w:r>
    </w:p>

    <!-- Metadata Capsule -->
    <w:p>
      <w:pPr>
        <w:spacing w:after="240"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="6" w:space="4" w:color="06B6D4"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="0891B2"/></w:rPr>
        <w:t>GENRE: ${escapeXml(cleanGenre)} | MARKET STATUS: ${escapeXml(cleanPrice)} | REPOSITORY: ${escapeXml(cleanSource)}</w:t>
      </w:r>
    </w:p>

    <!-- Body & Chapters -->
    ${paragraphsXml}
    ${chaptersXml}

    <!-- Footer Note -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="480"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="94A3B8"/></w:rPr>
        <w:t>Generated via J.A.R.V.I.S. High-Fidelity Book & Research Synthesis Core</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", docXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });

  const sanitizedFileName = cleanTitle.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 50);
  triggerDownload(blob, `${sanitizedFileName}.docx`);
}

/**
 * 2. Export Book as Microsoft PowerPoint Presentation (.pptx)
 * Generates an executive slide deck summarizing key themes, characters, and concepts.
 */
export async function exportBookAsPptx(book: BookData): Promise<void> {
  const zip = new JSZip();

  const cleanTitle = book.title || "Book Analysis Presentation";
  const cleanAuthor = book.author || "Author";
  const cleanGenre = book.genre || "General Literature";
  const cleanPrice = book.price || "Free Public Domain";

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  zip.file(
    "ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`
  );

  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    <p:sldId id="257" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </p:sldIdLst>
</p:presentation>`
  );

  // Slide 1: Cover Title Slide
  zip.file(
    "ppt/slides/slide1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="1828800"/><a:ext cx="7772400" cy="2000000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/><a:lstStyle/>
          <a:p><a:r><a:rPr lang="en-US" sz="4400" b="1"/><a:t>${escapeXml(cleanTitle)}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>By ${escapeXml(cleanAuthor)}</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1800" i="1"/><a:t>${escapeXml(cleanGenre)} • ${escapeXml(cleanPrice)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  // Slide 2: Executive Summary & Overview
  const summarySnippet = (book.summary || "").slice(0, 300);
  zip.file(
    "ppt/slides/slide2.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="SlideTitle"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="600000"/><a:ext cx="7772400" cy="800000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/><a:lstStyle/>
          <a:p><a:r><a:rPr lang="en-US" sz="3600" b="1"/><a:t>Executive Summary &amp; Overview</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="1600000"/><a:ext cx="7772400" cy="3600000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/><a:lstStyle/>
          <a:p><a:r><a:rPr lang="en-US" sz="2000"/><a:t>${escapeXml(summarySnippet)}...</a:t></a:r></a:p>
          <a:p><a:r><a:rPr lang="en-US" sz="1600" b="1"/><a:t>Legal Access: ${escapeXml(book.legalSource || "Open Public Repositories")}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  );

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });

  const sanitizedFileName = cleanTitle.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 50);
  triggerDownload(blob, `${sanitizedFileName}_Presentation.pptx`);
}

/**
 * 3. Export Book as High-Fidelity Printable PDF
 * Renders complete Unicode text (including Tamil script, bold headers, and clean page layouts)
 * into a dedicated printable window that can be saved directly as a PDF or printed.
 */
export async function exportBookAsPdf(book: BookData): Promise<void> {
  const cleanTitle = book.title || "Book Document";
  const cleanAuthor = book.author || "Unknown Author";
  const cleanGenre = book.genre || "Literature";
  const cleanPrice = book.price || "Free Public Domain";
  const cleanSource = book.legalSource || "Project Gutenberg / Tamil Virtual Academy";

  const paragraphsHtml = (book.fullText || book.summary || "")
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "<br/>";
      if (trimmed.startsWith("###")) {
        return `<h3 style="color: #0d9488; margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.25rem;">${escapeXml(
          trimmed.replace(/^###\s*/, "")
        )}</h3>`;
      }
      if (trimmed.startsWith("##")) {
        return `<h2 style="color: #0369a1; margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">${escapeXml(
          trimmed.replace(/^##\s*/, "")
        )}</h2>`;
      }
      if (trimmed.startsWith("#")) {
        return `<h1 style="color: #0f172a; margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.85rem;">${escapeXml(
          trimmed.replace(/^#\s*/, "")
        )}</h1>`;
      }
      return `<p style="margin-bottom: 1rem; line-height: 1.7; font-size: 1.05rem; color: #1e293b;">${escapeXml(
        line
      )}</p>`;
    })
    .join("");

  const chaptersHtml = (book.chapters || [])
    .map(
      ch => `
      <div style="page-break-before: always; margin-top: 2rem;">
        <h2 style="color: #0369a1; font-size: 1.5rem; border-bottom: 2px solid #06b6d4; padding-bottom: 0.5rem;">${escapeXml(
          ch.title
        )}</h2>
        ${ch.content
          .split("\n")
          .map(
            l =>
              `<p style="margin-bottom: 1rem; line-height: 1.7; font-size: 1.05rem; color: #1e293b;">${escapeXml(
                l
              )}</p>`
          )
          .join("")}
      </div>`
    )
    .join("");

  const printHtml = `<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(cleanTitle)} - J.A.R.V.I.S. Book Edition</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Mukta+Malar:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
    body {
      font-family: 'Mukta Malar', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 2.5rem 3rem;
      color: #0f172a;
      background: #ffffff;
    }
    .cover-container {
      text-align: center;
      padding: 3rem 1rem 2.5rem;
      border-bottom: 2px solid #06b6d4;
      margin-bottom: 2.5rem;
    }
    .book-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.75rem;
    }
    .book-author {
      font-size: 1.3rem;
      color: #475569;
      font-style: italic;
      margin: 0 0 1.5rem;
    }
    .badge-bar {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      background: #ecfeff;
      color: #0891b2;
      border: 1px solid #a5f3fc;
    }
    .footer {
      margin-top: 3rem;
      text-align: center;
      font-size: 0.8rem;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }
    @media print {
      body { padding: 1.5cm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: fixed; top: 1rem; right: 1rem; z-index: 1000; display: flex; gap: 0.5rem;">
    <button onclick="window.print()" style="background: #0891b2; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(8,145,178,0.3);">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="cover-container">
    <div class="book-title">${escapeXml(cleanTitle)}</div>
    <div class="book-author">By ${escapeXml(cleanAuthor)}</div>
    <div class="badge-bar">
      <span class="badge">📖 ${escapeXml(cleanGenre)}</span>
      <span class="badge">💰 ${escapeXml(cleanPrice)}</span>
      <span class="badge">🏛️ ${escapeXml(cleanSource)}</span>
    </div>
  </div>

  <div class="content-body">
    ${paragraphsHtml}
    ${chaptersHtml}
  </div>

  <div class="footer">
    Published via J.A.R.V.I.S. High-Fidelity Research &amp; Book Synthesis Engine • ${new Date().toLocaleDateString()}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  // Open printable window and trigger print-to-pdf
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    // If popups blocked, download as HTML/PDF data blob
    const blob = new Blob([printHtml], { type: "text/html;charset=utf-8" });
    const sanitizedFileName = cleanTitle.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 50);
    triggerDownload(blob, `${sanitizedFileName}_Printable_Book.html`);
  }
}

/**
 * 4. Export Book as clean UTF-8 plain text (.txt) with BOM for universal reader compatibility
 */
export function exportBookAsTxt(book: BookData): void {
  const cleanTitle = book.title || "Book";
  const cleanAuthor = book.author || "Unknown";
  const cleanPrice = book.price || "Free";
  const cleanSource = book.legalSource || "Open Public Domain";

  let body = `========================================================\n`;
  body += `${cleanTitle}\n`;
  body += `Author: ${cleanAuthor}\n`;
  body += `Genre: ${book.genre || "Literature"} | Price: ${cleanPrice}\n`;
  body += `Legal Source: ${cleanSource}\n`;
  body += `========================================================\n\n`;

  body += `[SUMMARY / மேலோட்டம்]\n${book.summary}\n\n`;

  if (book.chapters && book.chapters.length > 0) {
    for (const ch of book.chapters) {
      body += `\n--------------------------------------------------------\n`;
      body += `CHAPTER: ${ch.title}\n`;
      body += `--------------------------------------------------------\n\n`;
      body += `${ch.content}\n\n`;
    }
  } else if (book.fullText) {
    body += `\n[BOOK CONTENT]\n${book.fullText}\n`;
  }

  // Prepend UTF-8 BOM so Windows Notepad and text readers decode Tamil flawlessly
  const bom = "\uFEFF";
  const blob = new Blob([bom + body], { type: "text/plain;charset=utf-8" });
  const sanitizedFileName = cleanTitle.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 50);
  triggerDownload(blob, `${sanitizedFileName}.txt`);
}
