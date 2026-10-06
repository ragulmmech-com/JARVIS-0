import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import { Copy, Check, Terminal, Sigma } from "lucide-react";
import { InbuiltSmartLink } from "./InbuiltSmartLink";
import { BookDownloadCard } from "./BookDownloadCard";
import { BookData } from "../lib/bookExporter";
import { FileDownloadCard, FileDownloadItem } from "./FileDownloadCard";

interface SmartChatContentProps {
  content: string;
  isUser?: boolean;
  variant?: "user" | "model" | "tactical";
  className?: string;
}

/**
 * Parses plain text to detect both markdown links [Title](URL) and raw URLs (http://, https://, www.),
 * transforming them into interactive InbuiltSmartLink capsules with integrated Copy and Open options.
 */
export const parseTextWithSmartLinks = (
  text: string,
  variant: "user" | "model" | "tactical" = "user"
): React.ReactNode[] => {
  if (!text) return [];

  const combinedRegex = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s\)]+)\)|((?:https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s])/gi;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      const title = match[1];
      const url = match[2];
      elements.push(
        <InbuiltSmartLink key={`link-${match.index}`} href={url} variant={variant}>
          {title}
        </InbuiltSmartLink>
      );
    } else if (match[3]) {
      const url = match[3];
      elements.push(
        <InbuiltSmartLink key={`link-${match.index}`} href={url} variant={variant}>
          {url}
        </InbuiltSmartLink>
      );
    }
    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};

/**
 * Checks if a code block or string is a mathematical formula or LaTeX derivation
 * rather than regular programming code.
 */
const isMathFormulaContent = (language?: string, code?: string): boolean => {
  if (!code) return false;
  const lang = (language || "").toLowerCase().trim();
  if (["math", "latex", "tex", "katex", "equation"].includes(lang)) return true;
  if (["python", "js", "ts", "javascript", "typescript", "bash", "sh", "json", "html", "css", "c", "cpp", "rust", "go", "sql"].includes(lang)) {
    return false;
  }
  const trimmed = code.trim();
  if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) return true;
  return /\\(frac|sqrt|sum|int|theta|delta|Delta|Theta|alpha|beta|gamma|omega|sigma|pi|mu|lambda|bar|vec|partial|times|cdot|approx|pm|ne|le|ge|begin|end)\b/.test(trimmed);
};

/**
 * Notebook-Style Equation Card
 * Renders mathematical formulas like a clean textbook/notebook page,
 * ensuring complete readability without monospace/code artifacts.
 */
