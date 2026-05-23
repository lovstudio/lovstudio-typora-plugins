const core = window[Symbol.for('typora-plugin-core@v2')];
const { Plugin } = core;

export default class ImageFitViewerPlugin extends Plugin {
  onload() {
    this.overlay = null;

    this.registerDomEvent(document, 'dblclick', (event) => {
      const image = this.findImage(event.target);
      if (!image || !image.src) return;

      event.preventDefault();
      event.stopPropagation();
      this.openViewer(image);
    }, { capture: true });

    this.registerDomEvent(document, 'keydown', (event) => {
      if (event.key === 'Escape') this.closeViewer();
    });
  }

  onunload() {
    this.closeViewer();
  }

  findImage(target) {
    if (!(target instanceof Element)) return null;

    if (target.matches('#write img')) return target;

    const imageContainer = target.closest('#write .md-image');
    if (imageContainer) return imageContainer.querySelector('img');

    return target.closest('#write img');
  }

  openViewer(sourceImage) {
    this.closeViewer();

    const overlay = document.createElement('div');
    overlay.className = 'typora-image-fit-viewer-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const frame = document.createElement('div');
    frame.className = 'typora-image-fit-viewer-frame';

    const preview = document.createElement('div');
    preview.className = 'typora-image-fit-viewer-preview';

    const image = document.createElement('img');
    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt || '';
    image.draggable = false;

    const form = document.createElement('form');
    form.className = 'typora-image-fit-viewer-alt-form';

    const label = document.createElement('label');
    label.className = 'typora-image-fit-viewer-alt-label';
    label.textContent = 'Alt';

    const input = document.createElement('input');
    input.className = 'typora-image-fit-viewer-alt-input';
    input.type = 'text';
    input.value = sourceImage.alt || '';
    input.placeholder = '图片描述';

    const status = document.createElement('span');
    status.className = 'typora-image-fit-viewer-alt-status';

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = '保存';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '关闭';

    form.append(label, input, status, saveButton, closeButton);
    preview.appendChild(image);
    frame.append(preview, form);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    this.overlay = overlay;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target === preview) {
        this.closeViewer();
      }
    });
    form.addEventListener('click', (event) => event.stopPropagation());
    form.addEventListener('dblclick', (event) => event.stopPropagation());
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = '';

      try {
        this.saveAlt(sourceImage, input.value);
        image.alt = input.value;
        this.closeViewer();
      }
      catch (error) {
        console.error('[Image Fit Viewer] Failed to save alt.', error);
        status.textContent = '未找到对应图片';
      }
    });
    closeButton.addEventListener('click', () => this.closeViewer());
    image.addEventListener('click', (event) => event.stopPropagation());
    image.addEventListener('dblclick', () => this.closeViewer());
    setTimeout(() => input.focus());
  }

  closeViewer() {
    this.overlay?.remove();
    this.overlay = null;
  }

  saveAlt(sourceImage, alt) {
    const markdown = this.getMarkdown();
    const candidates = this.getSourceCandidates(sourceImage);
    const oldAlt = sourceImage.alt || '';
    const updated = this.replaceImageAlt(markdown, candidates, oldAlt, alt);
    const scrollTop = this.getScrollTop();

    if (updated === markdown) {
      throw new Error('Image markdown not found.');
    }

    sourceImage.alt = alt;
    this.setMarkdown(updated);
    this.restoreScroll(scrollTop);
  }

  getMarkdown() {
    return this.app?.features?.markdownEditor?.getMarkdown?.()
      || window.editor?.getMarkdown?.()
      || window.getMarkdown?.();
  }

  setMarkdown(markdown) {
    if (this.app?.features?.markdownEditor?.setMarkdown) {
      this.app.features.markdownEditor.setMarkdown(markdown);
      return;
    }

    window.File?.reloadContent?.(markdown, false, true, false, true);
  }

  getSourceCandidates(image) {
    const container = image.closest('.md-image');
    const nodes = [image, container].filter(Boolean);
    const attrs = [
      'src',
      'href',
      'data-src',
      'data-original-src',
      'data-original',
      'data-url',
      'md-src',
      'md-img-src',
    ];
    const candidates = [
      image.currentSrc,
      image.src,
      image.getAttribute('src'),
    ];

    for (const node of nodes) {
      for (const attr of attrs) {
        candidates.push(node.getAttribute(attr));
      }
    }

    return Array.from(new Set(
      candidates
        .filter(Boolean)
        .flatMap((value) => this.sourceVariants(value))
        .filter(Boolean)
    ));
  }

  replaceImageAlt(markdown, candidates, oldAlt, newAlt) {
    const images = this.findMarkdownImages(markdown)
      .filter((image) => this.sourceMatches(image.source, candidates));
    const sameAlt = images.filter((image) => image.alt === oldAlt);
    const [target] = sameAlt.length ? sameAlt : images;

    if (!target) return markdown;

    return markdown.slice(0, target.altStart)
      + this.escapeAlt(newAlt)
      + markdown.slice(target.altEnd);
  }

  findMarkdownImages(markdown) {
    const images = [];
    let index = 0;

    while ((index = markdown.indexOf('![', index)) !== -1) {
      const altStart = index + 2;
      const alt = this.readBalanced(markdown, altStart, '[', ']');
      if (!alt) {
        index += 2;
        continue;
      }

      let cursor = alt.end + 1;
      while (/\s/.test(markdown[cursor])) cursor++;

      if (markdown[cursor] !== '(') {
        index = cursor + 1;
        continue;
      }

      const destination = this.readBalanced(markdown, cursor + 1, '(', ')');
      if (!destination) {
        index = cursor + 1;
        continue;
      }

      images.push({
        start: index,
        end: destination.end + 1,
        altStart,
        altEnd: alt.end,
        alt: this.unescapeMarkdown(alt.value),
        source: this.extractSource(destination.value),
      });
      index = destination.end + 1;
    }

    return images;
  }

  readBalanced(text, start, open, close) {
    let value = '';
    let depth = 0;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (char === '\\') {
        value += char + (text[i + 1] || '');
        i++;
        continue;
      }
      if (char === open) depth++;
      if (char === close) {
        if (depth === 0) return { value, end: i };
        depth--;
      }

      value += char;
    }

    return null;
  }

  extractSource(destination) {
    const value = destination.trim();

    if (value.startsWith('<')) {
      return this.unescapeMarkdown(value.slice(1, value.indexOf('>')));
    }

    const match = value.match(/^(?:\\.|[^\s])+/);
    return this.unescapeMarkdown(match?.[0] || value);
  }

  sourceMatches(source, candidates) {
    const variants = this.sourceVariants(source);
    return variants.some((variant) =>
      candidates.some((candidate) =>
        variant === candidate
        || variant.endsWith('/' + candidate)
        || candidate.endsWith('/' + variant)
      )
    );
  }

  sourceVariants(source) {
    const values = [];
    const raw = String(source || '').trim().replace(/^<|>$/g, '');
    if (!raw) return values;

    values.push(raw);
    values.push(this.safeDecode(raw));

    try {
      const url = new URL(raw);
      values.push(url.pathname);
      values.push(this.safeDecode(url.pathname));
    }
    catch {
      // Not an absolute URL.
    }

    return values
      .map((value) => value.replace(/\\/g, '/').replace(/^\.\//, ''))
      .filter(Boolean);
  }

  safeDecode(value) {
    try {
      return decodeURIComponent(value);
    }
    catch {
      return value;
    }
  }

  escapeAlt(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
  }

  unescapeMarkdown(value) {
    return String(value).replace(/\\(.)/g, '$1');
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
}
