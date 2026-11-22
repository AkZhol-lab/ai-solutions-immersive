/** HTML for the sections rendered from src/content/copy.ts at build time (see vite.config.ts). */
import { CTA, DEMO, FAQ, PAINS, PROCESS, ROLES, nb } from './copy.ts';

/** attribute-safe text, as is */
const attr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** visible text: typographic glue + `\n` → forced line break (SplitText keeps <br>) */
const esc = (s: string): string => attr(nb(s)).replace(/\n/g, '<br />');
const pad = (n: number): string => String(n).padStart(2, '0');
const ARROW = `<svg class="arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9L9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>`;

export const painsHTML = (): string => `
<section id="pains" class="section s-pains" data-scene="pains" aria-labelledby="pains-title">
  <div class="container-x s-inner">
    <header class="s-head">
      <p class="eyebrow" data-fade>${esc(PAINS.eyebrow)}</p>
      <h2 id="pains-title" class="h2 s-title" data-split>${esc(PAINS.title)}</h2>
      <p class="s-lead" data-fade>${esc(PAINS.lead)}</p>
    </header>
    <ul class="s-grid s-grid-2" data-stagger>
      ${PAINS.items
        .map(
          (p) => `<li class="s-card">
        <p class="s-time">${esc(p.time)}</p>
        <h3 class="s-card-title">${esc(p.title)}</h3>
        <p class="s-card-text">${esc(p.text)}</p>
      </li>`,
        )
        .join('')}
    </ul>
    <p class="s-outro" data-fade>${esc(PAINS.outro)}</p>
  </div>
</section>`;

export const demoHTML = (): string => {
  const msgs = DEMO.messages
    .map(
      (m) => `<li class="s-msg is-${m.from}" data-msg="${m.from}">
        ${m.from === 'ai' ? '<span class="s-typing" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}
        <p class="s-bubble"><span class="sr-only">${m.from === 'ai' ? 'AI' : 'Клиент'}: </span>${esc(m.text)}<time>${esc(m.time)}</time></p>
      </li>`,
    )
    .join('');
  return `
<section id="demo" class="section s-demo" data-scene="demo" aria-labelledby="demo-title">
  <div class="container-x s-inner s-split">
    <header class="s-head">
      <p class="eyebrow" data-fade>${esc(DEMO.eyebrow)}</p>
      <h2 id="demo-title" class="h2 s-title" data-split>${esc(DEMO.title)}</h2>
      <p class="s-lead" data-fade>${esc(DEMO.lead)}</p>
    </header>
    <figure class="s-chat" aria-label="Пример диалога в Telegram, условные данные">
      <div class="s-chat-head">
        <span class="s-avatar" aria-hidden="true">AI</span>
        <span class="s-chat-name">${esc(DEMO.chatName)}<small>${esc(DEMO.chatStatus)}</small></span>
      </div>
      <ol class="s-chat-log">
        ${msgs}
        <li class="s-handoff" data-msg="handoff"><span class="rhombus" aria-hidden="true"></span>${esc(DEMO.handoff)}</li>
      </ol>
      <figcaption class="s-note">${esc(DEMO.note)}</figcaption>
    </figure>
  </div>
</section>`;
};

export const rolesHTML = (): string => `
<section id="roles" class="section s-roles" data-scene="roles" aria-labelledby="roles-title">
  <div class="container-x s-inner">
    <header class="s-head">
      <p class="eyebrow" data-fade>${esc(ROLES.eyebrow)}</p>
      <h2 id="roles-title" class="h2 s-title" data-split>${esc(ROLES.title)}</h2>
    </header>
    <ul class="s-grid s-grid-3 s-role-list" data-stagger>
      ${ROLES.items
        .map(
          (r, i) => `<li class="s-card s-role${i === 1 ? ' is-ai' : ''}">
        <h3 class="s-role-name">${esc(r.name)}</h3>
        <p class="s-card-text">${esc(r.text)}</p>
      </li>`,
        )
        .join('')}
    </ul>
    <h3 class="eyebrow s-sub" data-fade>${esc(ROLES.principlesTitle)}</h3>
    <ul class="s-grid s-grid-2 s-principles" data-stagger>
      ${ROLES.principles
        .map(
          (p) => `<li class="s-principle">
        <p class="s-card-title"><span class="rhombus" aria-hidden="true"></span>${esc(p.title)}</p>
        <p class="s-card-text">${esc(p.text)}</p>
      </li>`,
        )
        .join('')}
    </ul>
  </div>
</section>`;

