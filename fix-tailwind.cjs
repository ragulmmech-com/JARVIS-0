const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf-8');

// The easiest way to support CSS variables in Tailwind without completely rewriting everything is using arbitrary values or theme config.
// But we already have a vite + tailwind setup.
// Let's modify tailwind config if it exists, or just do a global replace in index.css.