const NotebookFormulaCard: React.FC<{ formula: string; title?: string }> = ({
  formula,
  title = "FORMULA NOTEBOOK / சூத்திரம்"
}) => {
  const [copied, setCopied] = useState(false);

  // Clean raw wrapper tokens if present
  const cleanTex = React.useMemo(() => {
    return formula
      .replace(/^(\$\$|\\\[)/, "")
      .replace(/(\$\$|\\\])$/, "")
      .trim();
  }, [formula]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanTex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHtml = React.useMemo(() => {
    try {
      return katex.renderToString(cleanTex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [cleanTex]);

  return (
    <div className="relative my-3.5 rounded-xl border border-cyan-500/35 bg-gradient-to-br from-[#020d1c] via-[#041630] to-[#010915] overflow-hidden shadow-[0_6px_22px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#051833]/90 border-b border-cyan-500/25 text-[11px] font-mono text-cyan-300">
        <div className="flex items-center gap-1.5">
          <span className="p-0.5 rounded bg-cyan-500/20 text-cyan-300">
            <Sigma className="w-3.5 h-3.5" />
          </span>
          <span className="uppercase tracking-wider font-semibold text-cyan-200">{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-[10px] transition-colors cursor-pointer"
          title="Copy formula"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "COPIED" : "COPY"}</span>
        </button>
      </div>
      <div className="p-3.5 md:p-4 overflow-x-auto text-center scrollbar-thin">
        {renderedHtml ? (
          <div
            className="inline-block text-cyan-50 text-base md:text-lg select-text"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <div className="font-sans text-cyan-100 text-sm select-text">{cleanTex}</div>
        )}
      </div>
    </div>
  );
};

const CodeBlockComponent: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  // If the block is actually a mathematical equation or formula, render as Notebook Equation Card!
  if (isMathFormulaContent(language, value)) {
    return <NotebookFormulaCard formula={value} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg border border-cyan-500/30 bg-[#020a14] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#051326] border-b border-cyan-500/20 text-[11px] font-mono text-cyan-300">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider font-semibold">{language || "CODE"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-[10px] transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "COPIED" : "COPY"}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[13px] font-mono text-cyan-50 leading-relaxed scrollbar-thin">
        <code>{value}</code>
      </pre>
    </div>
  );
};

/**
 * Preprocess math syntax so KaTeX and remark-math parse all equation variations:
 * 1. Convert \\[ ... \\] to $$ ... $$
 * 2. Convert \\( ... \\) to $ ... $
 * 3. Ensure $$ display blocks have clean line breaks
 */
const preprocessMarkdownMath = (text: string): string => {
  if (!text) return "";
  let processed = text;

  // Convert LaTeX display delimiters \[ ... \] to $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // Convert LaTeX inline delimiters \( ... \) to $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => {
    return `$${formula.trim()}$`;
  });

  return processed;
};

export const SmartChatContent: React.FC<SmartChatContentProps> = ({
  content,
  isUser = false,
  variant,
  className = ""
}) => {
  const effectiveVariant = variant || (isUser ? "user" : "model");

  // Extract explicit or heuristic book metadata
  const bookData = React.useMemo<BookData | null>(() => {
    if (isUser) return null;
    const raw = content || "";

    // 1. Explicit [BOOK_META: {...}] tag
    const metaMatch = raw.match(/\[BOOK_META:\s*({[\s\S]*?})\]/);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        const strippedText = raw.replace(/\[BOOK_META:\s*({[\s\S]*?})\]/g, "").replace(/\[ACTION:\s*[^\]]+\]/g, "").trim();
        return {
          title: parsed.title || "Book Document",
          author: parsed.author || "Classical Author",
          genre: parsed.genre || "Literature & Research",
          price: parsed.price || "Free Public Domain / Open Reading",
          freeAvailable: parsed.freeAvailable !== false,
          legalSource: parsed.source || "Project Gutenberg / Tamil Virtual Academy",
          sourceUrl: parsed.sourceUrl || "https://www.gutenberg.org",
          summary: strippedText,
          fullText: strippedText
        };
      } catch (e) {
        // Fall through to heuristic
      }
    }

    // 2. Heuristic detection for books in model response
    const hasBookKeywords = /(புத்தகம்|புத்தகங்கள்|நூல்|நூல்கள்|ஆசிரியர்|ஆத்தர்|Project Gutenberg|Tamil Virtual Academy|Open Library|A Brief History of Time|பொன்னியின் செல்வன்|திருக்குறள்|புறநானூறு|Author:|Book Title|Book Summary)/i.test(raw);
    const mentionsDownloadOrReading = /(download|டவுன்லோட்|பதிவிறக்கம்|pdf|docx|free book|இலவசமாக|படிக்கலாம்|படிப்பதற்கான|Gutenberg|Tamil Virtual Academy|Open Library|Internet Archive)/i.test(raw);

    if (hasBookKeywords && mentionsDownloadOrReading) {
      let title = "Book Document";
      const titleMatch = raw.match(/(?:புத்தகம்|நூல்|Book Title|தலைப்பு|Title):\s*\*?([^\n*]+)\*?/i) ||
                         raw.match(/\*\*([^\n*]+)\*\*\s*(?:புத்தகம்|நூல்|என்ற நூல்|என்ற புத்தகம்)/i);
      if (titleMatch) title = titleMatch[1].trim();

      let author = "Classical Author";
      const authorMatch = raw.match(/(?:ஆசிரியர்|எழுத்தாளர்|Author|ஆத்தர்):\s*\*?([^\n*]+)\*?/i);
      if (authorMatch) author = authorMatch[1].trim();

      let price = "Free Public Domain / Open Reading";
      if (/விலை|price|₹|\$/i.test(raw)) {
        const priceMatch = raw.match(/(?:விலை|price|கட்டணம்):\s*\*?([^\n*]+)\*?/i);
        if (priceMatch) price = priceMatch[1].trim();
      }

      let source = "Project Gutenberg / Tamil Virtual Academy";
      let sourceUrl = "https://www.gutenberg.org";
      if (/tamilvu\.org|தமிழ் இணையக் கல்விக்கழகம்/i.test(raw)) {
        source = "Tamil Virtual Academy (தமிழ் இணையக் கல்விக்கழகம்)";
        sourceUrl = "https://www.tamilvu.org/library";
      } else if (/gutenberg\.org|Project Gutenberg/i.test(raw)) {
        source = "Project Gutenberg";
        sourceUrl = "https://www.gutenberg.org";
      } else if (/openlibrary\.org|Open Library/i.test(raw)) {
        source = "Open Library";
        sourceUrl = "https://openlibrary.org";
      } else if (/archive\.org|Internet Archive/i.test(raw)) {
        source = "Internet Archive";
        sourceUrl = "https://archive.org";
      }

      const stripped = raw.replace(/\[ACTION:\s*[^\]]+\]/g, "").trim();
      return {
        title,
        author,
        genre: "Literature & Research",
        price,
        freeAvailable: true,
        legalSource: source,
        sourceUrl,
        summary: stripped,
        fullText: stripped
      };
    }

    return null;
  }, [content, isUser]);

  // Detect direct downloadable files or [ACTION: DOWNLOAD_FILE: ...] directives
  const detectedFiles = React.useMemo<FileDownloadItem[]>(() => {
    if (!content) return [];
    const items: FileDownloadItem[] = [];

    // 1. [ACTION: DOWNLOAD_FILE: url="..." filename="..."]
    const actionRegex = /\[ACTION:\s*DOWNLOAD_FILE:\s*url="([^"]+)"(?:\s*filename="([^"]+)")?\]/gi;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(content)) !== null) {
      const url = actionMatch[1];
      const filename = actionMatch[2];
      if (url && !items.some(i => i.url === url)) {
        items.push({
          url,
          filename,
          title: filename || "Downloadable Resource"
        });
      }
    }

    // 2. URLs in text ending with known file extensions
    const fileUrlRegex = /((?:https?:\/\/)[^\s\)]+\.(?:pdf|epub|mobi|docx?|xlsx?|pptx?|txt|zip|rar|7z|mp4|mp3|mkv|wav|jpg|jpeg|png|webp|apk|exe)(?:\?[^\s\)]*)?)/gi;
    let urlMatch;
    while ((urlMatch = fileUrlRegex.exec(content)) !== null) {
      const url = urlMatch[1];
      if (!items.some(i => i.url === url)) {
        const cleanName = url.split("/").pop()?.split("?")[0] || "file";
        items.push({
          url,
          filename: decodeURIComponent(cleanName),
          title: decodeURIComponent(cleanName)
        });
      }
    }

    return items;
  }, [content]);

  // Strip internal action directives like [ACTION: OPEN_MEMORY] and [BOOK_META: ...] and preprocess math
  const cleanContent = React.useMemo(() => {
    const stripped = (content || "")
      .replace(/\[ACTION:\s*[^\]]+\]/g, "")
      .replace(/\[BOOK_META:\s*({[\s\S]*?})\]/g, "")
      .trim();
    return preprocessMarkdownMath(stripped);
  }, [content]);

  if (!cleanContent) return null;

  // For user messages: preserve exact formatting, line breaks, and convert links to smart links
  if (isUser) {
    return (
      <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
        {parseTextWithSmartLinks(cleanContent, effectiveVariant)}
      </div>
    );
  }

  return (
    <div className={`markdown-body font-sans leading-relaxed text-[#e0f2fe] ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ children }) => (
            <div className="w-full overflow-x-auto my-3 border border-cyan-500/20 rounded">
              <table className="min-w-full divide-y divide-cyan-500/30 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          svg: ({ node: _n, ...props }) => <svg {...props} />,
          a: ({ href, children }) => (
            <InbuiltSmartLink href={href || ""} variant={effectiveVariant}>
              {children}
            </InbuiltSmartLink>
          ),
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
          code: ({ node: _n, className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && typeof children === "string" && !children.includes("\n");

            if (isInline) {
              // If an inline code snippet looks like a LaTeX math symbol (e.g. `\theta` or `\Delta`), render as KaTeX
              const trimmed = codeString.trim();
              if (
                trimmed.startsWith("\\") ||
                /\\(frac|sqrt|theta|delta|Delta|Theta|alpha|beta|gamma|omega|sigma|pi|mu|bar)\b/.test(trimmed)
              ) {
                try {
                  const html = katex.renderToString(trimmed, { displayMode: false, throwOnError: false });
                  return (
                    <span
                      className="inline-block px-1 py-0.5 align-baseline"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch {
                  // Fallback to normal inline code
                }
              }

              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-200 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlockComponent language={match ? match[1] : ""} value={codeString} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {cleanContent}
      </Markdown>

      {/* Interactive Book Repository & Download Center Card */}
      {bookData && (
        <BookDownloadCard book={bookData} />
      )}

      {/* Universal File & Media Download Cards */}
      {detectedFiles.map((fileItem, idx) => (
        <FileDownloadCard key={`file-${idx}-${fileItem.url}`} item={fileItem} />
      ))}
    </div>
  );
};

