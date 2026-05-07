const BORDERS = {
  quest: `
    <path d="M4,8 L8,3 L14,6 L192,4 L196,8 L198,14 L196,152 L192,157 L14,156 L8,158 L3,154 L2,14 Z"
      fill="var(--paper,#f6f1e7)" stroke="var(--ink,#2a1e10)" stroke-width="1.8" stroke-linejoin="round" opacity="0.95" vector-effect="non-scaling-stroke"/>
    <path d="M7,11 L10,7 L190,8 L193,11 L194,149 L191,153 L11,152 L7,154 L5,150 L6,11 Z"
      fill="none" stroke="var(--ink,#2a1e10)" stroke-width="0.6" stroke-linejoin="round" opacity="0.25" vector-effect="non-scaling-stroke"/>
    <line x1="8" y1="3" x2="3" y2="8" stroke="var(--brand-1,#c43a1a)" stroke-width="1.2" opacity="0.5" vector-effect="non-scaling-stroke"/>
    <line x1="192" y1="4" x2="198" y2="9" stroke="var(--brand-1,#c43a1a)" stroke-width="1.2" opacity="0.5" vector-effect="non-scaling-stroke"/>
    <line x1="8" y1="158" x2="3" y2="153" stroke="var(--brand-1,#c43a1a)" stroke-width="1.2" opacity="0.5" vector-effect="non-scaling-stroke"/>
    <line x1="192" y1="156" x2="198" y2="151" stroke="var(--brand-1,#c43a1a)" stroke-width="1.2" opacity="0.5" vector-effect="non-scaling-stroke"/>
  `,
  spellbook: `
    <path d="M18,3 L182,3 L197,18 L197,142 L182,157 L18,157 L3,142 L3,18 Z"
      fill="var(--paper,#f6f1e7)" stroke="var(--ink,#2a1e10)" stroke-width="1.8" stroke-linejoin="round" opacity="0.95" vector-effect="non-scaling-stroke"/>
    <path d="M20,6 L180,6 L194,20 L194,140 L180,154 L20,154 L6,140 L6,20 Z"
      fill="none" stroke="var(--ink,#2a1e10)" stroke-width="0.6" stroke-linejoin="round" opacity="0.2" vector-effect="non-scaling-stroke"/>
    <line x1="18" y1="22" x2="182" y2="22" stroke="var(--blue-ink,#2a4a7a)" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.4" vector-effect="non-scaling-stroke"/>
    <circle cx="18" cy="3" r="2.5" fill="var(--paper,#f6f1e7)" stroke="var(--blue-ink,#2a4a7a)" stroke-width="1.2" opacity="0.7" vector-effect="non-scaling-stroke"/>
    <circle cx="182" cy="3" r="2.5" fill="var(--paper,#f6f1e7)" stroke="var(--blue-ink,#2a4a7a)" stroke-width="1.2" opacity="0.7" vector-effect="non-scaling-stroke"/>
    <circle cx="18" cy="157" r="2.5" fill="var(--paper,#f6f1e7)" stroke="var(--blue-ink,#2a4a7a)" stroke-width="1.2" opacity="0.7" vector-effect="non-scaling-stroke"/>
    <circle cx="182" cy="157" r="2.5" fill="var(--paper,#f6f1e7)" stroke="var(--blue-ink,#2a4a7a)" stroke-width="1.2" opacity="0.7" vector-effect="non-scaling-stroke"/>
  `,
  lore: `
    <path d="M10,4 Q100,1 190,4 L194,6 L196,155 Q100,158 4,155 L6,6 Z"
      fill="var(--paper,#f6f1e7)" stroke="var(--ink,#2a1e10)" stroke-width="1.8" stroke-linejoin="round" opacity="0.95" vector-effect="non-scaling-stroke"/>
    <path d="M12,8 Q100,5 188,8 L192,10 L192,151 Q100,154 8,151 L8,10 Z"
      fill="none" stroke="var(--ink,#2a1e10)" stroke-width="0.6" stroke-linejoin="round" opacity="0.2" vector-effect="non-scaling-stroke"/>
    <path d="M10,4 Q6,6 4,10 Q6,14 10,12" fill="none" stroke="var(--green-ink,#2a4a2a)" stroke-width="1.2" opacity="0.55" vector-effect="non-scaling-stroke"/>
    <path d="M190,4 Q194,6 196,10 Q194,14 190,12" fill="none" stroke="var(--green-ink,#2a4a2a)" stroke-width="1.2" opacity="0.55" vector-effect="non-scaling-stroke"/>
    <path d="M10,156 Q6,154 4,150 Q6,146 10,148" fill="none" stroke="var(--green-ink,#2a4a2a)" stroke-width="1.2" opacity="0.55" vector-effect="non-scaling-stroke"/>
    <path d="M190,156 Q194,154 196,150 Q194,146 190,148" fill="none" stroke="var(--green-ink,#2a4a2a)" stroke-width="1.2" opacity="0.55" vector-effect="non-scaling-stroke"/>
  `,
  character: `
    <path d="M3,4 L5,2 L195,3 L198,5 L198,157 L195,159 L5,158 L2,156 L3,4 Z"
      fill="var(--paper,#f6f1e7)" stroke="var(--ink,#2a1e10)" stroke-width="2" stroke-linejoin="round" opacity="0.95" vector-effect="non-scaling-stroke"/>
    <path d="M6,7 L8,5 L192,6 L195,8 L194,154 L192,156 L8,155 L5,153 L6,7 Z"
      fill="none" stroke="var(--ink,#2a1e10)" stroke-width="0.6" stroke-linejoin="round" opacity="0.3" vector-effect="non-scaling-stroke"/>
    <line x1="6" y1="30" x2="194" y2="30" stroke="var(--ink,#2a1e10)" stroke-width="0.8" opacity="0.25" vector-effect="non-scaling-stroke"/>
    <line x1="6" y1="130" x2="194" y2="130" stroke="var(--ink,#2a1e10)" stroke-width="0.8" opacity="0.18" vector-effect="non-scaling-stroke"/>
  `,
};

class SketchCard extends HTMLElement {
  static get observedAttributes() {
    return ['type'];
  }

  connectedCallback() {
    this._renderBorder();
  }

  attributeChangedCallback() {
    this._renderBorder();
  }

  _renderBorder() {
    const existing = this.querySelector('.sketch-border');
    if (existing) existing.remove();

    const type = this.getAttribute('type') || 'lore';
    const paths = BORDERS[type] ?? BORDERS.lore;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sketch-border');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 200 160');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:0;';
    svg.innerHTML = paths;

    this.insertBefore(svg, this.firstChild);
  }
}

customElements.define('sketch-card', SketchCard);
