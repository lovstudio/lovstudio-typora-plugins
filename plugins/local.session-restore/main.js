const core = window[Symbol.for('typora-plugin-core@v2')];
const { Plugin } = core;

const SESSION_STATE_KEY = 'local.session-restore.state';
const LEGACY_SESSION_STATE_KEY = 'local.image-fit-viewer.session-state';

export default class SessionRestorePlugin extends Plugin {
  onload() {
    this.sessionSaveTimer = 0;
    this.isRestoring = false;

    this.registerDomEvent(document, 'selectionchange', () => this.scheduleSessionSave());
    this.registerDomEvent(document, 'keyup', () => this.scheduleSessionSave(), { capture: true });
    this.registerDomEvent(document, 'mouseup', () => this.scheduleSessionSave(), { capture: true });
    this.registerDomEvent(document, 'scroll', () => this.scheduleSessionSave(), { capture: true });
    this.registerDomEvent(window, 'beforeunload', () => this.saveSessionState());
    this.registerDomEvent(document, 'visibilitychange', () => {
      if (document.hidden) this.saveSessionState();
    });
    this.registerInterval(window.setInterval(() => this.saveSessionState(), 5000));

    if (this.app?.workspace?.on) {
      this.register(this.app.workspace.on('file:open', (file) => {
        setTimeout(() => {
          const state = this.readSessionState();
          if (state && this.samePath(state.file, file)) {
            this.restoreViewState(state);
          }
        }, 400);
      }));
    }

    setTimeout(() => this.restoreLastView(), 800);
    setTimeout(() => this.restoreLastView(), 1800);
  }

  onunload() {
    clearTimeout(this.sessionSaveTimer);
    this.saveSessionState();
  }

  restoreLastView() {
    const state = this.readSessionState();
    if (!state?.file) return;

    const activeFile = this.getActiveFile();
    if (activeFile) {
      if (this.samePath(activeFile, state.file)) {
        this.restoreViewState(state);
      }
      return;
    }

    this.openFile(state.file);
    setTimeout(() => this.restoreViewState(state), 700);
  }

  scheduleSessionSave() {
    if (this.isRestoring) return;
    clearTimeout(this.sessionSaveTimer);
    this.sessionSaveTimer = window.setTimeout(() => this.saveSessionState(), 250);
  }

