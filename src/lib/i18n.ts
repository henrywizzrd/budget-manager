import { useCallback } from 'react';

import { vnd, vndShort } from './format';
import { useStore } from './store';
import { Category, Lang } from './types';

/**
 * Bilingual strings are written as pairs at the call site: L('Trang chủ', 'Home').
 * Every UI string therefore always has both languages (spec FR-028, SC-005).
 */
export function useL() {
  const { data } = useStore();
  const lang = data.settings.lang;
  return useCallback((vi: string, en: string) => (lang === 'en' ? en : vi), [lang]);
}

export function useLang(): Lang {
  return useStore().data.settings.lang;
}

/** Money formatting that respects "hide amounts" (FR-046). */
export function useMoney() {
  const { data } = useStore();
  const hide = data.settings.hideAmounts;
  const en = data.settings.lang === 'en';
  const fmt = useCallback(
    (n: number, sign = false) => {
      if (hide) return '•••';
      const s = vnd(n, sign);
      return en ? s.replace(/\./g, ',').replace('đ', '₫') : s;
    },
    [hide, en],
  );
  const short = useCallback((n: number) => (hide ? '•••' : en ? vndShort(n).replace('tr', 'M').replace(',', '.') : vndShort(n)), [hide, en]);
  return { fmt, short, hide };
}

export function catName(c: Category | undefined, lang: Lang): string {
  if (!c) return '';
  return lang === 'en' ? c.nameEn : c.name;
}
