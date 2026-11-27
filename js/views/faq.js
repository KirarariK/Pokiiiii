// Foire aux questions.

import { faq } from '../data/faq.js';
import { esc } from '../format.js';
import { icon } from '../icons.js';
import { pageHead } from '../ui/blocks.js';

export default {
  title: 'FAQ',
  render() {
    return `
    ${pageHead({ icon: 'circle-help', title: 'Foire aux questions' })}
    <div class="acc-list narrow">
      ${faq().map(
        (item, i) => `<details class="acc" ${i === 0 ? 'open' : ''}>
          <summary><span>${esc(item.q)}</span>${icon('chevron-down', { size: 18 })}</summary>
          <div class="acc__body prose">${item.a}</div>
        </details>`,
      ).join('')}
    </div>
    <p class="center muted">Une autre question ? <a href="#/contact">Contacte-nous</a></p>`;
  },
};