export const processHTML = (): string => `
<section id="process" class="section s-process" data-scene="process" aria-labelledby="process-title">
  <div class="container-x s-inner">
    <header class="s-head">
      <p class="eyebrow" data-fade>${esc(PROCESS.eyebrow)}</p>
      <h2 id="process-title" class="h2 s-title" data-split>${esc(PROCESS.title)}</h2>
    </header>
    <ol class="s-grid s-grid-3 s-steps" data-stagger>
      ${PROCESS.steps
        .map(
          (s, i) => `<li class="s-step">
        <span class="s-step-num">${pad(i + 1)}</span>
        <h3 class="s-card-title">${esc(s.title)}</h3>
        <p class="s-card-text">${esc(s.text)}</p>
        <p class="s-step-result"><span>Итог:</span> ${esc(s.result)}</p>
      </li>`,
        )
        .join('')}
    </ol>
  </div>
</section>`;

export const faqHTML = (): string => `
<section id="faq" class="section s-faq" data-scene="faq" aria-labelledby="faq-title">
  <div class="container-x s-inner s-split">
    <header class="s-head">
      <p class="eyebrow" data-fade>${esc(FAQ.eyebrow)}</p>
      <h2 id="faq-title" class="h2 s-title" data-split>${esc(FAQ.title)}</h2>
    </header>
    <ul class="s-faq-list">
      ${FAQ.items
        .map(
          (f, i) => `<li class="s-faq-item">
        <h3><button class="s-faq-q" type="button" aria-expanded="false" aria-controls="faq-${i}" id="faq-${i}-btn">
          <span>${esc(f.q)}</span><span class="plus" aria-hidden="true"></span>
        </button></h3>
        <div class="s-faq-a" id="faq-${i}" role="region" aria-labelledby="faq-${i}-btn" hidden>
          <p>${esc(f.a)}</p>
        </div>
      </li>`,
        )
        .join('')}
    </ul>
  </div>
</section>`;

/** replaces the inside of #cta .cta-inner (glow, footer and the section itself stay) */
export const ctaInnerHTML = (): string => `
<div class="s-cta-grid">
  <div class="s-cta-head">
    <span class="cta-anchor" data-gl-anchor="point" aria-hidden="true"></span>
    <p class="eyebrow" data-fade>${esc(CTA.eyebrow)}</p>
    <h2 id="cta-title" class="h2 cta-title s-cta-title" data-split>${esc(CTA.title)}</h2>
    <p class="s-lead" data-fade>${esc(CTA.next)}</p>
  </div>
  <form class="s-form" data-fade novalidate>
    <fieldset class="s-field">
      <legend class="s-label">${esc(CTA.categoriesLabel)}</legend>
      <div class="s-chips">
        ${CTA.categories
          .map(
            (c) =>
              `<label class="s-chip"><input type="radio" name="category" value="${attr(c)}" /><span>${esc(c)}</span></label>`,
          )
          .join('')}
      </div>
    </fieldset>
    <div class="s-field">
      <label class="s-label" for="s-now">${esc(CTA.fieldLabel)} <span class="s-optional">${esc(CTA.fieldOptional)}</span></label>
      <textarea id="s-now" name="now" rows="3" maxlength="600" placeholder="${esc(CTA.placeholder)}"></textarea>
    </div>
    <a class="btn-cta s-send" href="https://t.me/zholic_01" target="_blank" rel="noopener" data-magnetic data-magnetic-strength="0.35">
      <span data-magnetic-inner>${esc(CTA.button)}</span>${ARROW}
    </a>
    <p class="s-hint">${esc(CTA.hint)}</p>
    <p class="s-status" role="status" aria-live="polite"></p>
  </form>
</div>`;
