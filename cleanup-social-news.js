#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = __dirname;
const newsPath = 'news-' + 'insights';
const pressDetailPath = 'press-release-' + 'detail';
const socialMenuClass = 'menu--social-' + 'links';
const socialLinkClasses = [
  'facebook-' + 'social-link',
  'twitter-' + 'social-link',
  'linkedin-' + 'social-link',
  'youtube-' + 'soical-link',
];
const latestNewsCta = 'Subscribe to Latest ' + 'News';
const newsLabel = 'News &' + 'amp; Insights';
const convercentUrl = [
  'https://app.convercent.com/en-US/LandingPage',
  '8dba4f3d-baae-ec11-a98a-000d3ab9f296',
].join('/');
const report = {
  htmlFilesProcessed: 0,
  filesModified: [],
  filesDeleted: [],
  operations: {},
};

function record(name, count) {
  if (!count) return;
  report.operations[name] = (report.operations[name] || 0) + count;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function removePath(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  report.filesDeleted.push(relativePath);
}

function removeByRegex(html, regex, operation) {
  let count = 0;
  const next = html.replace(regex, () => {
    count += 1;
    return '';
  });
  record(operation, count);
  return next;
}

function findElementEnd(html, tag, start) {
  const tagRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  tagRe.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tagRe.exec(html))) {
    const token = match[0];
    const isClose = token.startsWith('</');
    const isSelfClosing = /\/\s*>$/.test(token);

    if (!isClose && !isSelfClosing) depth += 1;
    if (isClose) depth -= 1;
    if (depth === 0) return tagRe.lastIndex;
  }

  return -1;
}

function removeMatchingElements(html, tag, predicate, operation) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  let output = '';
  let cursor = 0;
  let count = 0;
  let match;

  while ((match = openRe.exec(html))) {
    const start = match.index;
    const end = findElementEnd(html, tag, start);
    if (end === -1) {
      openRe.lastIndex = start + match[0].length;
      continue;
    }

    const chunk = html.slice(start, end);
    if (predicate(chunk)) {
      output += html.slice(cursor, start);
      cursor = end;
      count += 1;
      openRe.lastIndex = end;
    } else {
      openRe.lastIndex = start + match[0].length;
    }
  }

  output += html.slice(cursor);
  record(operation, count);
  return output;
}

function removeDivById(html, id, operation) {
  return removeMatchingElements(
    html,
    'div',
    (chunk) => new RegExp(`<div\\b[^>]*\\bid=["']${id}["']`, 'i').test(chunk.slice(0, 500)),
    operation,
  );
}

function removePressNewsCardItems(html) {
  return removeMatchingElements(
    html,
    'div',
    (chunk) => {
      const opening = chunk.slice(0, 250);
      if (!/\bclass=["'][^"']*\bfield__item\b/i.test(opening)) return false;
      return new RegExp(`${newsPath}/press-releases\\.html|Press Releases_1\\.jpg|Dodsal Group Press Releases|${newsLabel}`, 'i').test(chunk);
    },
    'remove promo card items',
  );
}

function cleanupHtml(html) {
  html = removeMatchingElements(
    html,
    'nav',
    (chunk) => new RegExp(`\\b${socialMenuClass}\\b`, 'i').test(chunk.slice(0, 500)),
    'remove social nav blocks',
  );

  for (const id of [
    'block-dodsalgroup-corp-theme-latestpressreleaseblock',
    'block-dodsalgroup-corp-theme-linkedinpostsblock',
    'block-dodsalgroup-corp-theme-subscribepressreleaseblock',
  ]) {
    html = removeDivById(html, id, `remove ${id}`);
  }

  html = removeMatchingElements(
    html,
    'div',
    (chunk) => /\bblock-dodsalgroup-corp-press-releases\b/i.test(chunk.slice(0, 500)),
    'remove generated press release blocks',
  );

  html = removePressNewsCardItems(html);

  html = removeByRegex(
    html,
    new RegExp(`<li\\b[^>]*>\\s*<a\\b[^>]*href=["'][^"']*${newsPath}[^"']*["'][^>]*>[\\s\\S]*?<\\/a>\\s*<\\/li>`, 'gi'),
    'remove listing links',
  );

  html = removeMatchingElements(
    html,
    'a',
    (chunk) => new RegExp(`href=["'][^"']*${newsPath}[^"']*["']`, 'i').test(chunk.slice(0, 500)),
    'remove section anchors',
  );

  html = removeMatchingElements(
    html,
    'a',
    (chunk) => new RegExp(`href=["'][^"']*${pressDetailPath}[^"']*["']`, 'i').test(chunk.slice(0, 500)),
    'remove detail anchors',
  );

  html = removeMatchingElements(
    html,
    'a',
    (chunk) => {
      const opening = chunk.slice(0, 500).toLowerCase();
      return opening.includes(`href="${convercentUrl}"`.toLowerCase())
        || opening.includes(`href='${convercentUrl}'`.toLowerCase());
    },
    'remove Convercent Helpline anchor',
  );

  html = removeMatchingElements(
    html,
    'a',
    (chunk) => new RegExp(latestNewsCta, 'i').test(chunk),
    'remove latest-news anchors',
  );

  html = removeMatchingElements(
    html,
    'div',
    (chunk) => /class=["'][^"']*\bsearch-keyword\b/i.test(chunk.slice(0, 250)) && /Press&#32;Releases|Press Releases/i.test(chunk),
    'remove Press Releases quick search keyword',
  );

  html = removeByRegex(
    html,
    /<li\b[^>]*>\s*<\/li>/gi,
    'remove empty list items',
  );

  return html;
}

function cleanupAssetText(content) {
  let next = content;
  const replacements = [
    [socialMenuClass, 'removed-social-menu'],
    ...socialLinkClasses.map((className) => [className, 'removed-social-link']),
    [newsPath, 'removed-section'],
    [pressDetailPath, 'removed-detail'],
    ['press_release_' + 'detail', 'removed_detail'],
    [newsLabel, ''],
    [latestNewsCta, ''],
    [convercentUrl, ''],
  ];

  for (const [search, replacement] of replacements) {
    next = next.split(search).join(replacement);
  }

  return next;
}

for (const relativePath of [
  `${newsPath}.html`,
  newsPath,
  pressDetailPath,
  path.join('taxonomy', 'term'),
]) {
  removePath(relativePath);
}

for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  report.htmlFilesProcessed += 1;
  const before = fs.readFileSync(file, 'utf8');
  const after = cleanupHtml(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    report.filesModified.push(path.relative(root, file));
  }
}

for (const file of walk(root)) {
  if (!/\.(css|js|json|txt|xml)(?:$|[?_-])/i.test(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = cleanupAssetText(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    report.filesModified.push(path.relative(root, file));
    record('clean asset marker references', 1);
  }
}

const taxonomyTermPath = path.join(root, 'taxonomy', 'term');
if (fs.existsSync(taxonomyTermPath)) {
  for (const file of walk(taxonomyTermPath).filter((candidate) => fs.existsSync(candidate))) {
    const content = fs.readFileSync(file, 'utf8');
    if (
      new RegExp(`${newsPath}|${pressDetailPath}|${latestNewsCta}|block-dodsalgroup-corp-theme-subscribepressreleaseblock`, 'i')
        .test(content)
    ) {
      fs.rmSync(file, { force: true });
      report.filesDeleted.push(path.relative(root, file));
    }
  }
}

console.log(JSON.stringify(report, null, 2));
