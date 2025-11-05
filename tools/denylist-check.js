#!/usr/bin/env node
/* Denylist check: fails if banned keywords are found. */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
// Build banned keyword pattern without embedding the full term literally
const BANNED = [new RegExp(['co', 'dex'].join(''), 'i')];
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
]);

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB safety cap

/**
 * Recursively collect files under a directory, skipping known dirs.
 */
function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return; // skip unreadable
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function scanFile(file) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return [];
  }
  if (!stat.isFile()) return [];
  if (stat.size > MAX_SIZE_BYTES) return [];

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rx of BANNED) {
      if (rx.test(line)) {
        hits.push({ line: i + 1, text: line });
        break;
      }
    }
  }
  return hits;
}

function main() {
  const findings = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file) || file;
    // Skip lockfiles and common binary types quickly
    const lower = rel.toLowerCase();
    if (lower.endsWith('.lock') || lower.endsWith('.ico') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.woff') || lower.endsWith('.woff2') || lower.endsWith('.ttf')) {
      continue;
    }
    const hits = scanFile(file);
    if (hits.length) {
      findings.push({ file: rel.replace(/\\/g, '/'), hits });
    }
  }

  if (findings.length) {
    console.error('Denylist violation: Found banned keyword occurrences');
    for (const f of findings) {
      for (const h of f.hits) {
        console.error(`${f.file}:${h.line}: ${h.text}`);
      }
    }
    console.error('\nBanned keywords present (case-insensitive).');
    process.exit(2);
  } else {
    console.log('Denylist check passed: no banned keywords found.');
  }
}

main();
