const fs = require('fs');
let file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const replacements = [
  ['bg-slate-950', 'bg-slate-50'],
  ['bg-slate-900', 'bg-white'],
  ['border-slate-800', 'border-slate-200'],
  ['border-slate-850', 'border-slate-100'],
  ['text-white', 'text-slate-900'],
  ['text-slate-400', 'text-slate-500'],
  ['text-slate-350', 'text-slate-600'],
  ['text-slate-300', 'text-slate-600'],
  ['text-cyan-400', 'text-teal-600'],
  ['bg-cyan-500/10', 'bg-teal-50'],
  ['bg-cyan-500/20', 'bg-teal-100'],
  ['border-cyan-500/20', 'border-teal-200'],
  ['hover:border-cyan-500/20', 'hover:border-teal-300'],
  ['focus:border-cyan-500', 'focus:border-teal-400'],
  ['border-t-slate-800', 'border-t-slate-200'],
];

for (const [from, to] of replacements) {
    file = file.split(from).join(to);
}

fs.writeFileSync('src/components/AdminPanel.tsx', file);
