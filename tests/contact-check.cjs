// Run: node tests/contact-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
assert(!/type=["']file["']|formsubmit|multipart/i.test(html + source));
assert(html.includes('mailto:xie12240@gmail.com?subject=Drawing%20for%20quote'));

let submit, initialize, valid = true, prevented = false;
const fields = {
  name: '陈 & Alex', company: 'ACME <parts>', email: 'buyer@example.com',
  whatsapp: '+1 234 567 890', interest: 'Injection molding service',
  message: 'A & B part\nQuantity: 500\nFinish: #blue?'
};
const form = {
  reportValidity: () => valid,
  addEventListener: (type, handler) => { if (type === 'submit') submit = handler; }
};
const elements = {
  rfq: form, 'draft-message': { value: '' }, 'draft-link': { href: '' },
  'draft-status': { textContent: '' }, 'draft-preview': { hidden: true }
};
const window = { location: { href: 'https://www.dashanprecision.com/contact.html' } };
vm.runInNewContext(source, {
  document: {
    documentElement: { lang: 'en' },
    querySelector: () => null,
    getElementById: id => elements[id] || null,
    addEventListener: (type, handler) => { if (type === 'DOMContentLoaded') initialize = handler; }
  },
  window,
  FormData: class { constructor(value) { assert.equal(value, form); } get(name) { return fields[name]; } }
});
initialize();
const event = { preventDefault: () => { prevented = true; } };
valid = false;
submit(event);
assert(prevented);
assert(elements['draft-preview'].hidden);
assert.equal(window.location.href, 'https://www.dashanprecision.com/contact.html');

valid = true;
submit(event);
const mail = new URL(window.location.href);
assert.equal(mail.protocol, 'mailto:');
assert.equal(mail.pathname, 'xie12240@gmail.com');
assert.equal(mail.searchParams.get('subject'), 'Drawing for quote');
assert.equal(mail.searchParams.get('body'), elements['draft-message'].value);
assert(mail.searchParams.get('body').includes(fields.message));
assert(mail.searchParams.get('body').includes(fields.name));
assert.equal(elements['draft-link'].href, window.location.href);
assert.equal(elements['draft-preview'].hidden, false);
assert(elements['draft-status'].textContent.includes('has not sent'));
assert.equal(fields.message, 'A & B part\nQuantity: 500\nFinish: #blue?');

fields.message = 'Updated project';
submit(event);
assert(new URL(window.location.href).searchParams.get('body').endsWith('Updated project'));
console.log('Contact check passed: validation, encoded draft, preserved text and honest status.');
