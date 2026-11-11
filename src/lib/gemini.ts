/**
 * Optional Gemini integration. Only used when the user pastes an API key in Settings.
 * Every call falls back to the offline logic on any error, so the app never breaks without network.
 */
import { monthStats } from './insights';
import { AppData, DraftTx } from './types';

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function generate(key: string, model: string, system: string, user: string, json: boolean): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(model || DEFAULT_GEMINI_MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.1 } : { temperature: 0.4 },
      }),
      signal: controller.signal,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    const parts: { text?: string }[] = body?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini trả về rỗng');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function testGeminiKey(key: string, model: string): Promise<string> {
  return generate(key, model, 'Trả lời đúng một từ.', 'Nói "OK".', false);
}

export async function parseWithGemini(input: string, data: AppData): Promise<DraftTx[]> {
  const cats = data.categories.map((c) => `${c.id}: ${c.name} (${c.type})`).join('\n');
  const system = `Bạn là bộ tách giao dịch tài chính cho người Việt. Từ câu người dùng, trích ra MỌI khoản thu/chi.
Danh mục hợp lệ (id: tên):
${cats}
Quy ước tiền: "k"/"nghìn"=1.000, "tr"/"triệu"/"củ"=1.000.000, "1tr5"=1.500.000, số không đơn vị dưới 1000 hiểu là nghìn.
Trả về JSON: {"items":[{"amount":number (VND, số nguyên dương),"type":"expense"|"income","categoryId":string,"note":string (ngắn gọn, tiếng Việt có dấu, viết hoa chữ đầu),"dayOffset":number (0 hôm nay, -1 hôm qua...),"timeLabel":string (vd "Trưa nay","Hôm qua")}]}`;
  const text = await generate(data.settings.geminiKey, data.settings.geminiModel, system, input, true);
  const parsed = JSON.parse(text);
  const items: any[] = Array.isArray(parsed) ? parsed : parsed.items ?? [];
  const ids = new Set(data.categories.map((c) => c.id));
  return items
    .filter((i) => typeof i.amount === 'number' && i.amount > 0)
    .map((i, idx) => {
      const categoryId = ids.has(i.categoryId) ? i.categoryId : 'kh';
      const cat = data.categories.find((c) => c.id === categoryId)!;
      return {
        key: `g${Date.now().toString(36)}${idx}`,
        amount: Math.round(i.amount),
        type: cat.type,
        categoryId,
        note: String(i.note ?? '').slice(0, 80),
        dayOffset: Number.isFinite(i.dayOffset) ? Math.min(0, Math.round(i.dayOffset)) : 0,
        timeLabel: String(i.timeLabel ?? 'Hôm nay'),
      };
    });
}

export async function askGemini(question: string, history: { role: string; text: string }[], data: AppData): Promise<string> {
  const now = new Date();
  const cur = monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now);
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = monthStats(data.transactions, data.categories, prevD.getFullYear(), prevD.getMonth(), now);
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? id;
  const recent = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 120)
    .map((t) => `${t.date.slice(0, 10)} | ${t.type === 'income' ? '+' : '-'}${t.amount} | ${catName(t.categoryId)} | ${t.note}`)
    .join('\n');

  const context = `Hôm nay: ${now.toISOString().slice(0, 10)} (ngày ${cur.daysElapsed}/${cur.daysTotal} của tháng).
Tháng này: thu ${cur.income}, chi ${cur.expense}, ngân sách ${cur.budget}, dự báo cuối tháng ${cur.forecast}.
Theo danh mục tháng này (đã chi / hạn mức): ${cur.categories.map((c) => `${c.category.name} ${c.spent}/${c.limit}`).join('; ')}
Tháng trước: thu ${prev.income}, chi ${prev.expense}.
Giao dịch gần đây (ngày | số tiền VND | danh mục | ghi chú):
${recent}`;

  const system = `Bạn là trợ lý tài chính cá nhân trong app quản lý ngân sách. Trả lời bằng tiếng Việt, ngắn gọn (tối đa 6 câu hoặc vài gạch đầu dòng), dựa đúng trên số liệu được cung cấp, định dạng tiền kiểu 1.250.000đ. Không bịa số liệu. Nếu thiếu dữ liệu thì nói rõ. Không dùng markdown đậm/nghiêng.
DỮ LIỆU NGƯỜI DÙNG:
${context}`;
  const convo = history.slice(-6).map((m) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.text}`).join('\n');
  return generate(data.settings.geminiKey, data.settings.geminiModel, system, `${convo}\nNgười dùng: ${question}`, false);
}
