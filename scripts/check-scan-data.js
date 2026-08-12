// Cross-file consistency check for scan/result figures that appear more than
// once (e.g. the same client's numbers on index.html and a location page).
// Unlike pricing, this doesn't rewrite prose, it just catches drift: every
// element tagged data-key="results.<...>" across every HTML file must agree.
//
// Run: node scripts/check-scan-data.js
// Exits non-zero if any key has disagreeing values, so it can gate a deploy.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));

const seen = {}; // key -> [{file, value}]

for (const file of files) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const re = /<[a-z]+\b[^>]*\bdata-key="(results\.[\w.]+)"[^>]*>([^<]*)</g;
    let m;
    while ((m = re.exec(html))) {
        const [, key, value] = m;
        (seen[key] = seen[key] || []).push({ file, value: value.trim() });
    }
}

let mismatches = 0;
const keys = Object.keys(seen).sort();

for (const key of keys) {
    const entries = seen[key];
    const distinct = [...new Set(entries.map(e => e.value))];
    if (distinct.length > 1) {
        mismatches++;
        console.log(`MISMATCH  ${key}`);
        for (const e of entries) console.log(`    ${e.value.padEnd(12)} ${e.file}`);
    }
}

if (mismatches === 0) {
    const total = keys.length;
    const files_ = new Set(Object.values(seen).flat().map(e => e.file)).size;
    console.log(`OK: ${total} figure(s) checked across ${files_} file(s), all agree.`);
} else {
    console.log(`\n${mismatches} figure(s) disagree across files. Fix the odd one out above.`);
    process.exit(1);
}
