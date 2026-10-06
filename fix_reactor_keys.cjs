const fs = require('fs');

const file = 'src/components/ArcReactorSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace any missing z-10 on the container
content = content.replace(
  /className=\{`relative flex items-center justify-center pointer-events-none select-none \$\{className\}`\}/,
  'className={`relative flex items-center justify-center pointer-events-none select-none z-10 ${className}`}'
);

// We want to add keys to anything immediately after .map((_, i) => (
// Since there are many types of tags (g, path, circle, polygon, rect, line), we can use a regex to inject the key

content = content.replace(/\.map\(\(\_, i\) => \(\s*<([a-zA-Z]+)/g, '.map((_, i) => (\n              <$1 key={`reactor-part-${i}`}');

fs.writeFileSync(file, content);
console.log('Fixed ArcReactorSvg.tsx keys');
