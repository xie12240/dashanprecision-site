"""Run with python tests/acceptance.py. No network or third-party packages."""
import hashlib
import json
import re
import sys
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
EMAIL = 'xie12240@gmail.com'
PHONE = '8618122936992'
PRIMARY = 'Get a free quote'
WHATSAPP = 'WhatsApp the factory — usually reply in 24h'
NAV = ['Home', 'Capabilities', 'Factory', 'FAQ', 'Contact']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
failures = []
checks = 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        failures.append(message)


def label(element):
    return ' '.join(element['text'].split())


def classes(element):
    return element['attrs'].get('class', '').split()


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.stack = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        element = {'tag': tag, 'attrs': dict(attrs), 'parents': tuple(self.stack), 'text': '', 'line': self.getpos()[0]}
        self.elements.append(element)
        if tag not in VOID:
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        for element in self.stack:
            element['text'] += data


def local_reference(path, value):
    value = value.strip()
    parsed = urlsplit(value)
    if not value or parsed.scheme or parsed.netloc or value.startswith('#'):
        return
    location = unquote(parsed.path)
    target = (ROOT / location.lstrip('/')) if location.startswith('/') else (path.parent / location)
    if target.is_dir():
        target = target / 'index.html'
    check(target.is_file(), f'{path.relative_to(ROOT)}: missing local reference {value}')


def image_refs(element):
    attrs = element['attrs']
    refs = [attrs['src']] if attrs.get('src') else []
    refs += [item.strip().split()[0] for item in attrs.get('srcset', '').split(',') if item.strip()]
    return refs


def check_whatsapp(value, location):
    parsed = urlsplit(value)
    if parsed.hostname not in {'wa.me', 'api.whatsapp.com'}:
        return False
    phone = parsed.path.strip('/') if parsed.hostname == 'wa.me' else parse_qs(parsed.query).get('phone', [''])[0]
    check(re.sub(r'\D', '', phone) == PHONE, f'{location}: wrong WhatsApp number')
    text = parse_qs(parsed.query).get('text', [''])[0]
    check(not re.search(r'drawings?|图纸|圖紙', text, re.I), f'{location}: first-touch WhatsApp prefill asks for drawings')
    return True


