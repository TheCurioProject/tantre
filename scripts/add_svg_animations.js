const fs = require('fs');
const path = require('path');

const BRAND_DIR = path.join(__dirname, '../public/brand');

function processSvgFile(filePath, category, filename) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove existing injected styles or groups if any (for idempotency)
  content = content.replace(/<style id="tantre-anim">.*?<\/style>/s, '');
  content = content.replace(/<g id="tantre-anim-group".*?>/s, '');
  content = content.replace(/<\/g><\/svg>$/, '</svg>');

  let styleContent = '';
  let wrappedContent = content;

  // Extract paths/elements
  const svgStartMatch = content.match(/<svg[^>]*>/);
  if (!svgStartMatch) return;
  const svgStart = svgStartMatch[0];
  const innerContent = content.substring(svgStartMatch.index + svgStart.length, content.lastIndexOf('</svg>'));

  if (category === 'ui') {
    // UI: subtle pop-in on load
    styleContent = `
      @media (prefers-reduced-motion: no-preference) {
        @keyframes uiPop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        svg { animation: uiPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: center; }
      }
    `;
    wrappedContent = `${svgStart}<style id="tantre-anim">${styleContent}</style>${innerContent}</svg>`;
  } else if (category === 'living-line' || category === 'lettering' || category === 'doodles') {
    // Drawing effect
    styleContent = `
      @media (prefers-reduced-motion: no-preference) {
        @keyframes draw {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards;
        }
      }
    `;
    wrappedContent = `${svgStart}<style id="tantre-anim">${styleContent}</style>${innerContent}</svg>`;
  } else if (category === 'states') {
    if (filename.includes('loading')) {
      styleContent = `
        @media (prefers-reduced-motion: no-preference) {
          @keyframes spin { 100% { transform: rotate(360deg); } }
          svg { animation: spin 1s linear infinite; transform-origin: center; }
        }
      `;
    } else {
      styleContent = `
        @media (prefers-reduced-motion: no-preference) {
          @keyframes pop { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          svg { animation: pop 0.5s ease-out forwards; transform-origin: center; }
        }
      `;
    }
    wrappedContent = `${svgStart}<style id="tantre-anim">${styleContent}</style>${innerContent}</svg>`;
  } else if (category === 'menu' || category === 'cafe' || category === 'ceramics' || category === 'illus') {
    // These usually have a background blob as the first path, and the object on top.
    // We want to float the object but keep the blob static.
    styleContent = `
      @media (prefers-reduced-motion: no-preference) {
        @keyframes floatObject {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2%); }
        }
        #tantre-anim-group {
          animation: floatObject 5s ease-in-out infinite;
          transform-origin: center;
        }
      }
    `;
    
    // Attempt to split first path (blob) and rest
    // A path could be <path ... /> or <path ...></path>
    // We will just find the first <path.../> or <polygon.../> or <circle.../>
    const firstElementMatch = innerContent.match(/<(path|circle|polygon|rect|ellipse)[^>]*(\/>|>.*?<\/\1>)/s);
    
    if (firstElementMatch) {
      const firstElement = firstElementMatch[0];
      const restOfContent = innerContent.substring(firstElementMatch.index + firstElement.length);
      const beforeFirstElement = innerContent.substring(0, firstElementMatch.index);
      
      wrappedContent = `${svgStart}
<style id="tantre-anim">${styleContent}</style>
${beforeFirstElement}
${firstElement}
<g id="tantre-anim-group">
${restOfContent}
</g>
</svg>`;
    } else {
      // Fallback if no paths found (unlikely)
      wrappedContent = `${svgStart}<style id="tantre-anim">${styleContent}</style><g id="tantre-anim-group">${innerContent}</g></svg>`;
    }
  } else {
    // Process, qr, menu-deco, masks, etc.
    styleContent = `
      @media (prefers-reduced-motion: no-preference) {
        @keyframes gentleFade { from { opacity: 0.8; } to { opacity: 1; } }
        svg { animation: gentleFade 1s ease-out forwards; }
      }
    `;
    wrappedContent = `${svgStart}<style id="tantre-anim">${styleContent}</style>${innerContent}</svg>`;
  }

  fs.writeFileSync(filePath, wrappedContent, 'utf-8');
}

function traverseDir(dir, category) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath, category || file);
    } else if (file.endsWith('.svg')) {
      processSvgFile(fullPath, category, file);
    }
  }
}

traverseDir(BRAND_DIR, null);
console.log('SVG animations added successfully.');
