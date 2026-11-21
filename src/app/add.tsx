import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryGrid } from '../components/CategoryPicker';
import { CategoryIcon } from '../components/icons/CategoryIcon';
import { Sheet } from '../components/Sheet';
import { Btn, Chip, F, Field, Icon, IconButton, Seg, Txt } from '../components/ui';
import { parseWithGemini } from '../lib/gemini';
import { catName, useL, useLang, useMoney } from '../lib/i18n';
import { safeToSpend } from '../lib/money';
import { parseExpenses } from '../lib/parser';
import { ruleKey, useStore } from '../lib/store';
import { DraftTx, TxType } from '../lib/types';
import { useColors } from '../theme';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { data, addDrafts, addTransaction, learn } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [walletId, setWalletId] = useState(data.wallets[0]?.id ?? 'cash');

  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftTx[] | null>(null);
  const [lastInput, setLastInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<'offline' | 'gemini'>('offline');
  const [aiError, setAiError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [categoryId, setCategoryId] = useState('an');
  const [note, setNote] = useState('');
  const [dayOffset, setDayOffset] = useState(0);

  const hasGemini = !!data.settings.geminiKey.trim();
  const examples = lang === 'vi' ? ['trưa ăn phở 45k, cafe 29k', 'hôm qua grab 32k, đổ xăng 80k', 'mẹ cho 1tr5', 'sân cầu lông 60k'] : ['lunch 50k, bus 7k', 'coffee 35k and bread 20k', 'salary 4m', 'badminton court 60k'];

  /** Apply categories learned from earlier corrections (FR-052). */
  const withRules = (list: DraftTx[]) =>
    list.map((d) => {
      const learned = data.rules[ruleKey(d.note)];
      const cat = learned ? data.categories.find((x) => x.id === learned) : undefined;
      return cat ? { ...d, categoryId: cat.id, type: cat.type } : d;
    });

  async function analyze(input = text) {
    const q = input.trim();
    if (!q) return;
    setBusy(true);
    setAiError('');
    setLastInput(q);
    let result: DraftTx[] = [];
    let used: 'offline' | 'gemini' = 'offline';
    if (hasGemini) {
      try {
        result = await parseWithGemini(q, data);
        used = 'gemini';
      } catch (e: any) {
        setAiError(L(`Gemini lỗi (${e?.message ?? '?'}), đã dùng bộ tách offline.`, `Gemini failed (${e?.message ?? '?'}); used the offline parser.`));
      }
    }
    if (used === 'offline') result = parseExpenses(q);
    setEngine(used);
    setDrafts(withRules(result));
    setText('');
    setBusy(false);
  }

  const impact = useMemo(() => {
    if (!drafts?.length) return null;
    const spend = drafts.filter((d) => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
    if (!spend) return null;
    const s = safeToSpend(data);
    const left = s.leftToday - spend;
    return left >= 0
      ? L(`Sau khi lưu, hôm nay còn tiêu được ${fmt(left)}.`, `After saving, ${fmt(left)} left to spend today.`)
      : L(`Sau khi lưu, hôm nay sẽ vượt mức an toàn ${fmt(-left)}.`, `After saving, today goes ${fmt(-left)} over the safe level.`);
  }, [drafts, data]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveDrafts() {
    if (!drafts?.length) return;
    addDrafts(drafts, engine === 'gemini' ? 'gemini' : 'ai', walletId);
    router.back();
  }

  function saveManual() {
    const n = parseInt(amount.replace(/\D/g, ''), 10);
    if (!n) return;
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    addTransaction({ amount: n, type, categoryId, walletId, note: note.trim(), date: d.toISOString(), source: 'manual' });
    if (note.trim()) learn(note.trim(), categoryId);
    router.back();
  }

  const editingDraft = drafts?.find((d) => d.key === editing);
  const manualAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;

  const walletPicker = data.wallets.length > 1 && (
    <View style={{ gap: 6 }}>
      <Txt w="medium" size={13} color={c.sub}>{L('Ví', 'Wallet')}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {data.wallets.map((w) => <Chip key={w.id} label={w.name} on={walletId === w.id} onPress={() => setWalletId(w.id)} />)}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12, paddingHorizontal: 12, paddingBottom: 12 }}>
        <IconButton name="close" label={L('Đóng', 'Close')} onPress={() => router.back()} bordered={false} bg="transparent" />
        <Txt w="bold" size={20}>{L('Thêm giao dịch', 'Add transaction')}</Txt>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Seg value={mode} onChange={setMode} options={[{ v: 'ai', l: L('Gõ câu (AI)', 'Type a sentence') }, { v: 'manual', l: L('Nhập tay', 'Manual') }]} />
      </View>

      {mode === 'ai' ? (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 14 }} keyboardShouldPersistTaps="handled">
            {!drafts && (
              <View style={{ gap: 12 }}>
                <Txt color={c.sub}>{L('Gõ chi tiêu như đang nhắn tin, nhiều khoản một lúc cũng được.', 'Type spending like a text message; several items at once is fine.')}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {examples.map((e) => <Chip key={e} label={e} onPress={() => analyze(e)} />)}
                </View>
                {walletPicker}
                <Txt size={13} color={c.sub}>{hasGemini ? L('Đang dùng Gemini (tự chuyển offline nếu lỗi).', 'Using Gemini (falls back offline).') : L('Đang dùng bộ tách offline.', 'Using the offline parser.')}</Txt>
              </View>
            )}
            {drafts && (
              <>
                <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.accent, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Txt color={c.onAccent}>{lastInput}</Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="spark" size={16} color={c.accent} />
                  <Txt size={13} color={c.sub} style={{ flex: 1 }}>
                    {drafts.length > 0
                      ? L(`Tách được ${drafts.length} giao dịch. Chạm từng dòng để sửa danh mục.`, `Found ${drafts.length} transactions. Tap a row to change its category.`)
                      : L('Chưa thấy số tiền nào. Thử ghi kèm số, ví dụ "phở 45k".', 'No amount found. Try including one, e.g. "lunch 45k".')}
                  </Txt>
                </View>
                {!!aiError && <Txt size={13} color={c.warn}>{aiError}</Txt>}
                {drafts.length > 0 && (
                  <View style={{ backgroundColor: c.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4 }}>
                    {drafts.map((d, i) => {
                      const cat = data.categories.find((x) => x.id === d.categoryId)!;
                      return (
                        <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: i === drafts.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
                          <Pressable accessibilityRole="button" onPress={() => setEditing(d.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <CategoryIcon id={cat.icon} color={cat.color} />
                            <View style={{ flex: 1, gap: 2 }}>
                              <Txt w="medium" numberOfLines={1}>{d.note || catName(cat, lang)}</Txt>
                              <Txt size={13} color={c.sub}>{catName(cat, lang)} · {d.timeLabel}</Txt>
                            </View>
                            <Txt w="semibold" color={d.type === 'income' ? c.accent : c.ink}>{d.type === 'income' ? '+' : '−'}{fmt(d.amount)}</Txt>
                          </Pressable>
                          <IconButton name="trash" label={L('Bỏ dòng này', 'Remove')} size={34} bordered={false} bg={c.bg} color={c.sub} onPress={() => setDrafts(drafts.filter((x) => x.key !== d.key))} />
                        </View>
                      );
                    })}
                  </View>
                )}
                {walletPicker}
                {impact && (
                  <View style={{ backgroundColor: c.accentSoft, borderRadius: 14, padding: 12 }}>
                    <Txt size={14} color={c.accentInk}>{impact}</Txt>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn label={L('Nhập lại', 'Edit text')} kind="secondary" style={{ flex: 1 }} onPress={() => { setText(lastInput); setDrafts(null); }} />
                  <Btn label={drafts.length ? L(`Lưu ${drafts.length} giao dịch`, `Save ${drafts.length}`) : L('Lưu', 'Save')} disabled={!drafts.length} style={{ flex: 2 }} onPress={saveDrafts} />
                </View>
              </>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.line }}>
            <TextInput
              accessibilityLabel={L('Mô tả chi tiêu', 'Describe spending')}
              value={text}
              onChangeText={setText}
              placeholder={L('VD: cafe 35k, grab 40k…', 'e.g. coffee 35k, bus 7k…')}
              placeholderTextColor={c.faint}
              onSubmitEditing={() => analyze()}
              returnKeyType="send"
              autoFocus
              style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 16, color: c.ink }}
            />
            <IconButton name="send" label={L('Phân tích', 'Read it')} onPress={() => analyze()} bg={text.trim() ? c.accent : c.faint} color={c.onAccent} size={46} bordered={false} />
          </View>
          {busy && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />}
        </>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Seg value={type} onChange={(t) => { setType(t); setCategoryId(t === 'income' ? 'tn' : 'an'); }} options={[{ v: 'expense', l: L('Khoản chi', 'Expense') }, { v: 'income', l: L('Khoản thu', 'Income') }]} />
          <Field
            label={L('Số tiền (đ)', 'Amount (₫)')}
            value={manualAmount ? manualAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0"
            style={{ height: 60, fontFamily: F.bold, fontSize: 28 }}
          />
          <View style={{ gap: 8 }}>
            <Txt w="medium" size={13} color={c.sub}>{L('Danh mục', 'Category')}</Txt>
            <CategoryGrid selected={categoryId} onSelect={setCategoryId} type={type} />
          </View>
          <Field label={L('Ghi chú', 'Note')} value={note} onChangeText={setNote} placeholder={L('VD: Phở bò', 'e.g. Lunch')} />
          {walletPicker}
          <View style={{ gap: 8 }}>
            <Txt w="medium" size={13} color={c.sub}>{L('Ngày', 'Day')}</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[{ v: 0, l: L('Hôm nay', 'Today') }, { v: -1, l: L('Hôm qua', 'Yesterday') }, { v: -2, l: L('Hôm kia', '2 days ago') }].map((o) => (
                <Chip key={o.v} label={o.l} on={dayOffset === o.v} onPress={() => setDayOffset(o.v)} />
              ))}
            </View>
          </View>
          <Btn label={L('Lưu giao dịch', 'Save transaction')} onPress={saveManual} disabled={!manualAmount} />
        </ScrollView>
      )}

      <Sheet visible={!!editingDraft} onClose={() => setEditing(null)} title={L('Sửa giao dịch', 'Edit transaction')}>
        {editingDraft && (
          <>
            <Field label={L('Ghi chú', 'Note')} value={editingDraft.note} onChangeText={(v) => setDrafts((ds) => ds!.map((d) => (d.key === editingDraft.key ? { ...d, note: v } : d)))} />
            <Txt w="medium" size={13} color={c.sub}>{L('Danh mục (MYX sẽ nhớ cho lần sau)', 'Category (MYX remembers next time)')}</Txt>
            <CategoryGrid
              selected={editingDraft.categoryId}
              onSelect={(id) => {
                const t = data.categories.find((x) => x.id === id)!.type;
                setDrafts((ds) => ds!.map((d) => (d.key === editingDraft.key ? { ...d, categoryId: id, type: t } : d)));
                learn(editingDraft.note, id);
              }}
            />
            <Btn label={L('Xong', 'Done')} onPress={() => setEditing(null)} />
          </>
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
