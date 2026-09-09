import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const pages = [
  "index", "capabilities", "industries", "factory", "faq", "contact", "thanks",
  "electronics", "home-appliances", "automotive-parts", "toys-collectibles", "medical-devices"
].map(n => `${n}.html`);

function metaProp(content, prop) {
  const tag = content.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*>`));
  if (!tag) return null;
  const m = tag[0].match(/content=["']([^"']*)["']/);
  return m ? m[1] : null;
}
function metaName(content, name) {
  const tag = content.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*>`));
  if (!tag) return null;
  const m = tag[0].match(/content=["']([^"']*)["']/);
  return m ? m[1] : null;
}

test("every page exposes Open Graph and Twitter cards", () => {
  for (const page of pages) {
    const content = fs.readFileSync(path.join(root, page), "utf8");
    assert.ok(metaProp(content, "og:title"), `${page}: og:title missing`);
    assert.ok(metaProp(content, "og:description"), `${page}: og:description missing`);
    const image = metaProp(content, "og:image");
    assert.ok(image && image.startsWith("https://www.dashanprecision.com/"), `${page}: og:image missing or not absolute`);
    assert.equal(metaProp(content, "og:type"), "website", `${page}: og:type not website`);
    assert.equal(metaName(content, "twitter:card"), "summary_large_image", `${page}: twitter:card missing`);
    assert.ok(metaProp(content, "twitter:image"), `${page}: twitter:image missing`);
  }
});

test("thanks page has a non-empty meta description", () => {
  const content = fs.readFileSync(path.join(root, "thanks.html"), "utf8");
  const desc = metaName(content, "description");
  assert.ok(desc && desc.trim().length > 0, "thanks.html meta description missing");
});

test("sitemap lists all indexed pages with a lastmod", () => {
  const content = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  const urls = content.match(/<url>/g) || [];
  assert.equal(urls.length, 11, "expected 11 indexed urls");
  const blocks = [...content.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  assert.equal(blocks.length, 11, "expected 11 url blocks");
  const missingLastmod = blocks.filter(b => !/<lastmod>/.test(b[1])).length;
  assert.equal(missingLastmod, 0, "some url blocks lack <lastmod>");
});