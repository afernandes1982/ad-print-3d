import fs from 'fs';
let file = fs.readFileSync('./src/components/AdminPanel.tsx', 'utf8');

const replacements = [
  ['hover:bg-slate-850', 'hover:bg-slate-100'],
  ['hover:border-slate-700', 'hover:border-slate-300']
];

for (const [from, to] of replacements) {
    file = file.split(from).join(to);
}

fs.writeFileSync('./src/components/AdminPanel.tsx', file);
