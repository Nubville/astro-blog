/**
 * <image-lightbox> makes every meaningful image inside it open in a modal.
 *
 * Without JavaScript the images are ordinary inline images. With it, each one
 * is wrapped in a real <button>, and all of them share one native <dialog>.
 *
 * Follows the WAI-ARIA APG modal dialog pattern. showModal() supplies the
 * dialog role, aria-modal, inert page content and Escape to close. This file
 * adds what the platform can't: the accessible name, a visible close button,
 * and a focus return that also works in Safari, where clicking a button
 * doesn't focus it, so the browser has nothing to restore.
 *
 * Light DOM on purpose, like sketch-card, so site styles and tokens apply.
 */

// Decorative images have nothing to enlarge, and a linked image can't go inside a button.
const IMAGES = 'img:not([alt=""], a img)';

class ImageLightbox extends HTMLElement {
  #dialog;
  #image;
  #pane;
  #caption;
  #zoom;
  #trigger;

  connectedCallback() {
    if (this.#dialog) return;

    // Wrap first: the dialog's own <img> must not match.
    for (const image of this.querySelectorAll(IMAGES)) this.#wrap(image);
    this.#build();

    this.addEventListener('click', (event) => {
      const trigger = event.target.closest('.lightbox-trigger');
      if (trigger) this.#open(trigger);
    });
  }

  #wrap(image) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lightbox-trigger';

    // A button's name comes from its content, so the alt text stays part of it.
    const action = document.createElement('span');
    action.className = 'visually-hidden';
    action.textContent = 'View larger: ';

    image.replaceWith(trigger);
    trigger.append(action, image);
  }

  #build() {
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'lightbox';
    this.#dialog.setAttribute('aria-label', 'Enlarged image');

    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    const toolbar = document.createElement('div');
    toolbar.className = 'lightbox-toolbar';

    this.#zoom = document.createElement('button');
    this.#zoom.type = 'button';
    this.#zoom.className = 'lightbox-button';
    this.#zoom.textContent = 'Actual size';
    this.#zoom.hidden = true;
    this.#zoom.addEventListener('click', () =>
      this.#setZoomed(this.#zoom.getAttribute('aria-pressed') !== 'true')
    );

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox-button';
    close.textContent = 'Close';
    close.autofocus = true; // The dialog's content is short, so APG's default applies.
    close.addEventListener('click', () => this.#dialog.close());

    toolbar.append(this.#zoom, close);

    this.#pane = document.createElement('div');
    this.#pane.className = 'lightbox-pane';
    this.#pane.setAttribute('role', 'group');
    this.#pane.setAttribute('aria-label', 'Image');

    this.#image = document.createElement('img');
    this.#pane.append(this.#image);

    this.#caption = document.createElement('p');
    this.#caption.className = 'lightbox-caption';

    inner.append(toolbar, this.#pane, this.#caption);
    this.#dialog.append(inner);

    // .lightbox-inner fills the dialog, so only a backdrop click targets the dialog itself.
    this.#dialog.addEventListener('click', (event) => {
      if (event.target === this.#dialog) this.#dialog.close();
    });

    this.#dialog.addEventListener('close', () => {
      this.#image.removeAttribute('src'); // So the next open can't flash this image.
      this.#trigger?.focus({ preventScroll: true });
    });

    this.append(this.#dialog);
  }

  async #open(trigger) {
    const source = trigger.querySelector('img');
    this.#trigger = trigger;

    this.#setZoomed(false);
    this.#zoom.hidden = true;

    this.#image.alt = source.alt;
    this.#image.width = source.naturalWidth || Number(source.getAttribute('width')) || 0;
    this.#image.height = source.naturalHeight || Number(source.getAttribute('height')) || 0;
    this.#image.src = source.currentSrc || source.src;

    const caption = trigger.closest('figure')?.querySelector('figcaption')?.textContent ?? '';
    this.#caption.textContent = caption;
    this.#caption.hidden = !caption;

    this.#dialog.showModal();

    // A lazy image may not have loaded yet. Offer actual size only if fitting shrank it.
    await this.#image.decode().catch(() => {});
    this.#zoom.hidden = this.#image.naturalWidth <= this.#image.clientWidth;
  }

  #setZoomed(zoomed) {
    this.#dialog.toggleAttribute('data-zoomed', zoomed);
    this.#zoom.setAttribute('aria-pressed', String(zoomed));

    // Only a pane that can scroll needs to be reachable by keyboard.
    if (zoomed) {
      this.#pane.tabIndex = 0;
    } else {
      this.#pane.removeAttribute('tabindex');
      this.#pane.scrollTo(0, 0);
    }
  }
}

customElements.define('image-lightbox', ImageLightbox);
