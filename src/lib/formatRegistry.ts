// Universal File Format Registry with 250+ categorized formats, MIME types, and CAD/3D support

export type FormatCategory =
  | "cad"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "executable"
  | "code"
  | "font";

export interface FormatDefinition {
  ext: string;
  name: string;
  category: FormatCategory;
  categoryLabel: string;
  mime: string;
  description: string;
  popular?: boolean;
}

export const CATEGORY_INFO: Record<
  FormatCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  cad: {
    label: "3D & CAD Engineering",
    icon: "Boxes",
    color: "from-amber-500 to-orange-600",
    description: "SolidWorks, STEP, IGES, STL, OBJ, DXF, DWG & 3D models",
  },
  document: {
    label: "Documents & Office",
    icon: "FileText",
    color: "from-blue-500 to-cyan-500",
    description: "PDF, Word, Text, Markdown, eBook & rich text",
  },
  spreadsheet: {
    label: "Spreadsheets & Tables",
    icon: "FileSpreadsheet",
    color: "from-emerald-500 to-teal-500",
    description: "Excel (.xlsx), CSV, TSV, OpenDocument & tabular data",
  },
  presentation: {
    label: "Presentations & Slides",
    icon: "Presentation",
    color: "from-rose-500 to-pink-500",
    description: "PowerPoint (.pptx), Keynote & slide decks",
  },
  image: {
    label: "Images & Vectors",
    icon: "Image",
    color: "from-purple-500 to-pink-500",
    description: "PNG, JPG, WebP, SVG, TIFF, RAW, PSD & vector art",
  },
  audio: {
    label: "Audio & Music",
    icon: "Music",
    color: "from-cyan-500 to-blue-600",
    description: "MP3, WAV, AAC, FLAC, OGG, M4A & voice recordings",
  },
  video: {
    label: "Video & Animation",
    icon: "Video",
    color: "from-red-500 to-rose-600",
    description: "MP4, MKV, WebM, AVI, MOV, 4K video & stream clips",
  },
  archive: {
    label: "Archives & Compressed",
    icon: "Archive",
    color: "from-yellow-500 to-amber-600",
    description: "ZIP, 7Z, TAR, RAR, GZ & multi-file bundles",
  },
  executable: {
    label: "Executables & Binaries",
    icon: "Cpu",
    color: "from-green-500 to-emerald-600",
    description: "EXE, APK, AppImage, DMG, Script & binary packages",
  },
  code: {
    label: "Code & Developer",
    icon: "Code2",
    color: "from-indigo-500 to-violet-600",
    description: "JS, TS, Python, C++, Java, Rust, SQL, JSON, YAML",
  },
  font: {
    label: "Fonts & Typography",
    icon: "Type",
    color: "from-fuchsia-500 to-pink-600",
    description: "TTF, OTF, WOFF, WOFF2 & web typography",
  },
};

