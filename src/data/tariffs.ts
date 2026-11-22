/**
 * Single source of tariff data.
 * Source: AI_Solutions_Тарифы.xlsx, sheet «Тарифы» (columns B / D / F). Texts are verbatim.
 * The xlsx marks every price with a comment: «Цена — проект, не утверждена.»
 * Check against the xlsx with `npm run verify:tariffs`.
 */

/** Currency confirmed by the owner (the xlsx itself has none). */
export const CURRENCY = '$';
/** Prices are starting points: the xlsx marks them «Цена — проект, не утверждена.» */
export const PRICE_FROM = 'от';
export const PRICE_NOTE = 'Итоговая стоимость по проекту';

export interface TariffBlock {
  /** «◆ …» row in the xlsx */
  title: string;
  /** «· …» rows under the block */
  tasks: string[];
}

export interface Tariff {
  id: 'start' | 'growth' | 'system';
  name: string;
  price: number;
  period: 'разово' | 'в месяц';
  audience: string;
  blocks: TariffBlock[];
  /** «3 · ОБЪЁМ», last row */
  volume: string;
  featured?: boolean;
}

export const TARIFFS: Tariff[] = [
  {
    id: 'start',
    name: 'СТАРТ',
    price: 49,
    period: 'разово',
    audience: 'Владельцу, у которого заявки теряются в мессенджерах и переписках.',
    blocks: [
      {
        title: 'Приём заявок · Telegram',
        tasks: [
          'Сбор типовых вопросов клиентов',
          'База ответов: цена, сроки, адрес',
          'Сценарии диалога',
          'Передача диалога человеку',
        ],
      },
      {
        title: 'Таблица заявок',
        tasks: [
          'Структура: контакт, источник, статус',
          'Статусы и этапы воронки',
          'Уведомление о новой заявке',
        ],
      },
      {
        title: 'Запуск',
        tasks: [
          'Тестирование на реальных вопросах',
          'Инструкция для владельца',
          'Проверка 14 дней, правки',
        ],
      },
    ],
    volume: 'Настройка 7 дней · проверка 14 дней',
  },
  {
    id: 'growth',
    name: 'РОСТ',
    price: 97,
    period: 'в месяц',
    audience:
      'Владельцу, который ведёт клиентов и деньги в таблицах и хочет порядок без ручной работы.',
    featured: true,
    blocks: [
      {
        title: 'Приём заявок · Telegram',
        tasks: [
          'Сбор вопросов и база ответов',
          'Сценарии диалога',
          'Передача диалога человеку',
          'Запись заявки в таблицу',
        ],
      },
      {
        title: 'CRM и таблицы',
        tasks: [
          'Воронка и статусы',
          'Автозаполнение полей заявки',
          'Права доступа',
          'Перенос старых данных',
        ],
      },
      {
        title: 'База клиентов',
        tasks: [
          'Карточка клиента',
          'Очистка дублей и ошибок',
          'Сегменты: новые, постоянные, спящие',
        ],
      },
      {
        title: 'Учёт финансов',
        tasks: [
          'Статьи доходов и расходов',
          'Фото чека → запись в таблицу',
          'Сводка за день, неделю, месяц',
        ],
      },
      {
        title: 'Отчёты',
        tasks: ['Ежемесячная сводка владельцу', 'Показатели: заявки, продажи, расходы'],
      },
      {
        title: 'Напоминания',
        tasks: ['Подтверждение записи', 'Возврат спящих клиентов', 'Запрос отзыва'],
      },
      {
        title: 'Запуск и сопровождение',
        tasks: ['Тестирование', 'Инструкция и обучение', 'Проверка 14 дней, правки'],
      },
    ],
    volume: 'Ежемесячное сопровождение',
  },
  {
    id: 'system',
    name: 'СИСТЕМА',
    price: 197,
    period: 'в месяц',
    audience: 'Владельцу, который хочет, чтобы рутина шла сама, а решения оставались за ним.',
    blocks: [
      {
        title: 'Приём заявок · Telegram',
        tasks: [
          'Сбор вопросов и база ответов',
          'Сценарии диалога',
          'Передача диалога человеку',
          'Запись заявки в таблицу',
        ],
      },
      {
        title: 'Подключение каналов',
        tasks: [
          'WhatsApp · после проверки',
          'Instagram и чат на сайте',
          'Выбор способа и провайдера',
          'Пробная переписка и контроль',
        ],
      },
      {
        title: 'CRM и таблицы',
        tasks: [
          'Воронка и статусы',
          'Автозаполнение полей заявки',
          'Права доступа',
          'Перенос старых данных',
        ],
      },
      {
        title: 'База клиентов',
        tasks: [
          'Карточка клиента',
          'Очистка дублей и ошибок',
          'Сегменты: новые, постоянные, спящие',
          'Резервная копия и правила хранения',
        ],
      },
      {
        title: 'Учёт финансов и сметы',
        tasks: [
          'Статьи доходов и расходов',
          'Фото чека → таблица, смета, проект',
          'План, факт, отклонение',
          'Сводка за день, неделю, месяц',
        ],
      },
      {
        title: 'Отчёты и аналитика',
        tasks: ['Панель владельца', 'Сводки: день, неделя, месяц', 'Сигналы об отклонениях'],
      },
      {
        title: 'Напоминания',
        tasks: ['Подтверждение записи', 'Возврат спящих клиентов', 'Запрос отзыва и рекомендации'],
      },
      {
        title: 'Внутренний ИИ-помощник',
        tasks: [
          'База знаний: инструкции, прайс, регламенты',
          'Правила ответа сотрудникам',
          'Подключение к рабочему чату',
          'Обучение команды',
        ],
      },
      {
        title: 'Сайт и онлайн-заявка',
        tasks: ['Структура страниц', 'Форма заявки → таблица', 'Публикация и домен'],
      },
      {
        title: 'Автоматизация рутины',
        tasks: [
          'Опись повторяющихся задач',
          'Цепочки: событие → действие',
          'Шаблоны: счёт, смета, акт',
        ],
      },
      {
        title: 'Запуск и сопровождение',
        tasks: ['Тестирование', 'Инструкция и обучение', 'Проверка 14 дней', 'Ежемесячный разбор'],
      },
    ],
    volume: 'Ежемесячное сопровождение и разбор',
  },
];

