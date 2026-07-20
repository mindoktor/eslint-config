/**
 * Align markdown tables so all pipe characters sit at the same column positions.
 *
 * Usage:
 *   node alignTables.mts <file> [--write | --check]
 *
 * Default (no flag): prints the aligned file to stdout for review.
 * --write: edits the file in place.
 * --check: exits non-zero if the file is not already aligned; edits nothing.
 *
 * The core is exported (`alignMarkdownTables`) so the skills validator can reuse
 * it to enforce alignment without shelling out or duplicating the logic.
 */

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** A contiguous block of markdown table lines (header, separator, data rows). */
interface TableBlock {
  /** 0-based line index where the table starts in the file. */
  start: number;
  /** The raw lines that make up the table. */
  lines: string[];
}

/**
 * Split a line on pipe characters and return the trimmed inner cells.
 * Pipes escaped as `\|` are literal cell content (e.g. regex alternation in the
 * auto-approve skill), not column separators, so they are kept intact. Raw,
 * unescaped pipes inside code spans are still not handled — escape them as `\|`.
 */
const splitRow = (line: string): string[] => {
  const trimmed = line.trim();
  const withoutOuterPipes = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return withoutOuterPipes.split(/(?<!\\)\|/).map((cell) => cell.trim());
};

/** True when the line looks like a separator row: `|---|---|`. */
const isSeparator = (line: string): boolean =>
  /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?\s*$/.test(line.trim());

/** True when the line looks like a table row: starts and ends with `|`. */
const isTableRow = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|');
};

/** True when the line opens or closes a fenced code block (``` or ~~~). */
const isCodeFence = (line: string): boolean => /^\s*(```|~~~)/.test(line);

/** Find all contiguous table blocks in the file. */
const findTables = (lines: string[]): TableBlock[] => {
  const tables: TableBlock[] = [];
  let i = 0;
  let inCodeFence = false;

  while (i < lines.length) {
    // Skip fenced code blocks so pipe-heavy code is never parsed as a table.
    if (isCodeFence(lines[i])) {
      inCodeFence = !inCodeFence;
      i++;
      continue;
    }

    // A table starts when we see a row followed by a separator row.
    if (
      !inCodeFence &&
      isTableRow(lines[i]) &&
      i + 1 < lines.length &&
      isSeparator(lines[i + 1])
    ) {
      const start = i;
      const block: string[] = [];

      // Consume all contiguous table rows.
      while (i < lines.length && isTableRow(lines[i])) {
        block.push(lines[i]);
        i++;
      }

      tables.push({ start, lines: block });
      continue;
    }

    i++;
  }

  return tables;
};

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/** Build a separator cell of the right width, preserving alignment markers. */
const buildSeparatorCell = (original: string, width: number): string => {
  const trimmed = original.trim();
  const leftColon = trimmed.startsWith(':');
  const rightColon = trimmed.endsWith(':');

  const dashes = width - (leftColon ? 1 : 0) - (rightColon ? 1 : 0);
  return (
    (leftColon ? ':' : '') +
    '-'.repeat(Math.max(1, dashes)) +
    (rightColon ? ':' : '')
  );
};

/** Align a single table block. Returns the new lines. */
const alignTable = (block: string[]): string[] => {
  const parsed = block.map(splitRow);

  // Number of columns = max across all rows (handles ragged tables).
  const colCount = Math.max(...parsed.map((row) => row.length));

  // Compute max width per column across all non-separator rows.
  const widths = new Array<number>(colCount).fill(0);
  for (let rowIdx = 0; rowIdx < parsed.length; rowIdx++) {
    if (isSeparator(block[rowIdx])) {
      continue;
    }
    for (let col = 0; col < parsed[rowIdx].length; col++) {
      widths[col] = Math.max(widths[col], parsed[rowIdx][col].length);
    }
  }

  // Ensure minimum width of 3 for separator dashes.
  for (let col = 0; col < colCount; col++) {
    widths[col] = Math.max(widths[col], 3);
  }

  // Rebuild each line.
  return block.map((line, rowIdx) => {
    const cells = parsed[rowIdx];
    const isSep = isSeparator(line);

    const paddedCells = Array.from({ length: colCount }, (_, col) => {
      const raw = cells[col] ?? '';
      if (isSep) {
        return buildSeparatorCell(raw, widths[col]);
      }
      return raw.padEnd(widths[col]);
    });

    return `| ${paddedCells.join(' | ')} |`;
  });
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Align every markdown table in `content` and return the rewritten text. Tables
 * inside fenced code blocks are left untouched; content with no tables is
 * returned unchanged. Shared by the CLI and the skills validator so alignment
 * is defined in exactly one place.
 */
export const alignMarkdownTables = (content: string): string => {
  const lines = content.split('\n');
  const tables = findTables(lines);

  if (tables.length === 0) {
    return content;
  }

  // Apply alignment in reverse order so line indices stay valid.
  for (let t = tables.length - 1; t >= 0; t--) {
    const table = tables[t];
    const aligned = alignTable(table.lines);
    lines.splice(table.start, table.lines.length, ...aligned);
  }

  return lines.join('\n');
};

/** Count the markdown tables in `content` (used only for CLI reporting). */
export const countMarkdownTables = (content: string): number =>
  findTables(content.split('\n')).length;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const printUsage = (): void => {
  console.log('Usage: node alignTables.mts <file> [--write | --check]');
  console.log('');
  console.log(
    'Align markdown tables so pipe characters sit at consistent columns.',
  );
  console.log('  (default)  print the aligned file to stdout for review');
  console.log('  --write    edit the file in place');
  console.log(
    '  --check    exit non-zero (and name the file) if it is not already aligned',
  );
};

const main = (): number => {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    return args.includes('--help') ? 0 : 1;
  }

  const filePath = args.find((a) => !a.startsWith('--'));
  const writeMode = args.includes('--write');
  const checkMode = args.includes('--check');

  if (filePath == null) {
    console.error('Error: no file path provided.');
    printUsage();
    return 1;
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    return 1;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const aligned = alignMarkdownTables(content);
  const isAligned = aligned === content;

  if (checkMode) {
    if (isAligned) {
      console.log(`OK: ${filePath} tables are aligned`);
      return 0;
    }
    console.error(
      `FAIL: ${filePath} has misaligned markdown tables — run with --write to fix`,
    );
    return 1;
  }

  if (writeMode) {
    if (isAligned) {
      console.log(`No change: ${filePath} tables already aligned`);
      return 0;
    }
    fs.writeFileSync(filePath, aligned, 'utf-8');
    console.log(
      `Aligned ${countMarkdownTables(content)} table(s) in ${filePath}`,
    );
    return 0;
  }

  process.stdout.write(aligned);
  return 0;
};

// Run the CLI only when invoked directly, never when imported (e.g. by the
// skills validator). Node sets process.argv[1] to the entry script's path
// (an empty string when Node is started via --eval), so map it to a file URL
// only when present and compare against this module's own URL.
const entryHref = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (import.meta.url === entryHref) {
  process.exit(main());
}