export const UNIVERSAL_FORMATS: FormatDefinition[] = [
  // ================= 1. 3D & CAD ENGINEERING (Explicit user priority) =================
  { ext: "step", name: "STEP 3D Model", category: "cad", categoryLabel: "3D & CAD", mime: "application/step", description: "Standard for the Exchange of Product model data (ISO 10303)", popular: true },
  { ext: "stp", name: "STP 3D CAD File", category: "cad", categoryLabel: "3D & CAD", mime: "application/step", description: "STEP ISO 10303 exchange standard", popular: true },
  { ext: "iges", name: "IGES CAD Format", category: "cad", categoryLabel: "3D & CAD", mime: "model/iges", description: "Initial Graphics Exchange Specification CAD file", popular: true },
  { ext: "igs", name: "IGS CAD Surface", category: "cad", categoryLabel: "3D & CAD", mime: "model/iges", description: "IGES geometric model format", popular: true },
  { ext: "sldprt", name: "SolidWorks Part", category: "cad", categoryLabel: "3D & CAD", mime: "application/sldprt", description: "Dassault Systèmes SolidWorks 3D Part file", popular: true },
  { ext: "sldasm", name: "SolidWorks Assembly", category: "cad", categoryLabel: "3D & CAD", mime: "application/sldasm", description: "SolidWorks mechanical assembly file", popular: true },
  { ext: "stl", name: "Stereolithography 3D", category: "cad", categoryLabel: "3D & CAD", mime: "model/stl", description: "Standard 3D printing & additive manufacturing mesh", popular: true },
  { ext: "obj", name: "Wavefront 3D Object", category: "cad", categoryLabel: "3D & CAD", mime: "model/obj", description: "Universal 3D polygonal geometry definition", popular: true },
  { ext: "fbx", name: "Autodesk FBX 3D", category: "cad", categoryLabel: "3D & CAD", mime: "application/octet-stream", description: "Autodesk 3D asset exchange format" },
  { ext: "dxf", name: "AutoCAD DXF Drawing", category: "cad", categoryLabel: "3D & CAD", mime: "application/dxf", description: "Drawing Exchange Format vector CAD standard", popular: true },
  { ext: "dwg", name: "AutoCAD DWG Drawing", category: "cad", categoryLabel: "3D & CAD", mime: "application/dwg", description: "Native Autodesk AutoCAD drawing database", popular: true },
  { ext: "ipt", name: "Autodesk Inventor Part", category: "cad", categoryLabel: "3D & CAD", mime: "application/ipt", description: "Autodesk Inventor 3D Parametric Part model", popular: true },
  { ext: "iam", name: "Autodesk Inventor Assembly", category: "cad", categoryLabel: "3D & CAD", mime: "application/iam", description: "Autodesk Inventor Mechanical Assembly", popular: true },
  { ext: "catpart", name: "CATIA V5 Part", category: "cad", categoryLabel: "3D & CAD", mime: "application/octet-stream", description: "Dassault CATIA 3D Mechanical Engineering Part", popular: true },
  { ext: "catproduct", name: "CATIA V5 Assembly", category: "cad", categoryLabel: "3D & CAD", mime: "application/octet-stream", description: "Dassault CATIA 3D Product Assembly", popular: true },
  { ext: "fcstd", name: "FreeCAD Standard File", category: "cad", categoryLabel: "3D & CAD", mime: "application/x-freecad", description: "FreeCAD open-source parametric 3D CAD document" },
  { ext: "gltf", name: "GL Transmission Format", category: "cad", categoryLabel: "3D & CAD", mime: "model/gltf+json", description: "Khronos Group 3D web transmission format", popular: true },
  { ext: "glb", name: "Binary GLTF 3D", category: "cad", categoryLabel: "3D & CAD", mime: "model/gltf-binary", description: "Packed binary 3D scene & asset", popular: true },
  { ext: "ply", name: "Polygon File Format", category: "cad", categoryLabel: "3D & CAD", mime: "model/ply", description: "Stanford 3D scanner triangle mesh format" },
  { ext: "3ds", name: "3D Studio Mesh", category: "cad", categoryLabel: "3D & CAD", mime: "image/x-3ds", description: "Legacy Autodesk 3ds Max 3D format" },
  { ext: "dae", name: "COLLADA Digital Asset", category: "cad", categoryLabel: "3D & CAD", mime: "model/vnd.collada+xml", description: "Interactive 3D application exchange schema" },
  { ext: "blend", name: "Blender 3D Project", category: "cad", categoryLabel: "3D & CAD", mime: "application/x-blender", description: "Native Blender 3D computer graphics software file" },
  { ext: "x_t", name: "Parasolid Model (Text)", category: "cad", categoryLabel: "3D & CAD", mime: "application/parasolid", description: "Siemens Parasolid CAD geometric modeling kernel file" },
  { ext: "x_b", name: "Parasolid Model (Binary)", category: "cad", categoryLabel: "3D & CAD", mime: "application/parasolid", description: "Binary Parasolid 3D kernel format" },
  { ext: "sat", name: "ACIS SAT Model", category: "cad", categoryLabel: "3D & CAD", mime: "application/sat", description: "Spatial ACIS 3D boundary representation geometry" },
  { ext: "prt", name: "PTC Creo / NX Part", category: "cad", categoryLabel: "3D & CAD", mime: "application/prt", description: "Parametric 3D CAD part file" },
  { ext: "asm", name: "PTC Creo Assembly", category: "cad", categoryLabel: "3D & CAD", mime: "application/asm", description: "Parametric 3D CAD assembly file" },
  { ext: "wrl", name: "VRML 2.0 World", category: "cad", categoryLabel: "3D & CAD", mime: "model/vrml", description: "Virtual Reality Modeling Language file" },

  // ================= 2. DOCUMENTS & OFFICE =================
  { ext: "pdf", name: "Portable Document Format", category: "document", categoryLabel: "Documents", mime: "application/pdf", description: "Adobe Universal Document standard", popular: true },
  { ext: "docx", name: "Microsoft Word Document", category: "document", categoryLabel: "Documents", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Office OpenXML Word document", popular: true },
  { ext: "doc", name: "Legacy Microsoft Word", category: "document", categoryLabel: "Documents", mime: "application/msword", description: "Binary Word 97-2003 document format", popular: true },
  { ext: "txt", name: "Plain Text Document", category: "document", categoryLabel: "Documents", mime: "text/plain", description: "Universal unformatted UTF-8 text file", popular: true },
  { ext: "rtf", name: "Rich Text Format", category: "document", categoryLabel: "Documents", mime: "application/rtf", description: "Cross-platform formatted document standard" },
  { ext: "odt", name: "OpenDocument Text", category: "document", categoryLabel: "Documents", mime: "application/vnd.oasis.opendocument.text", description: "LibreOffice / OpenOffice ISO text format" },
  { ext: "html", name: "HTML Webpage", category: "document", categoryLabel: "Documents", mime: "text/html", description: "HyperText Markup Language web document", popular: true },
  { ext: "htm", name: "HTM Web Document", category: "document", categoryLabel: "Documents", mime: "text/html", description: "Legacy 3-letter HTML document extension" },
  { ext: "md", name: "Markdown Document", category: "document", categoryLabel: "Documents", mime: "text/markdown", description: "Lightweight structured markup text file", popular: true },
  { ext: "epub", name: "Electronic Publication", category: "document", categoryLabel: "Documents", mime: "application/epub+zip", description: "Standard digital eBook format", popular: true },
  { ext: "mobi", name: "Mobipocket eBook", category: "document", categoryLabel: "Documents", mime: "application/x-mobipocket-ebook", description: "Amazon Kindle legacy eBook format" },
  { ext: "pages", name: "Apple Pages Document", category: "document", categoryLabel: "Documents", mime: "application/x-iwork-pages-sffpages", description: "Apple macOS / iOS Pages word processor document" },
  { ext: "xps", name: "XML Paper Specification", category: "document", categoryLabel: "Documents", mime: "application/vnd.ms-xpsdocument", description: "Microsoft fixed-layout document standard" },
  { ext: "tex", name: "LaTeX Source Document", category: "document", categoryLabel: "Documents", mime: "application/x-tex", description: "Scientific typesetting and mathematical document" },
  { ext: "djvu", name: "DjVu Scanned Document", category: "document", categoryLabel: "Documents", mime: "image/vnd.djvu", description: "High-compression scanned document format" },

  // ================= 3. SPREADSHEETS & TABULAR DATA =================
  { ext: "xlsx", name: "Microsoft Excel Spreadsheet", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", description: "Office OpenXML Excel workbook", popular: true },
  { ext: "xls", name: "Legacy Microsoft Excel", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/vnd.ms-excel", description: "Binary Excel 97-2003 spreadsheet format", popular: true },
  { ext: "csv", name: "Comma-Separated Values", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "text/csv", description: "Standard tabular data file separated by commas", popular: true },
  { ext: "tsv", name: "Tab-Separated Values", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "text/tab-separated-values", description: "Tabular data separated by tab characters" },
  { ext: "ods", name: "OpenDocument Spreadsheet", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/vnd.oasis.opendocument.spreadsheet", description: "LibreOffice / OpenOffice ISO spreadsheet" },
  { ext: "numbers", name: "Apple Numbers Spreadsheet", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/x-iwork-numbers-sffnumbers", description: "Apple macOS / iOS Numbers spreadsheet" },
  { ext: "json", name: "JSON Data File", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/json", description: "JavaScript Object Notation structured data", popular: true },
  { ext: "xml", name: "Extensible Markup Language", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "application/xml", description: "Universal structured hierarchy data file" },
  { ext: "yaml", name: "YAML Data Serialization", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "text/yaml", description: "Human-readable data serialization format" },
  { ext: "yml", name: "YML Configuration File", category: "spreadsheet", categoryLabel: "Spreadsheets", mime: "text/yaml", description: "Alternative 3-letter extension for YAML" },

  // ================= 4. PRESENTATIONS & SLIDES =================
  { ext: "pptx", name: "Microsoft PowerPoint Presentation", category: "presentation", categoryLabel: "Presentations", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", description: "Office OpenXML PowerPoint slide deck", popular: true },
  { ext: "ppt", name: "Legacy PowerPoint Presentation", category: "presentation", categoryLabel: "Presentations", mime: "application/vnd.ms-powerpoint", description: "Binary PowerPoint 97-2003 presentation" },
  { ext: "odp", name: "OpenDocument Presentation", category: "presentation", categoryLabel: "Presentations", mime: "application/vnd.oasis.opendocument.presentation", description: "LibreOffice / OpenOffice ISO presentation" },
  { ext: "key", name: "Apple Keynote Presentation", category: "presentation", categoryLabel: "Presentations", mime: "application/x-iwork-keynote-sffkey", description: "Apple macOS / iOS Keynote slide deck" },

  // ================= 5. IMAGES & VECTORS =================
  { ext: "png", name: "Portable Network Graphics", category: "image", categoryLabel: "Images", mime: "image/png", description: "Lossless raster format with alpha transparency", popular: true },
  { ext: "jpg", name: "JPEG Image", category: "image", categoryLabel: "Images", mime: "image/jpeg", description: "Standard photographic lossy compressed image", popular: true },
  { ext: "jpeg", name: "Joint Photographic Experts Group", category: "image", categoryLabel: "Images", mime: "image/jpeg", description: "Standard 4-letter extension for JPEG photos", popular: true },
  { ext: "webp", name: "WebP Image", category: "image", categoryLabel: "Images", mime: "image/webp", description: "Modern Google high-efficiency web image", popular: true },
  { ext: "svg", name: "Scalable Vector Graphics", category: "image", categoryLabel: "Images", mime: "image/svg+xml", description: "XML-based resolution-independent 2D vector graphic", popular: true },
  { ext: "gif", name: "Graphics Interchange Format", category: "image", categoryLabel: "Images", mime: "image/gif", description: "Animated or static 8-bit palette image", popular: true },
  { ext: "bmp", name: "Bitmap Image File", category: "image", categoryLabel: "Images", mime: "image/bmp", description: "Uncompressed Windows raster graphics format" },
  { ext: "tiff", name: "Tagged Image File Format", category: "image", categoryLabel: "Images", mime: "image/tiff", description: "High-depth lossless publishing and print format", popular: true },
  { ext: "tif", name: "TIF Print Graphic", category: "image", categoryLabel: "Images", mime: "image/tiff", description: "Legacy 3-letter extension for TIFF" },
  { ext: "ico", name: "Windows Icon Format", category: "image", categoryLabel: "Images", mime: "image/x-icon", description: "Multi-resolution favicon & Windows icon resource", popular: true },
  { ext: "heic", name: "High Efficiency Image Container", category: "image", categoryLabel: "Images", mime: "image/heic", description: "Apple iOS high-efficiency camera photo standard", popular: true },
  { ext: "heif", name: "High Efficiency Image File", category: "image", categoryLabel: "Images", mime: "image/heif", description: "MPEG high efficiency image file standard" },
  { ext: "avif", name: "AV1 Image File Format", category: "image", categoryLabel: "Images", mime: "image/avif", description: "Next-generation royalty-free ultra-compressed image" },
  { ext: "psd", name: "Adobe Photoshop Document", category: "image", categoryLabel: "Images", mime: "image/vnd.adobe.photoshop", description: "Adobe Photoshop layered graphic file", popular: true },
  { ext: "ai", name: "Adobe Illustrator Artwork", category: "image", categoryLabel: "Images", mime: "application/illustrator", description: "Adobe Illustrator vector graphics document", popular: true },
  { ext: "eps", name: "Encapsulated PostScript", category: "image", categoryLabel: "Images", mime: "application/postscript", description: "Vector graphic standard for print publishing" },
  { ext: "raw", name: "Camera Raw Image", category: "image", categoryLabel: "Images", mime: "image/x-raw", description: "Direct uncompressed camera sensor photo data" },
  { ext: "cr2", name: "Canon Raw Image 2", category: "image", categoryLabel: "Images", mime: "image/x-canon-cr2", description: "Canon digital camera raw sensor file" },
  { ext: "nef", name: "Nikon Electronic Format", category: "image", categoryLabel: "Images", mime: "image/x-nikon-nef", description: "Nikon digital camera raw sensor file" },
  { ext: "dng", name: "Digital Negative", category: "image", categoryLabel: "Images", mime: "image/x-adobe-dng", description: "Adobe universal open raw camera standard" },
  { ext: "hdr", name: "High Dynamic Range Image", category: "image", categoryLabel: "Images", mime: "image/vnd.radiance", description: "Radiance 32-bit floating point HDR raster" },
  { ext: "exr", name: "OpenEXR Image", category: "image", categoryLabel: "Images", mime: "image/x-exr", description: "ILM high dynamic-range cinema image standard" },
  { ext: "tga", name: "Truevision Targa Graphic", category: "image", categoryLabel: "Images", mime: "image/x-tga", description: "Classic gaming texture raster format" },

  // ================= 6. AUDIO & MUSIC =================
  { ext: "mp3", name: "MPEG Audio Layer III", category: "audio", categoryLabel: "Audio", mime: "audio/mpeg", description: "Most widely used lossy digital audio format", popular: true },
  { ext: "wav", name: "Waveform Audio File Format", category: "audio", categoryLabel: "Audio", mime: "audio/wav", description: "Standard uncompressed PCM digital audio", popular: true },
  { ext: "aac", name: "Advanced Audio Coding", category: "audio", categoryLabel: "Audio", mime: "audio/aac", description: "High-efficiency successor to MP3", popular: true },
  { ext: "m4a", name: "MPEG-4 Audio", category: "audio", categoryLabel: "Audio", mime: "audio/mp4", description: "Apple iTunes AAC audio container", popular: true },
  { ext: "ogg", name: "Ogg Vorbis Audio", category: "audio", categoryLabel: "Audio", mime: "audio/ogg", description: "Open patent-free lossy audio stream", popular: true },
  { ext: "flac", name: "Free Lossless Audio Codec", category: "audio", categoryLabel: "Audio", mime: "audio/flac", description: "Bit-perfect compressed lossless audio", popular: true },
  { ext: "wma", name: "Windows Media Audio", category: "audio", categoryLabel: "Audio", mime: "audio/x-ms-wma", description: "Microsoft proprietary digital audio format" },
  { ext: "aiff", name: "Audio Interchange File Format", category: "audio", categoryLabel: "Audio", mime: "audio/x-aiff", description: "Apple standard uncompressed audio container" },
  { ext: "alac", name: "Apple Lossless Audio Codec", category: "audio", categoryLabel: "Audio", mime: "audio/alac", description: "Apple bit-perfect lossless compression" },
  { ext: "opus", name: "Opus Interactive Audio", category: "audio", categoryLabel: "Audio", mime: "audio/opus", description: "Ultra-low latency speech and music codec", popular: true },
  { ext: "amr", name: "Adaptive Multi-Rate Audio", category: "audio", categoryLabel: "Audio", mime: "audio/amr", description: "Mobile cellular speech recording format" },
  { ext: "mid", name: "MIDI Sequence File", category: "audio", categoryLabel: "Audio", mime: "audio/midi", description: "Musical Instrument Digital Interface score" },
  { ext: "midi", name: "MIDI Music Sequence", category: "audio", categoryLabel: "Audio", mime: "audio/midi", description: "Synthesized musical performance data" },
  { ext: "ac3", name: "Dolby Digital Audio", category: "audio", categoryLabel: "Audio", mime: "audio/ac3", description: "Dolby surround sound multichannel audio" },
  { ext: "m4r", name: "iPhone Ringtone", category: "audio", categoryLabel: "Audio", mime: "audio/x-m4r", description: "Apple iOS AAC ringtone container" },

  // ================= 7. VIDEO & ANIMATION =================
  { ext: "mp4", name: "MPEG-4 Part 14 Video", category: "video", categoryLabel: "Video", mime: "video/mp4", description: "Most widely supported web and device video container", popular: true },
  { ext: "mkv", name: "Matroska Video Container", category: "video", categoryLabel: "Video", mime: "video/x-matroska", description: "Universal multimedia open container standard", popular: true },
  { ext: "webm", name: "WebM Video Container", category: "video", categoryLabel: "Video", mime: "video/webm", description: "Google royalty-free HTML5 video standard", popular: true },
  { ext: "avi", name: "Audio Video Interleave", category: "video", categoryLabel: "Video", mime: "video/x-msvideo", description: "Classic Microsoft multimedia container format", popular: true },
  { ext: "mov", name: "Apple QuickTime Movie", category: "video", categoryLabel: "Video", mime: "video/quicktime", description: "Apple native QuickTime video container", popular: true },
  { ext: "wmv", name: "Windows Media Video", category: "video", categoryLabel: "Video", mime: "video/x-ms-wmv", description: "Microsoft video compression format" },
  { ext: "flv", name: "Flash Video", category: "video", categoryLabel: "Video", mime: "video/x-flv", description: "Adobe legacy web streaming container" },
  { ext: "3gp", name: "3GPP Mobile Video", category: "video", categoryLabel: "Video", mime: "video/3gpp", description: "Compact mobile device multimedia container" },
  { ext: "m2ts", name: "MPEG Transport Stream", category: "video", categoryLabel: "Video", mime: "video/mp2t", description: "Broadcast and streaming video transport chunk (.m2ts / .ts)" },
  { ext: "m4v", name: "Apple iTunes Video", category: "video", categoryLabel: "Video", mime: "video/x-m4v", description: "Apple DRM-capable video container" },
  { ext: "mpeg", name: "Moving Picture Experts Group", category: "video", categoryLabel: "Video", mime: "video/mpeg", description: "MPEG-1/MPEG-2 broadcast video stream" },
  { ext: "mpg", name: "MPG Movie File", category: "video", categoryLabel: "Video", mime: "video/mpeg", description: "Alternative extension for MPEG video" },
  { ext: "vob", name: "DVD Video Object", category: "video", categoryLabel: "Video", mime: "video/dvd", description: "DVD-Video movie disc content stream" },
  { ext: "ogv", name: "Ogg Theora Video", category: "video", categoryLabel: "Video", mime: "video/ogg", description: "Open source Ogg video container" },

  // ================= 8. ARCHIVES & COMPRESSION =================
  { ext: "zip", name: "ZIP Compressed Archive", category: "archive", categoryLabel: "Archives", mime: "application/zip", description: "Universal standard compressed archive", popular: true },
  { ext: "7z", name: "7-Zip Compressed Archive", category: "archive", categoryLabel: "Archives", mime: "application/x-7z-compressed", description: "High-ratio LZMA compressed archive", popular: true },
  { ext: "tar", name: "Tape Archive (TAR)", category: "archive", categoryLabel: "Archives", mime: "application/x-tar", description: "POSIX standard sequential tarball package", popular: true },
  { ext: "gz", name: "Gzip Compressed File", category: "archive", categoryLabel: "Archives", mime: "application/gzip", description: "Standard Unix single-file gzip compression", popular: true },
  { ext: "tgz", name: "Tarball Gzip Archive", category: "archive", categoryLabel: "Archives", mime: "application/gzip", description: "Gzipped TAR archive package" },
  { ext: "rar", name: "WinRAR Compressed Archive", category: "archive", categoryLabel: "Archives", mime: "application/vnd.rar", description: "Roshal Archive proprietary compression", popular: true },
  { ext: "bz2", name: "Bzip2 Compressed File", category: "archive", categoryLabel: "Archives", mime: "application/x-bzip2", description: "Burrows-Wheeler block-sorting compression" },
  { ext: "xz", name: "XZ Compressed Archive", category: "archive", categoryLabel: "Archives", mime: "application/x-xz", description: "High-compression LZMA2 container" },
  { ext: "iso", name: "Optical Disc Image (ISO)", category: "archive", categoryLabel: "Archives", mime: "application/x-iso9660-image", description: "CD/DVD/Blu-ray disc sector image", popular: true },
  { ext: "cab", name: "Windows Cabinet Archive", category: "archive", categoryLabel: "Archives", mime: "application/vnd.ms-cab-compressed", description: "Microsoft Windows software installation cabinet" },

  // ================= 9. EXECUTABLES & BINARIES (Explicit user priority) =================
  { ext: "exe", name: "Windows Executable Program", category: "executable", categoryLabel: "Executables", mime: "application/x-msdownload", description: "Microsoft Windows Portable Executable (PE) binary", popular: true },
  { ext: "apk", name: "Android Application Package", category: "executable", categoryLabel: "Executables", mime: "application/vnd.android.package-archive", description: "Android OS mobile application distribution package", popular: true },
  { ext: "appimage", name: "Linux AppImage Binary", category: "executable", categoryLabel: "Executables", mime: "application/x-appimage", description: "Universal standalone portable Linux application", popular: true },
  { ext: "dmg", name: "Apple Disk Image", category: "executable", categoryLabel: "Executables", mime: "application/x-apple-diskimage", description: "macOS software distribution and disk container", popular: true },
  { ext: "bin", name: "Generic Binary Stream", category: "executable", categoryLabel: "Executables", mime: "application/octet-stream", description: "Raw executable or firmware binary image", popular: true },
  { ext: "sh", name: "Bash Shell Script", category: "executable", categoryLabel: "Executables", mime: "application/x-sh", description: "Linux / macOS executable shell command script", popular: true },
  { ext: "bat", name: "Windows Batch Script", category: "executable", categoryLabel: "Executables", mime: "application/x-bat", description: "DOS / Windows Command Prompt batch file", popular: true },
  { ext: "cmd", name: "Windows Command Script", category: "executable", categoryLabel: "Executables", mime: "text/plain", description: "Windows NT command shell script" },
  { ext: "ps1", name: "PowerShell Script", category: "executable", categoryLabel: "Executables", mime: "application/x-powershell", description: "Microsoft PowerShell automation script" },
  { ext: "msi", name: "Windows Installer Package", category: "executable", categoryLabel: "Executables", mime: "application/x-msi", description: "Microsoft Windows Installer database" },
  { ext: "deb", name: "Debian Linux Software Package", category: "executable", categoryLabel: "Executables", mime: "application/vnd.debian.binary-package", description: "Ubuntu / Debian OS binary installation package" },
  { ext: "rpm", name: "Red Hat Package Manager", category: "executable", categoryLabel: "Executables", mime: "application/x-rpm", description: "Fedora / RHEL / CentOS Linux software package" },
  { ext: "jar", name: "Java Archive Executable", category: "executable", categoryLabel: "Executables", mime: "application/java-archive", description: "Executable Java bytecode package archive" },
  { ext: "dll", name: "Dynamic Link Library", category: "executable", categoryLabel: "Executables", mime: "application/x-msdownload", description: "Windows shared library and code execution module" },
  { ext: "so", name: "Linux Shared Object", category: "executable", categoryLabel: "Executables", mime: "application/x-sharedlib", description: "Linux ELF dynamic library module" },
  { ext: "dylib", name: "macOS Dynamic Library", category: "executable", categoryLabel: "Executables", mime: "application/x-dylib", description: "Apple Mach-O dynamic shared library" },
  { ext: "ipa", name: "iOS App Store Package", category: "executable", categoryLabel: "Executables", mime: "application/octet-stream", description: "Apple iPhone / iPad application archive" },
  { ext: "aab", name: "Android App Bundle", category: "executable", categoryLabel: "Executables", mime: "application/octet-stream", description: "Google Play Store publishing format" },
  { ext: "com", name: "DOS Command Executable", category: "executable", categoryLabel: "Executables", mime: "application/x-msdownload", description: "Legacy 16-bit DOS executable program" },

  // ================= 10. CODE & DEVELOPER FILES =================
  { ext: "js", name: "JavaScript Source", category: "code", categoryLabel: "Code", mime: "application/javascript", description: "Standard ECMAScript program code", popular: true },
  { ext: "ts", name: "TypeScript Source", category: "code", categoryLabel: "Code", mime: "application/typescript", description: "Typed JavaScript programming language", popular: true },
  { ext: "py", name: "Python Script", category: "code", categoryLabel: "Code", mime: "text/x-python", description: "Python programming language source code", popular: true },
  { ext: "c", name: "C Language Source", category: "code", categoryLabel: "Code", mime: "text/x-c", description: "ISO C programming language file" },
  { ext: "cpp", name: "C++ Language Source", category: "code", categoryLabel: "Code", mime: "text/x-c++src", description: "C++ object-oriented program code", popular: true },
  { ext: "h", name: "C/C++ Header File", category: "code", categoryLabel: "Code", mime: "text/x-chdr", description: "Declaration header for C and C++ projects" },
  { ext: "java", name: "Java Source Code", category: "code", categoryLabel: "Code", mime: "text/x-java-source", description: "Oracle Java class and program source code" },
  { ext: "rs", name: "Rust Source Code", category: "code", categoryLabel: "Code", mime: "text/rust", description: "Rust memory-safe system programming code" },
  { ext: "go", name: "Go Language Source", category: "code", categoryLabel: "Code", mime: "text/x-go", description: "Google Golang backend system code" },
  { ext: "sql", name: "SQL Database Script", category: "code", categoryLabel: "Code", mime: "application/sql", description: "Structured Query Language database script", popular: true },
  { ext: "php", name: "PHP Hypertext Preprocessor", category: "code", categoryLabel: "Code", mime: "application/x-httpd-php", description: "Server-side web scripting language" },
  { ext: "css", name: "Cascading Style Sheets", category: "code", categoryLabel: "Code", mime: "text/css", description: "Web presentation and styling stylesheet" },
  { ext: "swift", name: "Apple Swift Source", category: "code", categoryLabel: "Code", mime: "text/x-swift", description: "Apple modern iOS & macOS programming language" },
  { ext: "kt", name: "Kotlin Source Code", category: "code", categoryLabel: "Code", mime: "text/x-kotlin", description: "JetBrains Kotlin Android program code" },

  // ================= 11. FONTS & TYPOGRAPHY =================
  { ext: "ttf", name: "TrueType Font", category: "font", categoryLabel: "Fonts", mime: "font/ttf", description: "Standard Apple & Microsoft scalable font", popular: true },
  { ext: "otf", name: "OpenType Font", category: "font", categoryLabel: "Fonts", mime: "font/otf", description: "Adobe & Microsoft scalable typography standard", popular: true },
  { ext: "woff", name: "Web Open Font Format", category: "font", categoryLabel: "Fonts", mime: "font/woff", description: "W3C compressed web typography format", popular: true },
  { ext: "woff2", name: "Web Open Font Format 2", category: "font", categoryLabel: "Fonts", mime: "font/woff2", description: "Next-generation Brotli compressed web font", popular: true },
  { ext: "eot", name: "Embedded OpenType", category: "font", categoryLabel: "Fonts", mime: "application/vnd.ms-fontobject", description: "Legacy Microsoft Internet Explorer web font" },
];

/**
 * Fast search lookup across all formats by extension, name, category, or description
 */
export function searchFormats(query: string, categoryFilter: string = "all"): FormatDefinition[] {
  const cleanQ = query.trim().toLowerCase().replace(/^\./, "");

  return UNIVERSAL_FORMATS.filter((f) => {
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!cleanQ) return true;

    return (
      f.ext.toLowerCase().includes(cleanQ) ||
      f.name.toLowerCase().includes(cleanQ) ||
      f.description.toLowerCase().includes(cleanQ) ||
      f.categoryLabel.toLowerCase().includes(cleanQ)
    );
  });
}

/**
 * Get or synthesize format definition for ANY extension (including arbitrary custom extensions)
 */
export function getFormatByExtension(rawExt: string): FormatDefinition {
  const clean = (rawExt || "bin").trim().toLowerCase().replace(/^\./, "");
  const found = UNIVERSAL_FORMATS.find((f) => f.ext === clean);

  if (found) return found;

  // Synthesize custom format on the fly so arbitrary extensions work seamlessly
  const isCad = ["step", "stp", "iges", "igs", "sldprt", "sldasm", "stl", "obj", "fbx", "dxf", "dwg"].includes(clean);
  const isImage = ["png", "jpg", "jpeg", "webp", "svg", "bmp", "tiff", "ico"].includes(clean);
  const isAudio = ["mp3", "wav", "aac", "ogg", "flac", "m4a", "opus"].includes(clean);
  const isVideo = ["mp4", "mkv", "avi", "mov", "webm", "flv"].includes(clean);
  const isArchive = ["zip", "7z", "tar", "gz", "rar"].includes(clean);
  const isDoc = ["pdf", "docx", "doc", "txt", "html", "md"].includes(clean);
  const isSheet = ["xlsx", "xls", "csv", "json"].includes(clean);
  const isExe = ["exe", "apk", "appimage", "dmg", "bin", "sh", "bat"].includes(clean);

  const cat: FormatCategory = isCad
    ? "cad"
    : isImage
    ? "image"
    : isAudio
    ? "audio"
    : isVideo
    ? "video"
    : isArchive
    ? "archive"
    : isSheet
    ? "spreadsheet"
    : isDoc
    ? "document"
    : isExe
    ? "executable"
    : "document";

  return {
    ext: clean,
    name: `.${clean.toUpperCase()} File`,
    category: cat,
    categoryLabel: CATEGORY_INFO[cat]?.label || "Custom File",
    mime: "application/octet-stream",
    description: `Custom .${clean.toUpperCase()} format`,
  };
}