  saveSessionState(overrides = {}) {
    if (this.isRestoring) return;

    const file = this.getActiveFile();
    if (!file) return;

    const previous = this.readSessionState();
    const cursor = this.captureCursorState()
      || (previous && this.samePath(previous.file, file) ? previous.cursor : null);
    const state = {
      file,
      scrollTop: this.getScrollTop(),
      cursor,
      updatedAt: Date.now(),
      ...overrides,
    };

    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state));
  }

  restoreViewState(state) {
    this.isRestoring = true;
    this.restoreScroll(state.scrollTop);
    this.restoreCursor(state.cursor);

    window.setTimeout(() => {
      this.isRestoring = false;
    }, 2500);
  }

  readSessionState() {
    for (const key of [SESSION_STATE_KEY, LEGACY_SESSION_STATE_KEY]) {
      try {
        const state = JSON.parse(localStorage.getItem(key) || 'null');
        if (state?.file) return state;
      }
      catch {
        // Ignore corrupt session state and continue with the next key.
      }
    }

    return null;
  }

  getActiveFile() {
    return this.app?.workspace?.activeFile
      || window.File?.filePath
      || window.File?.bundle?.filePath
      || '';
  }

  openFile(file) {
    if (this.app?.openFile) {
      this.app.openFile(file);
      return;
    }

    window.editor?.library?.openFile?.(file);
  }

  getScrollContainer() {
    return window.editor?.writingArea?.parentElement
      || document.querySelector('#write')?.parentElement
      || document.querySelector('content');
  }

  getScrollTop() {
    return this.getScrollContainer()?.scrollTop || 0;
  }

  restoreScroll(scrollTop, attempt = 0) {
    if (!Number.isFinite(scrollTop)) return;

    const container = this.getScrollContainer();
    if (!container) {
      if (attempt < 20) setTimeout(() => this.restoreScroll(scrollTop, attempt + 1), 150);
      return;
    }

    container.scrollTop = scrollTop;

    if (Math.abs(container.scrollTop - scrollTop) > 6 && attempt < 20) {
      setTimeout(() => this.restoreScroll(scrollTop, attempt + 1), 150);
    }
  }

  captureCursorState() {
    const editor = window.editor;
    const writingArea = editor?.writingArea;
    const selection = window.getSelection?.();
    if (!editor?.selection || !writingArea || !selection?.rangeCount) return null;

    const nativeRange = selection.getRangeAt(0);
    const typoraCursor = this.captureTyporaCursor(writingArea);
    if (typoraCursor) return typoraCursor;

    if (!writingArea.contains(nativeRange.startContainer)) return null;
    const textAround = this.getTextAroundCursor();
    return {
      type: 'native-range',
      startPath: this.getNodePath(writingArea, nativeRange.startContainer),
      startOffset: nativeRange.startOffset,
      endPath: this.getNodePath(writingArea, nativeRange.endContainer),
      endOffset: nativeRange.endOffset,
      collapsed: nativeRange.collapsed,
      focusCid: editor.focusCid || this.closestCid(nativeRange.startContainer),
      before: textAround.before,
      after: textAround.after,
    };
  }

  captureTyporaCursor(writingArea) {
    const editor = window.editor;

    try {
      const [before = '', after = '', cursorRange] = editor.selection.getTextAround();
      const container = cursorRange?.containerNode;
      const textNode = container?.firstChild || container;
      if (!container || !textNode || !writingArea.contains(container)) return null;

      return {
        type: 'typora-range',
        containerPath: this.getNodePath(writingArea, container),
        textNodePath: this.getNodePath(writingArea, textNode),
        startOffset: cursorRange.start,
        endOffset: cursorRange.end,
        collapsed: cursorRange.start === cursorRange.end,
        focusCid: editor.focusCid || this.closestCid(container),
        containerText: container.textContent || '',
        before: String(before).slice(-220),
        after: String(after).slice(0, 220),
      };
    }
    catch {
      return null;
    }
  }

  restoreCursor(cursor, attempt = 0) {
    if (!cursor) return;

    const editor = window.editor;
    const writingArea = editor?.writingArea;
    if (!editor?.selection || !writingArea) {
      if (attempt < 24) setTimeout(() => this.restoreCursor(cursor, attempt + 1), 150);
      return;
    }

    const restoredByTyporaRange = cursor.type === 'typora-range'
      && this.restoreTyporaCursor(cursor, writingArea);
    const restoredByContext = restoredByTyporaRange
      || this.restoreCursorByContext(cursor, writingArea);

    if (!restoredByContext && attempt < 24) {
      setTimeout(() => this.restoreCursor(cursor, attempt + 1), 150);
    }
  }

  restoreCursorByPath(cursor, writingArea) {
    const startNode = this.getNodeByPath(writingArea, cursor.startPath);
    const endNode = this.getNodeByPath(writingArea, cursor.endPath);
    if (!startNode || !endNode) return false;

    return this.selectRange(
      startNode,
      this.clampOffset(startNode, cursor.startOffset),
      endNode,
      this.clampOffset(endNode, cursor.endOffset)
    );
  }

  restoreTyporaCursor(cursor, writingArea) {
    if (cursor.type !== 'typora-range') return false;

    const point = this.resolveTyporaTextPoint(cursor, writingArea);
    if (!point) return false;

    return this.selectRange(
      point.node,
      this.clampOffset(point.node, point.baseOffset + cursor.startOffset),
      point.node,
      this.clampOffset(point.node, point.baseOffset + cursor.endOffset)
    );
  }

  resolveTyporaTextPoint(cursor, writingArea) {
    const byTextPath = this.getNodeByPath(writingArea, cursor.textNodePath);
    const byTextPoint = this.getTextPoint(byTextPath, cursor);
    if (byTextPoint) return byTextPoint;

    const byContainerPath = this.getNodeByPath(writingArea, cursor.containerPath);
    const containerTextNode = byContainerPath?.firstChild || byContainerPath;
    const byContainerPoint = this.getTextPoint(containerTextNode, cursor);
    if (byContainerPoint) return byContainerPoint;

    if (cursor.focusCid) {
      const focusNode = writingArea.querySelector(`[cid="${CSS.escape(cursor.focusCid)}"]`);
      const matched = this.findMatchingTextNode(focusNode, cursor);
      if (matched) return matched;
    }

    return this.findMatchingTextNode(writingArea, cursor);
  }

  findMatchingTextNode(root, cursor) {
    if (!root) return null;

    const expected = String(cursor.containerText || '');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const point = this.getTextPoint(node, cursor);
      if (point) return point;
    }

    return null;
  }

  getTextPoint(node, cursor) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;

    const text = node.nodeValue || '';
    const expected = String(cursor.containerText || '');
    if (!expected) return { node, baseOffset: 0 };

    if (text === expected) return { node, baseOffset: 0 };

    const index = text.indexOf(expected);
    if (index >= 0) return { node, baseOffset: index };

    return null;
  }

  restoreCursorByContext(cursor, writingArea) {
    const before = String(cursor.before || '');
    const after = String(cursor.after || '');
    if (!before && !after) return false;

    const textMap = this.buildTextMap(writingArea);
    if (!textMap.text) return false;

    const beforeTail = before.slice(-80);
    const afterHead = after.slice(0, 80);
    let offset = -1;

    if (beforeTail && afterHead) {
      const index = textMap.text.indexOf(beforeTail + afterHead);
      if (index >= 0) offset = index + beforeTail.length;
    }
    if (offset < 0 && beforeTail) {
      const index = textMap.text.lastIndexOf(beforeTail);
      if (index >= 0) offset = index + beforeTail.length;
    }
    if (offset < 0 && afterHead) {
      offset = textMap.text.indexOf(afterHead);
    }
    if (offset < 0) return false;

    const point = this.pointFromTextOffset(textMap.nodes, offset);
    return point ? this.selectRange(point.node, point.offset, point.node, point.offset) : false;
  }

  selectRange(startNode, startOffset, endNode, endOffset) {
    try {
      const range = window.editor.selection.rangy.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      window.editor.selection.setRange(range, true);
      range.select?.();
      this.focusEditor();
      this.keepCursorInView(startNode);
      return true;
    }
    catch (error) {
      console.warn('[Session Restore] Failed to restore cursor.', error);
      return false;
    }
  }

  getTextAroundCursor() {
    try {
      const [before = '', after = ''] = window.editor.selection.getTextAround();
      return {
        before: String(before).slice(-160),
        after: String(after).slice(0, 160),
      };
    }
    catch {
      return { before: '', after: '' };
    }
  }

  getNodePath(root, node) {
    const path = [];
    let current = node;

    while (current && current !== root) {
      const parent = current.parentNode;
      if (!parent) return null;
      path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
      current = parent;
    }

    return current === root ? path : null;
  }

  getNodeByPath(root, path) {
    if (!Array.isArray(path)) return null;

    return path.reduce((node, index) => node?.childNodes?.[index] || null, root);
  }

  closestCid(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return element?.closest?.('[cid]')?.getAttribute('cid') || '';
  }

  clampOffset(node, offset) {
    const max = node.nodeType === Node.TEXT_NODE
      ? node.nodeValue.length
      : node.childNodes.length;

    return Math.max(0, Math.min(Number(offset) || 0, max));
  }

  buildTextMap(root) {
    const nodes = [];
    let text = '';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const start = text.length;
      text += node.nodeValue || '';
      nodes.push({ node, start, end: text.length });
    }

    return { text, nodes };
  }

  pointFromTextOffset(nodes, offset) {
    for (const item of nodes) {
      if (offset <= item.end) {
        return {
          node: item.node,
          offset: Math.max(0, Math.min(offset - item.start, item.node.nodeValue.length)),
        };
      }
    }

    const last = nodes[nodes.length - 1];
    return last
      ? { node: last.node, offset: last.node.nodeValue.length }
      : null;
  }

  focusEditor() {
    const writingArea = window.editor?.writingArea;
    writingArea?.focus?.();
  }

  keepCursorInView(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  samePath(a, b) {
    return this.normalizePath(a) === this.normalizePath(b);
  }

  normalizePath(path) {
    return this.safeDecode(String(path || ''))
      .replace(/^file:\/\//, '')
      .replace(/\\/g, '/')
      .replace(/\/+$/, '');
  }

  safeDecode(value) {
    try {
      return decodeURIComponent(value);
    }
    catch {
      return value;
    }
  }
}
