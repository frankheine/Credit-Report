const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace emerald with white/monochrome
  content = content.replace(/text-emerald-[3456]00(?:\/[0-9]+)?/g, 'text-white');
  content = content.replace(/bg-emerald-500\/[0-9]+/g, 'bg-neutral-900');
  content = content.replace(/bg-emerald-[456]00(?:\/[0-9]+)?/g, 'bg-white');
  content = content.replace(/border-emerald-[3456]00(?:\/[0-9]+)?/g, 'border-neutral-700');
  content = content.replace(/ring-emerald-[3456]00(?:\/[0-9]+)?/g, 'ring-white');
  content = content.replace(/text-slate-950/g, 'text-black');
  
  // Replace slate with neutral
  content = content.replace(/slate-/g, 'neutral-');

  // Remove shadows and glows
  content = content.replace(/shadow-\[.*?\]/g, 'shadow-none');
  content = content.replace(/shadow-(lg|md|sm|xl|2xl|xs)/g, 'shadow-none');
  content = content.replace(/glow-[a-z]+/g, '');
  content = content.replace(/scanline-overlay/g, '');
  content = content.replace(/animate-pulse/g, '');
  content = content.replace(/backdrop-blur-(md|sm|lg)/g, '');

  // Replace radii
  content = content.replace(/rounded-(xl|lg|md|sm)/g, 'rounded-none');
  content = content.replace(/(?<!-)rounded(?!-)/g, 'rounded-none'); // match exact 'rounded'

  // Backgrounds
  content = content.replace(/bg-\[#020408\]/g, 'bg-black');
  content = content.replace(/bg-\[#030712\]/g, 'bg-[#050505]');
  content = content.replace(/bg-\[#03050a\]/g, 'bg-black');
  content = content.replace(/bg-\[#040712\](?:\/[0-9]+)?/g, 'bg-[#050505]');
  content = content.replace(/bg-neutral-950(?:\/[0-9]+)?/g, 'bg-[#0a0a0a]');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = [
  'src/App.tsx',
  'src/components/RedactionVerifier.tsx',
  'src/components/DiscrepancyViewer.tsx',
  'src/components/DisputeLetterEditor.tsx',
  'src/components/RepairWalkthrough.tsx'
];
files.forEach(replaceInFile);
console.log("Rewrite complete.");