/* ───────────── Derived values (never hardcode these elsewhere) ───────────── */

export const blockCount = (t: Tariff): number => t.blocks.length;
export const taskCount = (t: Tariff): number =>
  t.blocks.reduce((sum, b) => sum + b.tasks.length, 0);

export const tariffById = (id: Tariff['id']): Tariff => {
  const t = TARIFFS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown tariff ${id}`);
  return t;
};

const daysIn = (text: string, word: RegExp): number => {
  const m = text.match(new RegExp(`${word.source}\\s+(\\d+)\\s+дн`, 'i'));
  if (!m) throw new Error(`No days for ${word} in «${text}»`);
  return Number(m[1]);
};

const startVolume = tariffById('start').volume;
/** «Настройка 7 дней» */
export const SETUP_DAYS = daysIn(startVolume, /настройка/);
/** «проверка 14 дней» */
export const CHECK_DAYS = daysIn(startVolume, /проверка/);

/** Messengers named in the tariffs (Telegram, WhatsApp, Instagram), in order of first mention. */
export const CHANNELS: string[] = (() => {
  const text = TARIFFS.flatMap((t) => t.blocks.flatMap((b) => [b.title, ...b.tasks])).join(' ');
  return ['Telegram', 'WhatsApp', 'Instagram'].filter((name) => text.includes(name));
})();

export const SYSTEM_BLOCKS = blockCount(tariffById('system'));

/** Russian plural: plural(11, ['блок', 'блока', 'блоков']) → 'блоков' */
export const plural = (n: number, forms: [string, string, string]): string => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
};
