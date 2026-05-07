import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type CardType = 'quest' | 'spellbook' | 'lore' | 'character';

const CONFIG: Record<CardType, { label: string; icon: string }> = {
  quest: { label: 'Quest', icon: '⚔' },
  spellbook: { label: 'Spellbook', icon: '✦' },
  lore: { label: 'Lore', icon: '🗺' },
  character: { label: 'Character', icon: '⬡' },
};

// Pre-computed offsets give the hand-drawn wobble without Math.random() re-renders
const JITTER = [0.8, -1.2, 0.5, 1.1, -0.9, 0.7, -1.4, 0.4];

function sketchRect(w: number, h: number, pad = 5): string {
  const [x0, y0, x1, y1] = [pad, pad, w - pad, h - pad];
  return (
    `M ${x0 + JITTER[0]} ${y0 + JITTER[1]} ` +
    `L ${x1 + JITTER[2]} ${y0 + JITTER[3]} ` +
    `L ${x1 + JITTER[4]} ${y1 + JITTER[5]} ` +
    `L ${x0 + JITTER[6]} ${y1 + JITTER[7]} Z`
  );
}

@customElement('blog-card')
export class BlogCard extends LitElement {
  @property({ reflect: true }) type: CardType = 'quest';
  @property() title = '';
  @property() href = '';
  @property() date = '';
  @property() excerpt = '';

  @state() private _w = 0;
  @state() private _h = 0;

  private _ro?: ResizeObserver;

  static styles = css`
    :host {
      --type-color: var(--brand-1, hsl(22 88% 48%));
      display: block;
      position: relative;
    }

    :host([type='spellbook']) {
      --type-color: var(--accent-1, hsl(200 45% 72%));
    }
    :host([type='lore']) {
      --type-color: var(--seafoam, hsl(170 50% 62%));
    }
    :host([type='character']) {
      --type-color: var(--gold-1, hsl(45 95% 58%));
    }

    svg.sketch-border {
      height: 100%;
      inset: 0;
      overflow: visible;
      pointer-events: none;
      position: absolute;
      width: 100%;
      z-index: 0;
    }

    .shadow-path {
      fill: var(--outline-color, hsl(225 30% 5%));
      transform: translate(4px, 4px);
    }

    .fill-path {
      fill: var(--surface-2, hsl(225 22% 19%));
      stroke: var(--type-color);
      stroke-width: 2;
    }

    a {
      color: inherit;
      display: block;
      padding: 1.5rem 1.75rem;
      position: relative;
      text-decoration: none;
      z-index: 1;
    }

    a:focus-visible {
      border-radius: 2px;
      outline: 2px solid var(--type-color);
      outline-offset: 2px;
    }

    .inner {
      position: relative;
    }

    .type-badge {
      color: var(--type-color);
      display: block;
      font-family: var(--font-heading, sans-serif);
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      margin-bottom: 0.6rem;
      text-transform: uppercase;
    }

    h2 {
      color: var(--text-1, hsl(210 20% 96%));
      font-family: var(--font-display, serif);
      font-size: 1.05rem;
      font-weight: 300;
      letter-spacing: 0.04em;
      line-height: 1.3;
      margin: 0 0 0.5rem;
      transition: color 0.15s ease;
    }

    p {
      color: var(--text-2, hsl(210 15% 82%));
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0 0 0.75rem;
    }

    .date {
      color: var(--text-3, hsl(210 12% 65%));
      font-family: var(--font-heading, sans-serif);
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    a:hover h2,
    a:focus-visible h2 {
      color: var(--type-color);
    }

    .doodle {
      color: var(--type-color);
      font-size: 0.75rem;
      line-height: 1;
      opacity: 0.18;
      pointer-events: none;
      position: absolute;
      z-index: 1;
    }

    .doodle-tl {
      left: 0.8rem;
      top: 0.6rem;
    }

    .doodle-br {
      bottom: 0.6rem;
      right: 0.8rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._ro = new ResizeObserver(([entry]) => {
      this._w = entry.contentRect.width;
      this._h = entry.contentRect.height;
    });
    this._ro.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
  }

  render() {
    const config = CONFIG[this.type] ?? CONFIG.quest;
    const path = this._w && this._h ? sketchRect(this._w, this._h) : '';

    return html`
      ${path
        ? html`
            <svg class="sketch-border" aria-hidden="true">
              <path class="shadow-path" d=${path}></path>
              <path class="fill-path" d=${path}></path>
            </svg>
          `
        : ''}
      <span class="doodle doodle-tl" aria-hidden="true">${config.icon}</span>
      <a href=${this.href}>
        <div class="inner">
          <span class="type-badge">${config.label}</span>
          <h2>${this.title}</h2>
          ${this.excerpt ? html`<p>${this.excerpt}</p>` : ''}
          ${this.date ? html`<span class="date">${this.date}</span>` : ''}
        </div>
      </a>
      <span class="doodle doodle-br" aria-hidden="true">${config.icon}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blog-card': BlogCard;
  }
}
