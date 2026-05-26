import fs from 'fs';
let file = fs.readFileSync('src/components/OrderTracker.tsx', 'utf8');

const replacements = [
  ['text-white', 'text-slate-900'],
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-950', 'bg-slate-50'],
  ['border-slate-850', 'border-slate-200'],
  ['border-slate-900', 'border-slate-200'],
  ['border-slate-800', 'border-slate-200'],
  ['text-cyan-400', 'text-teal-600'],
  ['text-slate-400', 'text-slate-500'],
  ['bg-cyan-500/10', 'bg-teal-50'],
  ['border-cyan-500/25', 'border-teal-200'],
  ['border-cyan-500/60', 'border-teal-400'],
  ['bg-cyan-500', 'bg-teal-500'],
  ['hover:bg-cyan-600', 'hover:bg-teal-600'],
  ['text-slate-950', 'text-white'], // This might incorrectly target previous replacements if text-slate-950 was there
  ['border-cyan-500/15', 'border-teal-200'],
  ['border-cyan-500/20', 'border-teal-200'],
  ['bg-cyan-400', 'bg-teal-400'],
  ['border-cyan-400', 'border-teal-500'],
  ['border-cyan-400/80', 'border-teal-400'],
  ['shadow-cyan-400/5', 'shadow-teal-400/10'],
];

for (const [from, to] of replacements) {
    file = file.split(from).join(to);
}

fs.writeFileSync('src/components/OrderTracker.tsx', file);
