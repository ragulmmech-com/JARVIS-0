import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Download,
  FileText,
  FileCode,
  Presentation,
  ExternalLink,
  Check,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Layers
} from "lucide-react";
import {
  BookData,
  exportBookAsDocx,
  exportBookAsPdf,
  exportBookAsPptx,
  exportBookAsTxt
} from "../lib/bookExporter";

interface BookDownloadCardProps {
  book: BookData;
  className?: string;
}

export const BookDownloadCard: React.FC<BookDownloadCardProps> = ({
  book,
  className = ""
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const handleDownload = async (format: "pdf" | "docx" | "pptx" | "txt") => {
    try {
      setDownloadingFormat(format);
      if (format === "docx") {
        await exportBookAsDocx(book);
      } else if (format === "pptx") {
        await exportBookAsPptx(book);
      } else if (format === "pdf") {
        await exportBookAsPdf(book);
      } else if (format === "txt") {
        exportBookAsTxt(book);
      }
      setDownloadedFormat(format);
      setTimeout(() => setDownloadedFormat(null), 3000);
    } catch (err) {
      console.error("Book download failed:", err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  useEffect(() => {
    const onAutoDownload = (e: any) => {
      const format = e.detail?.format || "pdf";
      handleDownload(format);
    };
    window.addEventListener("jarvis-download-book", onAutoDownload);
    return () => window.removeEventListener("jarvis-download-book", onAutoDownload);
  }, [book]);

  const cleanTitle = book.title || "Book Document";
  const cleanAuthor = book.author || "Author";
  const cleanGenre = book.genre || "Literature & Research";
  const cleanPrice = book.price || "Free Public Domain / Open Access";
  const cleanSource = book.legalSource || "Project Gutenberg / Tamil Virtual Academy";
  const isFree = book.freeAvailable !== false;

  return (
    <div
      className={`my-3 p-4 rounded-xl bg-gradient-to-br from-[#051326] via-[#091b33] to-[#040f1d] border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-white font-sans ${className}`}
    >
      {/* Top Banner: Status & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>J.A.R.V.I.S. BOOK REPOSITORY &amp; DOWNLOAD CENTER</span>
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              Online Availability Verified • Legal Direct Export
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {isFree ? "100% Free Available" : "Commercial Edition"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            <DollarSign className="w-3 h-3 text-cyan-400" />
            {cleanPrice}
          </span>
        </div>
      </div>

      {/* Book Metadata Overview */}
      <div className="mb-3.5">
        <h3 className="text-base md:text-lg font-bold text-cyan-100 flex items-center gap-2 mb-1">
          <span>{cleanTitle}</span>
        </h3>
        <p className="text-xs text-gray-300 mb-2">
          <span className="text-cyan-400 font-mono">எழுத்தாளர் / Author:</span>{" "}
          <span className="font-semibold text-white">{cleanAuthor}</span> •{" "}
          <span className="text-cyan-400 font-mono">வகை / Genre:</span> {cleanGenre}
        </p>
        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>சட்டப்பூர்வ ஆதாரம் / Source:</span>
          <span className="text-cyan-300 font-medium">{cleanSource}</span>
        </div>
      </div>

      {/* Download Action Matrix */}
      <div className="pt-2 border-t border-cyan-500/20">
        <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>பதிவிறக்க வடிவங்கள் / DIRECT DOWNLOAD FORMATS:</span>
          {downloadedFormat && (
            <span className="text-emerald-400 font-mono flex items-center gap-1 text-[11px] animate-fadeIn">
              <Check className="w-3 h-3" /> {downloadedFormat.toUpperCase()} பதிவிறக்கம் செய்யப்பட்டது!
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* PDF Download Button */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("pdf")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 text-red-200 text-xs font-semibold shadow-md transition-all cursor-pointer group disabled:opacity-50"
            title="Download formatted printable PDF edition with chapters"
          >
            <FileText className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
            <span>PDF (.pdf)</span>
            <Download className="w-3 h-3 opacity-60 ml-auto" />
          </button>

          {/* Word (DOCX) Download Button */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("docx")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 hover:border-blue-400 text-blue-200 text-xs font-semibold shadow-md transition-all cursor-pointer group disabled:opacity-50"
            title="Download Microsoft Word (.docx) document"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Word (.docx)</span>
            <Download className="w-3 h-3 opacity-60 ml-auto" />
          </button>

          {/* Presentation (PPTX) Download Button */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("pptx")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 hover:border-amber-400 text-amber-200 text-xs font-semibold shadow-md transition-all cursor-pointer group disabled:opacity-50"
            title="Download PowerPoint (.pptx) presentation slide deck"
          >
            <Presentation className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>PPT (.pptx)</span>
            <Download className="w-3 h-3 opacity-60 ml-auto" />
          </button>

          {/* Plain Text (TXT) Download Button */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload("txt")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/60 hover:border-slate-500 text-slate-200 text-xs font-semibold shadow-md transition-all cursor-pointer group disabled:opacity-50"
            title="Download clean UTF-8 text file with BOM"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
            <span>Text (.txt)</span>
            <Download className="w-3 h-3 opacity-60 ml-auto" />
          </button>
        </div>

        {/* Read Online Link if available */}
        {book.sourceUrl && (
          <div className="mt-2.5 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">டிஜிட்டல் நூலகத்தில் நேரடியாக படிக்க:</span>
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-white flex items-center gap-1 font-mono font-medium underline"
            >
              <span>{cleanSource} இணையதளத்தில் திற</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