def main():
    public = [path for path in ROOT.rglob('*') if path.is_file()
              and not any(part in {'.git', 'tests', 'docs', 'node_modules', 'work'} for part in path.relative_to(ROOT).parts)
              and path.suffix.lower() in {'.html', '.js', '.json', '.xml', '.css', '.txt', '.yaml', '.yml', '.toml'}]
    check(bool(public), 'No public files found')
    pages = {}
    for path in public:
        source = path.read_text(encoding='utf-8-sig')
        name = str(path.relative_to(ROOT))
        decoded = unescape(re.sub(r'\\u([0-9a-fA-F]{4})', lambda match: chr(int(match[1], 16)), source))
        check(not re.search(r'medical|healthcare|医[疗用学]|醫[療用學]|临床|臨床', decoded, re.I), f'{name}: prohibited industry text')
        check('formsubmit' not in source.lower(), f'{name}: formsubmit remains')
        without_placeholders = re.sub(r'placeholder\s*=\s*([\'"]).*?\1', '', source, flags=re.S)
        for email in set(re.findall(r'[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}', without_placeholders)):
            check(email == EMAIL, f'{name}: unexpected contact email {email}')
        for phone in re.findall(r'\+86(?:[\s-]*\d){10,}', source):
            check(re.sub(r'\D', '', phone) == PHONE, f'{name}: unexpected contact number {phone}')
        for value in re.findall(r'https?://(?:wa\.me|api\.whatsapp\.com)/[^\s\'"<>]+', source):
            check_whatsapp(unescape(value), name)
        if path.suffix == '.json':
            try:
                json.loads(source)
            except ValueError as error:
                check(False, f'{name}: invalid JSON ({error})')
        if path.suffix == '.css':
            for value in re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)', source):
                local_reference(path, value)
        if path.suffix != '.html':
            continue
        page = Page(source)
        pages[path.name] = page
        anchors = [element for element in page.elements if element['tag'] == 'a']
        nav = [label(anchor) for anchor in anchors if any(parent['tag'] == 'ul' for parent in anchor['parents'])
               and any(parent['tag'] in {'header', 'nav'} for parent in anchor['parents'])]
        check(nav == NAV, f'{name}: navigation must be {NAV}; found {nav}')
        primary = [anchor for anchor in anchors if 'btn-primary' in classes(anchor)]
        check(bool(primary), f'{name}: missing primary quote CTA')
        for anchor in primary:
            check(anchor['attrs'].get('href') == 'contact.html' and label(anchor) == PRIMARY,
                  f'{name}:{anchor["line"]}: primary CTA label/target changed')
        check(EMAIL in source and '+86 181 2293 6992' in source, f'{name}: missing owner contact')
        for element in page.elements:
            attrs = element['attrs']
            where = f'{name}:{element["line"]}'
            check(not (element['tag'] == 'input' and attrs.get('type', '').lower() == 'file'), f'{where}: file upload input remains')
            for key in ('src', 'href', 'action', 'poster', 'data-src'):
                if attrs.get(key):
                    local_reference(path, attrs[key])
            if attrs.get('srcset'):
                for value in image_refs(element):
                    local_reference(path, value)
            if attrs.get('style'):
                for value in re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)', attrs['style']):
                    local_reference(path, value)
            if element['tag'] in {'a', 'button'}:
                check(not re.search(r'upload\s+(?:your\s+)?rfq|(?:whatsapp|send)\s+(?:your\s+)?drawings?', label(element), re.I),
                      f'{where}: button demands drawings at first contact')
            if element['tag'] == 'a':
                href = attrs.get('href', '')
                if href.startswith('mailto:'):
                    check(urlsplit(href).path == EMAIL, f'{where}: wrong mailto contact')
                if check_whatsapp(href, where) and 'btn' in classes(element):
                    compact = 'wa-float' in classes(element) or any('m-cta' in classes(parent) for parent in element['parents'])
                    allowed = {WHATSAPP, 'WhatsApp'} if compact else {WHATSAPP}
                    check(label(element) in allowed, f'{where}: WhatsApp CTA label changed')
                if any('m-cta' in classes(parent) for parent in element['parents']):
                    if urlsplit(href).path == 'contact.html':
                        check(label(element) == PRIMARY, f'{where}: mobile quote label changed')
            if element['tag'] == 'script' and attrs.get('type') == 'application/ld+json':
                try:
                    json.loads(element['text'])
                except ValueError as error:
                    check(False, f'{where}: invalid JSON-LD ({error})')
            if element['tag'] in {'img', 'source'} and any('assets/images/ai/' in value for value in image_refs(element)):
                zone = next((parent for parent in reversed(element['parents']) if parent['tag'] == 'section'), None)
                check(zone is not None and re.search(r'illustrative\s+only', zone['text'], re.I), f'{where}: AI image needs a separate Illustrative only zone')
                check(zone is None or not re.search(r'real\s+photographs?', zone['text'], re.I), f'{where}: AI image is labeled as a real photograph')

    check(not (ROOT / 'medical-devices.html').exists(), 'Removed page still exists')
    check(not list((ROOT / 'assets/images/ai').glob('medical-auto*')), 'Removed illustrative assets still exist')
    home = pages.get('index.html')
    check(home is not None, 'Homepage missing')
    if home:
        h1 = [label(element) for element in home.elements if element['tag'] == 'h1']
        check(h1 == ['From your drawings to real plastic parts.'], 'Homepage manufacturing message changed')
        check(any('Custom injection molds · Dongguan, China' in label(element) for element in home.elements), 'Homepage needs its manufacturing/location eyebrow')
        hero_images = [element for element in home.elements if element['tag'] in {'img', 'source'}
                       and any('hero' in classes(parent) for parent in element['parents'])]
        check(bool(hero_images), 'Homepage hero needs an authentic workshop photo')
        trust_images = hero_images + [element for element in home.elements if element['tag'] in {'img', 'source'}
                                     and any(parent['attrs'].get('id') == 'factory-preview' for parent in element['parents'])]
        for element in trust_images:
            for value in image_refs(element):
                check(value.startswith('assets/images/factory/'), f'Homepage trust image is outside authentic photo path: {value}')
        mobile = [anchor for anchor in home.elements if anchor['tag'] == 'a' and anchor['attrs'].get('href') == 'contact.html'
                  and any('m-cta' in classes(parent) for parent in anchor['parents'])]
        check(bool(mobile), 'Homepage mobile quote CTA missing')

    factory = ROOT / 'assets/images/factory'
    manifest_path = factory / 'provenance.json'
    check(manifest_path.is_file(), 'Photo provenance missing')
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        originals = manifest['originals']
        derivatives = manifest.get('derivatives', [])
        check(bool(originals), 'No authentic originals recorded')
        original_names = {item['file'] for item in originals}
        dimensions = {item['file']: item['dimensions'] for item in originals + derivatives}
        check(not any('AI生成图' in str(path.relative_to(factory)) or '营业执照' in path.name or path.suffix.lower() == '.pdf'
                      for path in factory.rglob('*')), 'Excluded source material entered the authentic factory photo folder')
        for item in originals + derivatives:
            photo = factory / item['file']
            check(photo.is_file(), f'Missing provenance photo: {item["file"]}')
            if photo.is_file():
                check(hashlib.sha256(photo.read_bytes()).hexdigest() == item['sha256'], f'Photo SHA256 mismatch: {item["file"]}')
            check('AI生成图' not in item['source'] and '营业执照' not in item['source'], f'Untrusted photo in provenance: {item["source"]}')
        for item in derivatives:
            check(item['source'] in original_names, f'Derivative has no copied source: {item["file"]}')
        for page_name, page in pages.items():
            for element in page.elements:
                attrs = element['attrs']
                if element['tag'] == 'img' and attrs.get('src', '').startswith('assets/images/factory/'):
                    expected = dimensions.get(Path(attrs['src']).name)
                    check(expected is not None, f'{page_name}: image missing provenance {attrs["src"]}')
                    if expected and attrs.get('width') and attrs.get('height'):
                        actual = [int(attrs['width']), int(attrs['height'])]
                        check(actual[0] * expected[1] == actual[1] * expected[0], f'{page_name}:{element["line"]}: incorrect image aspect ratio for {attrs["src"]}')

    sitemap = ROOT / 'sitemap.xml'
    if sitemap.exists():
        for location in ElementTree.parse(sitemap).findall('.//{*}loc'):
            parsed = urlsplit(location.text or '')
            if parsed.hostname in {'dashanprecision.com', 'www.dashanprecision.com'}:
                local_reference(sitemap, parsed.path or '/')
    if failures:
        for message in failures:
            print(f'FAIL: {message}')
        print(f'FAILED: {len(failures)} of {checks} checks')
        return 1
    print(f'PASS: {checks} checks across {len(pages)} HTML pages; owner contact, locked CTAs, trust photos, links and provenance verified.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
