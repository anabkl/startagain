import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documents = (await readdir(root)).filter((entry) => entry.endsWith('.md')).sort();
const errors = [];

function fail(file, message) {
    errors.push(`${file}: ${message}`);
}

for (const document of documents) {
    const absolute = path.join(root, document);
    let markdown;
    try {
        markdown = await readFile(absolute, 'utf8');
    } catch {
        fail(document, 'document is missing or unreadable');
        continue;
    }

    if (!markdown.startsWith('# ')) fail(document, 'must start with one H1');
    if (/\]\(http:\/\//i.test(markdown)) fail(document, 'documentation links must use HTTPS');
    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = match[1].trim();
        if (!target || target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('tel:')) continue;
        if (/example\.(?:com|org)|placeholder|TODO_LINK/i.test(target)) {
            fail(document, `contains a placeholder link ${target}`);
            continue;
        }
        if (/^https:\/\//i.test(target)) {
            try {
                new URL(target);
            } catch {
                fail(document, `invalid HTTPS link ${target}`);
            }
            continue;
        }
        if (/^[a-z]+:/i.test(target)) {
            fail(document, `unsupported link protocol in ${target}`);
            continue;
        }

        const pathname = decodeURIComponent(target.split('#')[0].split('?')[0]);
        if (!pathname) continue;
        try {
            await access(path.resolve(path.dirname(absolute), pathname));
        } catch {
            fail(document, `broken local link ${target}`);
        }
    }
}

if (errors.length) {
    console.error(`Documentation validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Validated all ${documents.length} root Markdown documents and their local/HTTPS links.`);
