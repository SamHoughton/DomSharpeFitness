// Writes data/pricing.json into every HTML file that quotes a price.
// Run after editing data/pricing.json: node scripts/sync-pricing.js
//
// Targets elements tagged data-key="pricing.<tier>.<field>":
//   .total    index.html price cards      (span data-to + text, plain number)
//   .perweek  index.html price cards      (text, uses the &pound; entity index.html uses elsewhere)
//   .row      Hitchin/Letchworth tables   (text, uses a literal £ like those files use elsewhere)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'data/pricing.json'), 'utf8'));

const values = {};
for (const tier of pricing.tiers) {
    const perWeek = tier.sessions > 1 ? tier.total / tier.sessions : null;

    values[`pricing.${tier.key}.total`] = String(tier.total);

    if (perWeek !== null) {
        values[`pricing.${tier.key}.perweek`] = `&pound;${perWeek} per week`;
        values[`pricing.${tier.key}.row`] = `£${tier.total}, £${perWeek} per week`;
    } else {
        values[`pricing.${tier.key}.row`] = `£${tier.total} per ${tier.unit.replace('per ', '')}`;
    }
}

const files = ['index.html', 'personal-trainer-hitchin.html', 'personal-trainer-letchworth.html'];
let totalChanges = 0;

for (const file of files) {
    const filePath = path.join(root, file);
    let html = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;

    html = html.replace(
        /(<[a-z]+\b[^>]*\bdata-key="([\w.]+)"[^>]*>)([^<]*)(<)/g,
        (match, openTag, key, text, closeBracket) => {
            if (!(key in values)) return match;

            let newOpenTag = openTag;
            let newText = values[key];

            if (key.endsWith('.total')) {
                newOpenTag = newOpenTag.replace(/data-to="[^"]*"/, `data-to="${newText}"`);
            }

            if (newOpenTag !== openTag || newText !== text) fileChanges++;
            return newOpenTag + newText + closeBracket;
        }
    );

    fs.writeFileSync(filePath, html);
    console.log(`${file}: ${fileChanges} value(s) synced`);
    totalChanges += fileChanges;
}

console.log(totalChanges === 0 ? 'Already up to date.' : `Done, ${totalChanges} value(s) updated.`);
