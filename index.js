import { setupInteract } from '../src/interact.js';
import { defaultRules } from '../src/rules.js';

const doc = `
// hold Alt and drag / click values
const a = 123
const b = vec2(20, 80)
const c = vec2(60)
const d = rgb(128, 128, 255)
const e = '#7CACBF'
const f = false
const g = 'http://example.com'
`.trim();

const editor = ace.edit('editor');
editor.session.setValue(doc);
editor.setTheme('ace/theme/monokai');
editor.session.setMode('ace/mode/javascript');

setupInteract(editor, {
  rules: defaultRules,
  key: "alt"
});