import { CTA } from '../content/copy';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers / no permission: a hidden textarea + execCommand
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/**
 * CTA form: category + «how is it now» → a ready message for Telegram @zholic_01.
 * The button is a real link (works without JS and from the keyboard); its href is kept in sync
 * with the form, and on click the same text is copied in case Telegram does not prefill it.
 */
export function initCtaForm(): void {
  const form = document.querySelector<HTMLFormElement>('#cta .s-form');
  const send = form?.querySelector<HTMLAnchorElement>('.s-send');
  const status = form?.querySelector<HTMLElement>('.s-status');
  if (!form || !send) return;

  const message = (): string => {
    const data = new FormData(form);
    const category = String(data.get('category') ?? '');
    const now = String(data.get('now') ?? '')
      .trim()
      .replace(/\s+/g, ' ');
    return CTA.message(category, now);
  };
  const update = (): void => {
    send.href = `https://t.me/zholic_01?text=${encodeURIComponent(message())}`;
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  update();
  send.addEventListener('click', () => {
    update();
    void copyText(message()).then((ok) => {
      if (status) status.textContent = ok ? CTA.copied : '';
    });
  });
}
