/**
 * Offline assistant: answers common questions about the user's spending with rule-based intents.
 * When a Gemini key is set, gemini.ts is used instead (with this as fallback).
 */
import { CATEGORY_KEYWORDS } from './categories';
import { fold, vnd } from './format';
import { buildInsights, monthStats, spendBetween, startOfWeek } from './insights';
import { AppData, ChatMessage, Category } from './types';

type Reply = Omit<ChatMessage, 'id' | 'role'>;

function findCategory(q: string, categories: Category[]): Category | undefined {
  const padded = ` ${q.replace(/[^a-z0-9]+/g, ' ')} `;
  let best: { c: Category; len: number } | undefined;
  for (const c of categories) {
    const words = [...(CATEGORY_KEYWORDS[c.id] ?? []), fold(c.name)];
    for (const w of words) {
      if (w.length >= 2 && padded.includes(` ${w} `) && (!best || w.length > best.len)) best = { c, len: w.length };
    }
  }
  return best?.c;
}

function has(q: string, ...words: string[]) {
  return words.some((w) => q.includes(w));
}

export function answerOffline(question: string, data: AppData, now = new Date()): Reply {
  const q = fold(question);
  const { transactions: txs, categories } = data;
  const y = now.getFullYear();
  const m = now.getMonth();
  const cur = monthStats(txs, categories, y, m, now);
  const prevDate = new Date(y, m - 1, 1);
  const prev = monthStats(txs, categories, prevDate.getFullYear(), prevDate.getMonth(), now);

  if (txs.length === 0) {
    return { text: 'Mình chưa có dữ liệu nào để phân tích. Bạn thêm vài giao dịch bằng nút + (hoặc tạo dữ liệu mẫu trong Cài đặt) rồi hỏi lại nhé.' };
  }

  // 1. Compare with last month
  if (has(q, 'so sanh', 'thang truoc', 'thang roi')) {
    const diff = cur.expense - prev.expense;
    const bars = cur.categories.slice(0, 4).map((c) => ({
      label: c.category.short,
      value: c.spent,
      display: vnd(c.spent),
    }));
    const dir = diff > 0 ? `nhiều hơn ${vnd(diff)}` : diff < 0 ? `ít hơn ${vnd(-diff)}` : 'bằng';
    return {
      text: `Tháng này bạn đã chi ${vnd(cur.expense)}, ${dir} so với cả tháng trước (${vnd(prev.expense)}). Lưu ý tháng này mới qua ${cur.daysElapsed}/${cur.daysTotal} ngày.\nCác mục chi nhiều nhất tháng này:`,
      bars,
    };
  }

  // 2. Forecast
  if (has(q, 'du bao', 'cuoi thang', 'du doan')) {
    const over = cur.forecast - cur.budget;
    return {
      text:
        `Trung bình bạn chi ${vnd(cur.avgPerDay)}/ngày. Giữ nhịp này, cuối tháng sẽ tiêu khoảng ${vnd(cur.forecast)}` +
        (cur.budget > 0 ? (over > 0 ? `, vượt ngân sách ${vnd(over)}.` : `, còn dư khoảng ${vnd(-over)} so với ngân sách.`) : '.') +
        (cur.safePerDay > 0 ? `\nĐể không vượt, mỗi ngày còn lại nên chi tối đa ${vnd(cur.safePerDay)}.` : ''),
    };
  }

  // 3. Saving advice
  if (has(q, 'tiet kiem', 'nen ', 'cat giam', 'giam chi', 'loi khuyen', 'goi y')) {
    const tips: string[] = [];
    for (const c of cur.categories.filter((x) => x.status !== 'ok').slice(0, 2)) {
      tips.push(`• ${c.category.name}: ${c.note?.toLowerCase()}. Đặt mục tiêu giảm 20% sẽ tiết kiệm khoảng ${vnd(c.spent * 0.2)}.`);
    }
    const top = cur.categories[0];
    if (top && tips.length < 2 && top.spent > 0) {
      tips.push(`• Mục chi lớn nhất là ${top.category.name} (${vnd(top.spent)}, ${Math.round((top.spent / Math.max(cur.expense, 1)) * 100)}% tổng chi).`);
    }
    const cf = cur.categories.find((c) => c.category.id === 'cf');
    if (cf && cf.spent > 300_000) tips.push(`• Đồ uống đã tốn ${vnd(cf.spent)}. Tự pha ở nhà vài buổi mỗi tuần là cách tiết kiệm dễ nhất.`);
    if (tips.length === 0) tips.push('• Bạn đang chi tiêu khá ổn so với hạn mức. Có thể chuyển phần dư cuối tháng vào tiết kiệm.');
    return { text: `Một vài gợi ý cho tháng này:\n${tips.join('\n')}` };
  }

  // 4. Remaining budget
  if (has(q, 'con lai', 'con bao nhieu', 'con du', 'ngan sach')) {
    return {
      text: cur.budget > 0
        ? `Ngân sách tháng là ${vnd(cur.budget)}, bạn đã chi ${vnd(cur.expense)}, còn ${vnd(cur.remaining)}. Mỗi ngày còn lại chi được khoảng ${vnd(cur.safePerDay)}.`
        : 'Bạn chưa đặt hạn mức cho danh mục nào. Vào tab Ngân sách để đặt nhé.',
    };
  }

  // 5. How much on X (this week / today / this month)
  const cat = findCategory(q, categories);
  if (has(q, 'bao nhieu', 'tieu', 'chi', 'het', 'ton') || cat) {
    let from = new Date(y, m, 1);
    let label = 'tháng này';
    if (has(q, 'hom nay')) {
      from = new Date(y, m, now.getDate());
      label = 'hôm nay';
    } else if (has(q, 'tuan nay')) {
      from = startOfWeek(now);
      label = 'tuần này';
    }
    const to = new Date(now.getTime() + 1);
    if (cat && cat.type === 'income') {
      const inc = txs.filter((t) => t.type === 'income' && new Date(t.date) >= from && new Date(t.date) < to).reduce((s, t) => s + t.amount, 0);
      return { text: `Thu nhập ${label} của bạn là ${vnd(inc)}.` };
    }
    const total = spendBetween(txs, from, to, cat?.id);
    if (cat) {
      const stat = cur.categories.find((c) => c.category.id === cat.id);
      const limitText = stat && stat.limit > 0 && label === 'tháng này'
        ? ` (hạn mức ${vnd(stat.limit)}, đã dùng ${Math.round(stat.pct * 100)}%)`
        : '';
      return { text: `${label.charAt(0).toUpperCase() + label.slice(1)} bạn đã chi ${vnd(total)} cho ${cat.name.toLowerCase()}${limitText}.` };
    }
    const bars = cur.categories.filter((c) => c.spent > 0).slice(0, 4).map((c) => ({ label: c.category.short, value: c.spent, display: vnd(c.spent) }));
    return { text: `Tổng chi ${label} là ${vnd(total)}. Phân theo danh mục (cả tháng):`, bars: label === 'tháng này' ? bars : undefined };
  }

  // 6. General summary / fallback
  const insight = buildInsights(txs, categories, now)[0];
  return {
    text:
      `${insight ? insight.text + '\n\n' : ''}Mình có thể trả lời các câu như:\n• "Tháng này tiêu cà phê bao nhiêu?"\n• "Tuần này chi bao nhiêu?"\n• "So sánh với tháng trước"\n• "Dự báo cuối tháng"\n• "Mình nên tiết kiệm ở đâu?"\n\nMuốn trợ lý hiểu câu hỏi tự do hơn, bạn có thể dán API key Gemini trong Cài đặt.`,
  };
}
