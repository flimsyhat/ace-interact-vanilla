import { hex2rgb, rgb2hex, createColorPicker } from './colorPicker.js';

// Number dragger remains unchanged.
export const numberDragger = {
  regexp: /-?\b\d+\.?\d*\b/g,
  cursor: 'ew-resize',
  onDrag: (text, setText, e) => {
    const currentValue = Number(text);
    const decimalPlaces = text.includes('.') ? text.split('.')[1].length : 0;
    const increment = Math.pow(0.1, decimalPlaces);
    const newVal = currentValue + (e.movementX * increment);
    if (isNaN(newVal)) return;
    setText(newVal.toFixed(decimalPlaces));
  }
};

export const booleanToggler = {
  regexp: /true|false/g,
  cursor: 'pointer',
  onClick: (text, setText) => {
    setText(text === 'true' ? 'false' : 'true');
  }
};

export const vec2Dragger = {
  regexp: /vec2\(-?\b\d+\.?\d*\b\s*(,\s*-?\b\d+\.?\d*\b)?\)/g,
  cursor: "move",
  onDrag: (text, setText, e) => {
    const res = /vec2\((?<x>-?\b\d+\.?\d*\b)\s*(,\s*(?<y>-?\b\d+\.?\d*\b))?\)/.exec(text);
    let x = Number(res && res.groups && res.groups.x);
    let y = Number(res && res.groups && res.groups.y);
    if (isNaN(x)) return;
    if (isNaN(y)) y = x;
    setText(`vec2(${x + e.movementX}, ${y + e.movementY})`);
  }
};

/*
  Updated colorPicker rule:
  - The regexp now matches either an rgb(…) string or a hex color (#abc or #aabbcc)
  - The onClick handler checks which format is used and calls the appropriate
    conversion functions. If the color is in RGB, the update will maintain that format.
    If it is hex, the update will remain hex.
*/
export const colorPicker = {
  // Matches either rgb(…) or hex colors (#RGB or #RRGGBB)
  regexp: /(?:rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)/g,
  cursor: "pointer",
	onClick: (text, setText, _e, target) => {
	  let hex;
	  let isRGB = false;
	  if (text.startsWith('rgb(')) {
	    const res = /rgb\(\s*(?<r>\d+)\s*,\s*(?<g>\d+)\s*,\s*(?<b>\d+)\s*\)/.exec(text);
	    if (!res || !res.groups) return;
	    const r = Number(res.groups.r);
	    const g = Number(res.groups.g);
	    const b = Number(res.groups.b);
	    if (isNaN(r) || isNaN(g) || isNaN(b)) return;
	    hex = rgb2hex(r, g, b);
	    isRGB = true;
	  } else if (text.startsWith('#')) {
	    hex = text;
	  } else {
	    return;
	  }
	  let pickerElement = null;
	  createColorPicker(
	    target.editor,
	    {
	      row: target.pos.row,
	      column: target.pos.column + text.length
	    },
	    hex,
	    (newColor) => {
	      const newText = isRGB
	        ? `rgb(${hex2rgb(newColor).join(', ')})`
	        : newColor;
	      setText(newText);
	      if (pickerElement) {
	        const coords = target.editor.renderer.textToScreenCoordinates(
	          target.pos.row,
	          target.pos.column + newText.length
	        );
	        pickerElement.style.left = `${coords.pageX}px`;
	      }
	    }
	  );
	  pickerElement = document.querySelector('.ace-color-picker');
	}
};

export const urlClicker = {
  regexp: /https?:\/\/[^ "']+/g,
  cursor: "pointer",
  className: "cm-interact-url",
  onClick: (text) => {
    window.open(text);
  }
};

export const defaultRules = [
  numberDragger,
  booleanToggler,
  vec2Dragger,
  colorPicker,
  urlClicker
];