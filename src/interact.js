class InteractHandler {
  constructor(editor, config = {}) {
    this.editor = editor;
    this.target = null;
    this.dragging = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.rules = config.rules || [];
    this.modKey = config.key || "alt";
    this.markers = [];

    this.editor.setReadOnly(false);
    this.setupEventListeners();

    document.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        this.handleMouseMove(e);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (this.dragging) {
        this.handleMouseUp(e);
      }
    });
  }

  setupEventListeners() {
    const content = this.editor.container.querySelector('.ace_content');
    if (!content) {
      console.error('Could not find Ace content element');
      return;
    }
    
    content.addEventListener('mousemove', this.handleMouseMove);
    content.addEventListener('mousedown', this.handleMouseDown);
    content.addEventListener('mouseup', this.handleMouseUp);
    content.addEventListener('mouseleave', this.handleMouseLeave);
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  handleMouseMove = (e) => {
    if (this.isModKeyDown(e)) {
      e.preventDefault();  // Prevent cursor movement
      e.stopPropagation(); // Stop event bubbling
    }

    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    if (!this.isModKeyDown(e)) {
      if (this.target) {
        this.setTarget(null);
      }
      return;
    }

    if (this.target && this.dragging) {
      if (this.target.rule.onDrag) {
        this.target.rule.onDrag(
          this.target.text,
          this.updateText(this.target),
          e
        );
      }
    } else {
      this.setTarget(this.getMatch());
    }
  };

  getMatch() {
    const position = this.editor.renderer.screenToTextCoordinates(this.mouseX, this.mouseY);
    const line = this.editor.session.getLine(position.row);
    let match = null;

    for (const rule of this.rules) {
      for (const m of line.matchAll(rule.regexp)) {
        if (m.index === undefined) continue;
        const text = m[0];
        if (!text) continue;
        
        const start = m.index;
        const end = m.index + text.length;
        
        if (position.column < start || position.column > end) {
          continue;
        }

        if (!match || text.length < match.text.length) {
          const range = new ace.Range(
            position.row, start,
            position.row, end
          );
          
          match = {
            rule,
            pos: { row: position.row, column: start },
            text,
            range,
            editor: this.editor
          };
        }
      }
    }

    return match;
  }

  setTarget(target) {
    this.markers.forEach(id => {
      this.editor.session.removeMarker(id);
    });
    this.markers = [];

    this.target = target;
    
    if (target) {
      const marker = this.editor.session.addMarker(
        target.range,
        `ace-interact ${target.rule.className || ''}`,
        "text",
        false
      );
      this.markers.push(marker);
      
      if (target.rule.cursor) {
        this.editor.container.style.cursor = target.rule.cursor;
      }
    } else {
      this.editor.container.style.cursor = '';
    }
  }

  updateText(target) {
    return (text) => {
      try {
        this.editor.session.replace(target.range, text);
        target.text = text;
        
        this.markers.forEach(id => {
          this.editor.session.removeMarker(id);
        });
        this.markers = [];
        
        target.range = new ace.Range(
          target.range.start.row,
          target.range.start.column,
          target.range.start.row,
          target.range.start.column + text.length
        );
        
        const marker = this.editor.session.addMarker(
          target.range,
          `ace-interact ${target.rule.className || ''}`,
          "text",
          false
        );
        this.markers.push(marker);
        
      } catch (error) {
        console.error('Failed to update text:', error);
      }
    };
  }

  isModKeyDown(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    let result;
    switch (this.modKey) {
      case "alt":
        result = e.altKey;
        break;
      case "shift":
        result = e.shiftKey;
        break;
      case "ctrl":
        result = e.ctrlKey;
        break;
      case "meta":
        result = e.metaKey;
        break;
      case "mod":
        result = isMac ? e.metaKey : e.ctrlKey;
        break;
      default:
        result = false;
    }
    return result;
  }

  handleMouseDown = (e) => {
    if (!this.isModKeyDown(e) || !this.target) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.target.rule.onClick) {
      this.target.rule.onClick(
        this.target.text,
        this.updateText(this.target),
        e,
        this.target
      );
    }

    if (this.target.rule.onDrag) {
      this.startDrag(e);
    }
  };

  handleMouseUp = (e) => {
    this.endDrag();

    if (this.target && !this.isModKeyDown(e)) {
      this.setTarget(null);
    }

    if (this.isModKeyDown(e)) {
      this.setTarget(this.getMatch());
    }
  };

  handleMouseLeave = () => {
    this.endDrag();
    if (this.target) {
      this.setTarget(null);
    }
  };

  handleKeyDown = (e) => {
    if (this.isModKeyDown(e)) {
      this.editor.container.classList.add('ace-interact-active');
      if (!this.target) {
        this.setTarget(this.getMatch());
      }
    }
  };

  handleKeyUp = (e) => {
    if (!this.isModKeyDown(e)) {
      this.editor.container.classList.remove('ace-interact-active');
      if (this.target) {
        this.endDrag();
        this.setTarget(null);
      }
    }
  };

  startDrag(e) {
    if (this.dragging) return;
    if (!this.target) return;
    
    this.dragging = true;
    
    if (this.target.rule.onDragStart) {
      this.target.rule.onDragStart(
        this.target.text,
        this.updateText(this.target),
        e
      );
    }
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    
    if (this.target && this.target.rule.onDragEnd) {
      this.target.rule.onDragEnd(
        this.target.text,
        this.updateText(this.target)
      );
    }
  }

  destroy() {
    const content = this.editor.container.querySelector('.ace_content');
    if (content) {
      content.removeEventListener('mousemove', this.handleMouseMove);
      content.removeEventListener('mousedown', this.handleMouseDown);
      content.removeEventListener('mouseup', this.handleMouseUp);
      content.removeEventListener('mouseleave', this.handleMouseLeave);
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    this.markers.forEach(id => this.editor.session.removeMarker(id));
    this.markers = [];
  }
}

function setupInteract(editor, config = {}) {
	return new InteractHandler(editor, config);
}

export { setupInteract, InteractHandler };