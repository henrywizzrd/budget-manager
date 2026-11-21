/**
 * Offline assistant (VI/EN): rule-based intents over the user's data, plus proposed actions that only run
 * after the user confirms (spec FR-022, contracts/assistant-actions.md). Gemini (gemini.ts) is optional.
 */
import { CATEGORY_KEYWORDS } from './categories';
import { fold, vnd } from './format';
import { buildInsights, monthStats, spendBetween, startOfWeek } from './insights';
import { affordability, ddmm, safeToSpend, subMonthly, subsAudit } from './money';
import { parseExpenses } from './parser';
import { AppData, Category, ChatMessage, Lang } from './types';

type Reply = Omit<ChatMessage, 'id' | 'role'>;

function findCategory(q: string, categories: Category[]): Category | undefined {
  const padded = ` ${q.replace(/[^a-z0-9]+/g, ' ')} `;
  let best: { c: Category; len: number } | undefined;
  for (const c of categories) {
    const words = [...(CATEGORY_KEYWORDS[c.id] ?? []), fold(c.name), fold(c.nameEn)];
    for (const w of words) {
      if (w.length >= 2 && padded.includes(` ${w} `) && (!best || w.length > best.len)) best = { c, len: w.length };
    }
  }
  return best?.c;
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/** First amount in the question (k / tr / triệu / m / million). */
function amountIn(q: string): number | null {
  const m = q.match(/(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|tr|trieu|cu|m|million|mil)?\b/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const u = m[2] ?? '';
  if (['tr', 'trieu', 'cu', 'm', 'million', 'mil'].includes(u)) return Math.round(n * 1_000_000);
  if (['k', 'nghin', 'ngan'].includes(u)) return Math.round(n * 1000);
  return n < 1000 ? Math.round(n * 1000) : Math.round(n);
}

export const SUGGESTIONS: Record<Lang, string[]> = {
  vi: ['Mua tai nghe 500k được không?', 'Soát gói đăng ký', 'Đặt ngân sách ăn uống 2 triệu', 'Tháng này tiêu cà phê bao nhiêu?', 'Dự báo cuối tháng', 'Mình nên tiết kiệm ở đâu?'],
  en: ['Can I afford headphones for 500k?', 'Audit my subscriptions', 'Set my food budget to 2 million', 'How much on coffee this month?', 'Month-end forecast', 'Where should I save?'],
};

const BANNED = /\b(vay|loan|credit card|the tin dung|tra gop|bnpl|buy now pay later|ca do|ca cuoc|gamble|crypto)\b/;

export function answerOffline(question: string, data: AppData, now = new Date()): Reply {
  const lang = data.settings.lang;
  const T = (vi: string, en: string) => (lang === 'en' ? en : vi);
  const M = (n: number) => (lang === 'en' ? vnd(n).replace(/\./g, ',').replace('đ', '₫') : vnd(n));
  const q = fold(question);
  const { transactions: txs, categories } = data;
  const y = now.getFullYear();
  const m = now.getMonth();
  const cur = monthStats(txs, categories, y, m, now, lang);
  const prevDate = new Date(y, m - 1, 1);
  const prev = monthStats(txs, categories, prevDate.getFullYear(), prevDate.getMonth(), now, lang);
  const cn = (c: Category) => (lang === 'en' ? c.nameEn : c.name);

  // Never steer users in hardship towards borrowing (FR-024)
  if (BANNED.test(q) && has(q, 'nen', 'should', 'co nen', 'vay', 'loan')) {
    return { text: T('Mình không khuyên vay qua app cho vay, thẻ tín dụng hay mua trả sau khi đang thiếu tiền: lãi và phí thường rất nặng. Thử xem chế độ cứu nguy ở Trang chủ, hoặc hỏi "mình nên tiết kiệm ở đâu?".', "I don't recommend lending apps, credit cards or buy-now-pay-later when money is tight: interest and fees are usually heavy. Check survival mode on Home, or ask \"where should I save?\".") };
  }

  // 1. Affordability: "mua X 500k được không" / "can I afford"
  if (has(q, 'duoc khong', 'co nen mua', 'mua duoc', 'afford', 'can i buy', 'should i buy')) {
    const price = amountIn(q);
    if (!price) return { text: T('Món đó giá bao nhiêu? Ví dụ: "Mua tai nghe 500k được không?"', 'How much is it? e.g. "Can I afford headphones for 500k?"') };
    const r = affordability(data, price, now);
    if (r.fits) {
      return {
        text: T(
          `Mua ${M(price)} hôm nay thì từ giờ tới ${ddmm(r.before.periodEnd)}, mỗi ngày bạn còn tiêu được ${M(r.after.daily)} (thay vì ${M(r.before.daily)}).${r.after.daily < 50_000 ? ' Mức này khá sát, cân nhắc đợi tới kỳ nhận tiền.' : ''}`,
          `Buying it for ${M(price)} today leaves you ${M(r.after.daily)} a day until ${ddmm(r.before.periodEnd)} (instead of ${M(r.before.daily)}).${r.after.daily < 50_000 ? ' That is tight; consider waiting until payday.' : ''}`,
        ),
      };
    }
    return {
      text: T(
        `Mua ngay bây giờ sẽ thiếu tiền tới kỳ nhận tiền. Nếu để dành ${M(r.perWeek)}/tuần thì khoảng ${r.weeksToSave} tuần là đủ. Mình tạo mục tiêu tiết kiệm cho món này nhé?`,
        `Buying it now would leave you short before payday. Saving ${M(r.perWeek)} a week gets you there in about ${r.weeksToSave} weeks. Shall I create a savings goal for it?`,
      ),
      action: { type: 'create_goal', name: T('Món muốn mua', 'Wishlist item'), target: price },
    };
  }

  // 2. Subscription audit
  if (has(q, 'goi dang ky', 'dang ky', 'subscription', 'subscriptions')) {
    const a = subsAudit(data.subs);
    if (!data.subs.length) return { text: T('Bạn chưa thêm gói đăng ký nào. Vào Trang chủ → Hóa đơn, nợ & gói để thêm.', 'You have no subscriptions yet. Add them from Home → Bills, debts & plans.') };
    const lines = a.list.map((s) => `• ${s.name}: ${M(subMonthly(s))}${T('/tháng', '/mo')} · ${T('gia hạn', 'renews')} ${ddmm(s.nextRenew)}`).join('\n');
    return {
      text: T(`Bạn đang trả ${M(a.monthly)}/tháng, tức ${M(a.yearly)}/năm cho ${data.subs.length} gói:\n${lines}\nGói nào lâu không dùng thì hủy trước ngày gia hạn để khỏi mất tiền.`, `You pay ${M(a.monthly)} a month, ${M(a.yearly)} a year, for ${data.subs.length} plans:\n${lines}\nCancel any you no longer use before the renewal date.`),
      bars: a.list.slice(0, 5).map((s) => ({ label: s.name.slice(0, 6), value: subMonthly(s), display: M(subMonthly(s)) })),
    };
  }

  // 3. Set a category limit: "đặt ngân sách ăn uống 2 triệu" / "set my food budget to 2 million"
  if (has(q, 'dat ngan sach', 'han muc', 'set my', 'set budget', 'budget to', 'limit')) {
    const cat = findCategory(q, categories.filter((c) => c.type === 'expense'));
    const amount = amountIn(q);
    if (cat && amount) {
      return { text: T('Mình có thể đặt hạn mức này cho bạn:', 'I can set this limit for you:'), action: { type: 'set_category_limit', categoryId: cat.id, limit: amount } };
    }
  }

  // 4. Create a goal: "tạo mục tiêu laptop 12tr" / "save for a laptop 12m"
  if (has(q, 'tao muc tieu', 'muc tieu', 'save for', 'goal')) {
    const amount = amountIn(q);
    if (amount) {
      const name = question.replace(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|tr|triệu|củ|m|million)?/i, '').replace(/tạo mục tiêu|mục tiêu|save for|create a goal|goal/gi, '').trim() || T('Mục tiêu mới', 'New goal');
      return { text: T('Mình tạo mục tiêu này nhé:', 'Shall I create this goal?'), action: { type: 'create_goal', name: name.charAt(0).toUpperCase() + name.slice(1), target: amount } };
    }
  }

  // 5. Log transactions written as a sentence (no question words)
  if (!has(q, 'bao nhieu', 'how much', '?', 'khong', 'nen', 'should')) {
    const items = parseExpenses(question);
    if (items.length) return { text: T('Mình hiểu là bạn muốn ghi:', 'Looks like you want to log:'), action: { type: 'add_transactions', items } };
  }

  if (txs.length === 0) {
    return { text: T('Mình chưa có dữ liệu nào để phân tích. Thêm vài giao dịch bằng nút + (hoặc tạo dữ liệu mẫu trong Cài đặt) rồi hỏi lại nhé.', 'There is no data to analyse yet. Add a few transactions with + (or load sample data in Settings) and ask again.') };
  }

  // 6. Compare with last month
  if (has(q, 'so sanh', 'thang truoc', 'thang roi', 'last month', 'compare')) {
    const diff = cur.expense - prev.expense;
    const dir = diff > 0 ? T(`nhiều hơn ${M(diff)}`, `${M(diff)} more than`) : diff < 0 ? T(`ít hơn ${M(-diff)}`, `${M(-diff)} less than`) : T('bằng', 'the same as');
    return {
      text: T(`Tháng này bạn đã chi ${M(cur.expense)}, ${dir} cả tháng trước (${M(prev.expense)}). Tháng này mới qua ${cur.daysElapsed}/${cur.daysTotal} ngày.`, `This month you've spent ${M(cur.expense)}, ${dir} all of last month (${M(prev.expense)}). We're ${cur.daysElapsed}/${cur.daysTotal} days in.`),
      bars: cur.categories.slice(0, 4).map((c) => ({ label: cn(c.category).slice(0, 8), value: c.spent, display: M(c.spent) })),
    };
  }

  // 7. Forecast / payday
  if (has(q, 'du bao', 'cuoi thang', 'du doan', 'forecast', 'month end', 'payday', 'ky nhan tien', 'nhan tien')) {
    const s = safeToSpend(data, now);
    return {
      text: T(
        `Trung bình bạn chi ${M(cur.avgPerDay)}/ngày, cuối tháng sẽ khoảng ${M(cur.forecast)}. Còn ${s.daysLeft} ngày tới kỳ nhận tiền ${ddmm(s.periodEnd)}; sau khi giữ ${M(s.reserved)} cho hóa đơn, mỗi ngày tiêu được ${M(s.daily)}, hôm nay còn ${M(s.leftToday)}.`,
        `You average ${M(cur.avgPerDay)} a day, about ${M(cur.forecast)} by month end. ${s.daysLeft} days until payday (${ddmm(s.periodEnd)}); after holding ${M(s.reserved)} for bills you can spend ${M(s.daily)} a day, ${M(s.leftToday)} left today.`,
      ),
    };
  }

  // 8. Saving advice
  if (has(q, 'tiet kiem', 'cat giam', 'giam chi', 'loi khuyen', 'goi y', 'save', 'saving', 'cut')) {
    const tips: string[] = [];
    for (const c of cur.categories.filter((x) => x.status !== 'ok').slice(0, 2)) tips.push(`• ${cn(c.category)}: ${c.note?.toLowerCase()}. ${T(`Giảm 20% sẽ tiết kiệm khoảng ${M(c.spent * 0.2)}.`, `Cutting 20% saves about ${M(c.spent * 0.2)}.`)}`);
    const top = cur.categories[0];
    if (top && tips.length < 2 && top.spent > 0) tips.push(`• ${T(`Mục chi lớn nhất là ${cn(top.category)}`, `Your biggest category is ${cn(top.category)}`)} (${M(top.spent)}).`);
    const a = subsAudit(data.subs);
    if (a.monthly > 0) tips.push(`• ${T(`Gói đăng ký tốn ${M(a.yearly)}/năm, soát lại gói ít dùng.`, `Subscriptions cost ${M(a.yearly)} a year; review the ones you rarely use.`)}`);
    if (tips.length === 0) tips.push(`• ${T('Bạn đang chi khá ổn. Chuyển phần dư cuối ngày vào quỹ khẩn cấp nhé.', "You're doing well. Move what's left each day into your emergency fund.")}`);
    return { text: `${T('Một vài gợi ý:', 'A few ideas:')}\n${tips.join('\n')}` };
  }

  // 9. How much on X
  const cat = findCategory(q, categories);
  if (has(q, 'bao nhieu', 'tieu', 'chi', 'het', 'how much', 'spent', 'spend') || cat) {
    let from = new Date(y, m, 1);
    let label = T('tháng này', 'this month');
    if (has(q, 'hom nay', 'today')) {
      from = new Date(y, m, now.getDate());
      label = T('hôm nay', 'today');
    } else if (has(q, 'tuan nay', 'this week')) {
      from = startOfWeek(now);
      label = T('tuần này', 'this week');
    }
    const to = new Date(now.getTime() + 1);
    const total = spendBetween(txs, from, to, cat?.type === 'expense' ? cat.id : undefined);
    if (cat && cat.type === 'expense') return { text: T(`${label.charAt(0).toUpperCase() + label.slice(1)} bạn đã chi ${M(total)} cho ${cat.name.toLowerCase()}.`, `You spent ${M(total)} on ${cat.nameEn.toLowerCase()} ${label}.`) };
    return { text: T(`Tổng chi ${label} là ${M(total)}.`, `Total spent ${label}: ${M(total)}.`) };
  }

  const insight = buildInsights(txs, categories, now, lang)[0];
  return {
    text: `${insight ? insight.text + '\n\n' : ''}${T('Bạn có thể hỏi: "Mua tai nghe 500k được không?", "Soát gói đăng ký", "Đặt ngân sách ăn uống 2 triệu", "Dự báo cuối tháng", hoặc gõ chi tiêu như "cà phê 35k" để ghi.', 'Try: "Can I afford headphones for 500k?", "Audit my subscriptions", "Set my food budget to 2 million", "Month-end forecast", or type spending like "coffee 35k" to log it.')}`,
  };
}
