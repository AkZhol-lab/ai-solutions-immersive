/**
 * Static HTML for data-driven blocks, injected into index.html at dev/build time
 * (see vite.config.ts). Content is crawlable and readable without JS;
 * the single source stays src/data/tariffs.ts.
 * Pure string functions only: this module also runs in Node.
 */
import {
  CHANNELS,
  CHECK_DAYS,
  CURRENCY,
  PRICE_FROM,
  PRICE_NOTE,
  SETUP_DAYS,
  SYSTEM_BLOCKS,
  TARIFFS,
  blockCount,
  plural,
  taskCount,
  type Tariff,
} from './tariffs.ts';
import { AUDIENCE, STAT_LABELS } from '../content/copy.ts';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BLOCK_FORMS: [string, string, string] = ['блок', 'блока', 'блоков'];
const TASK_FORMS: [string, string, string] = ['задача', 'задачи', 'задач'];
const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней'];
const CHANNEL_FORMS: [string, string, string] = ['канал', 'канала', 'каналов'];

function card(t: Tariff, index: number): string {
  const b = blockCount(t);
  const k = taskCount(t);
  const panelId = `incl-${t.id}`;
  const blocks = t.blocks
    .map(
      (block) => `
          <li class="tblock">
            <p class="tblock-title"><span class="rhombus" aria-hidden="true"></span>${esc(block.title)}</p>
            <ul class="tblock-tasks">
              ${block.tasks.map((task) => `<li>${esc(task)}</li>`).join('\n              ')}
            </ul>
          </li>`,
    )
    .join('');

  return `
      <article class="tcard${t.featured ? ' is-featured' : ''}" data-card="${index}" aria-labelledby="t-${t.id}">
        <div class="tcard-inner">
          <header class="tcard-head">
            <span class="eyebrow">0${index + 1}</span>
            <h3 class="tcard-name" id="t-${t.id}">${esc(t.name)}</h3>
          </header>
          <div class="tcard-cost">
            <p class="tcard-price">
              <span class="tcard-from">${esc(PRICE_FROM)}</span><span class="tcard-cur">${esc(CURRENCY)}</span><span class="tcard-num">${t.price}</span>
              <span class="tcard-period">${esc(t.period)}</span>
            </p>
            <p class="tcard-note">${esc(PRICE_NOTE)}</p>
          </div>
          <div class="tcard-aud">
            <p class="eyebrow">Для кого</p>
            <p>${esc(AUDIENCE[t.id])}</p>
          </div>
          <div class="tcard-incl">
            <button class="tcard-toggle" type="button" aria-expanded="false" aria-controls="${panelId}" id="${panelId}-btn" data-accordion>
              <span class="tcard-toggle-label">Что входит</span>
              <span class="tcard-toggle-meta">${b} ${plural(b, BLOCK_FORMS)} · ${k} ${plural(k, TASK_FORMS)}</span>
              <span class="plus" aria-hidden="true"></span>
            </button>
            <div class="tcard-panel" id="${panelId}" role="region" aria-labelledby="${panelId}-btn" hidden data-lenis-prevent>
              <ul class="tblocks">${blocks}
              </ul>
            </div>
          </div>
          <p class="tcard-volume">${esc(t.volume)}</p>
        </div>
      </article>`;
}

export function tariffsMarkup(): string {
  return TARIFFS.map(card).join('\n');
}

export function statsMarkup(): string {
  const items = [
    { value: SETUP_DAYS, unit: plural(SETUP_DAYS, DAY_FORMS), label: STAT_LABELS.setup },
    { value: CHECK_DAYS, unit: plural(CHECK_DAYS, DAY_FORMS), label: STAT_LABELS.check },
    {
      value: CHANNELS.length,
      unit: plural(CHANNELS.length, CHANNEL_FORMS),
      label: STAT_LABELS.channels,
    },
    {
      value: SYSTEM_BLOCKS,
      unit: plural(SYSTEM_BLOCKS, BLOCK_FORMS),
      label: STAT_LABELS.system,
    },
  ];
  return items
    .map(
      (it) => `
        <li class="stat" data-reveal>
          <p class="stat-value"><span class="stat-num" data-count="${it.value}">${it.value}</span></p>
          <p class="stat-label"><span class="stat-unit">${esc(it.unit)}</span> ${esc(it.label)}</p>
        </li>`,
    )
    .join('');
}
