export function createColorPicker(editor, position, value, onChange) {
  // Remove any existing color pickers first
  document.querySelectorAll('.ace-color-picker').forEach(el => el.remove());

  const lineHeight = editor.renderer.lineHeight;
  const coords = editor.renderer.textToScreenCoordinates(position.row, position.column);

  const wrapper = document.createElement('div');
  wrapper.className = 'ace-color-picker';
  wrapper.style.left = `${coords.pageX}px`;
  wrapper.style.top = `${coords.pageY}px`;
  wrapper.style.width = `${lineHeight}px`;
  wrapper.style.height = `${lineHeight}px`;

  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;

  let isPickerOpen = false;

  input.addEventListener('input', (e) => {
    const el = e.target;
    if (el.value) {
      onChange(el.value);
    }
  });

  input.addEventListener('change', (e) => {
    const el = e.target;
    if (el.value) {
      onChange(el.value);
    }
  });

  // Handle clicks outside the color picker
  const handleOutsideClick = (e) => {
    if (!isPickerOpen) return;

    const target = e.target;
    if (!wrapper.contains(target) && !target.closest('.color-well-container')) {
      wrapper.remove();
      document.removeEventListener('mousedown', handleOutsideClick);
    }
  };

  document.addEventListener('mousedown', handleOutsideClick);

  wrapper.appendChild(input);
  document.body.appendChild(wrapper);

  // Set flag after a small delay to allow initial click
  setTimeout(() => {
    input.click();
    isPickerOpen = true;
  }, 100);
}

export const hex2rgb = (hex) => {
  const v = parseInt(hex.substring(1), 16);
  return [
    (v >> 16) & 255,
    (v >> 8) & 255,
    v & 255,
  ];
};

export const rgb2hex = (r, g, b) =>
  '#' + r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0');