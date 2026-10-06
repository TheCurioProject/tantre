import fs from 'fs';

const toFix = [
  'ceramic-maceta',
  'ceramic-bowl',
  'ceramic-taza-cappuccino',
  'ceramic-florero',
  'ceramic-figura',
];

for (const name of toFix) {
  const maskPath = `./public/brand/ceramics/${name}-mask.svg`;
  const colorPath = `./public/brand/ceramics/${name}.svg`;
  
  if (!fs.existsSync(maskPath) || !fs.existsSync(colorPath)) {
    console.log(`Skipping ${name}`);
    continue;
  }
  
  const maskContent = fs.readFileSync(maskPath, 'utf8');
  // Extract the d attribute from the first path in the group
  const match = maskContent.match(/<g id="tantre-anim-group">\s*<path[^>]+d="([^"]+)"/);
  if (!match) {
    console.log(`No path found in mask for ${name}`);
    continue;
  }
  
  // For even-odd paths (with Z M), take only the first subpath (the body)
  let d = match[1];
  if (d.includes('Z M')) {
    d = d.split(/(?<=Z)\s*(?=M)/)[0];
  }
  
  const colorContent = fs.readFileSync(colorPath, 'utf8');
  
  // Check if we already inserted it
  if (colorContent.includes(`d="${d}"`)) {
    console.log(`Already fixed ${name}`);
    continue;
  }
  
  const newPath = `<path fill="#FDF6EC" stroke="#1A1817" stroke-width="19.46" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  
  const newColorContent = colorContent.replace(
    /<g id="tantre-anim-group">/,
    `<g id="tantre-anim-group">\n${newPath}`
  );
  
  fs.writeFileSync(colorPath, newColorContent);
  console.log(`Fixed ${name}`);
}
