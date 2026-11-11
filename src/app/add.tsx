import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryGrid } from '../components/CategoryPicker';
import { Sheet } from '../components/Sheet';
import { Badge, Btn, C, F, Icon, IconButton, Txt } from '../components/ui';
import { vnd } from '../lib/format';
import { parseWithGemini } from '../lib/gemini';
import { monthStats } from '../lib/insights';
import { parseExpenses } from '../lib/parser';
import { useStore } from '../lib/store';
import { DraftTx, TxType } from '../lib/types';

const EXAMPLES = [
  'trưa ăn phở 45k, cafe 29k',
  'hôm qua grab 32k, đổ xăng 80k',
  'nhận lương 6tr',
  'mua áo shopee 1tr2',
];

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { data, addDrafts, addTransaction } = useStore();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // AI mode
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftTx[] | null>(null);
  const [lastInput, setLastInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<'offline' | 'gemini'>('offline');
  const [aiError, setAiError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  // Manual mode
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [categoryId, setCategoryId] = useState('an');
  const [note, setNote] = useState('');
  const [dayOffset, setDayOffset] = useState(0);

  const hasGemini = !!data.settings.geminiKey.trim();

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
        setAiError(`Gemini lỗi (${e?.message ?? 'không rõ'}), đã dùng bộ tách offline.`);
      }
    }
    if (used === 'offline') result = parseExpenses(q);
    setEngine(used);
    setDrafts(result);
    setText('');
    setBusy(false);
  }

  const impact = useMemo(() => {
    if (!drafts || drafts.length === 0) return null;
    const now = new Date();
    const s = monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now);
    const firstExpense = drafts.find((d) => d.type === 'expense');
    if (!firstExpense) return null;
    const stat = s.categories.find((c) => c.category.id === firstExpense.categoryId);
    if (!stat || !stat.limit) return null;
    const add = drafts.filter((d) => d.categoryId === stat.category.id).reduce((a, d) => a + d.amount, 0);
    const after = stat.spent + add;
    const left = stat.limit - after;
    return left >= 0
      ? `Sau khi lưu, mục ${stat.category.name} còn ${vnd(left)} (đã dùng ${Math.round((after / stat.limit) * 100)}%).`
      : `Sau khi lưu, mục ${stat.category.name} sẽ vượt hạn mức ${vnd(-left)}.`;
  }, [drafts, data]);

  function saveDrafts() {
    if (!drafts?.length) return;
    addDrafts(drafts, engine === 'gemini' ? 'gemini' : 'ai');
    router.back();
  }

  function saveManual() {
    const n = parseInt(amount.replace(/\D/g, ''), 10);
    if (!n) return;
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    addTransaction({ amount: n, type, categoryId, note: note.trim(), date: d.toISOString(), source: 'manual' });
    router.back();
  }

  const editingDraft = drafts?.find((d) => d.key === editing);
  const manualAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12, paddingHorizontal: 12, paddingBottom: 12 }}>
        <IconButton name="close" label="Đóng" onPress={() => router.back()} bordered={false} bg="transparent" />
        <Txt w="semibold" size={18}>Thêm giao dịch</Txt>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        {(['ai', 'manual'] as const).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
            onPress={() => setMode(m)}
            style={{ flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? C.ink : C.card, borderWidth: mode === m ? 0 : 1, borderColor: C.line }}>
            <Txt w={mode === m ? 'semibold' : 'medium'} size={13} color={mode === m ? '#FFFFFF' : C.ink}>{m === 'ai' ? 'Gõ câu (AI)' : 'Nhập tay'}</Txt>
          </Pressable>
        ))}
      </View>

      {mode === 'ai' ? (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 14 }} keyboardShouldPersistTaps="handled">
            {!drafts && (
              <View style={{ gap: 12 }}>
                <Txt color={C.sub}>Gõ chi tiêu như đang nhắn tin, có thể nhiều khoản một lúc. Trên iPhone, bấm micro trên bàn phím để nói.</Txt>
                <Txt w="semibold" size={13}>Thử nhanh:</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {EXAMPLES.map((e) => (
                    <Pressable key={e} accessibilityRole="button" onPress={() => analyze(e)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.card }}>
                      <Txt size={13}>{e}</Txt>
                    </Pressable>
                  ))}
                </View>
                <Txt size={12} color={C.sub}>Đang dùng: {hasGemini ? 'Gemini (tự chuyển offline nếu lỗi)' : 'bộ tách offline'}.</Txt>
              </View>
            )}

            {drafts && (
              <>
                <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: C.ink, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Txt color="#FFFFFF">{lastInput}</Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="spark" size={16} color={C.accent} />
                  <Txt size={12} color={C.sub} style={{ flex: 1 }}>
                    {drafts.length > 0
                      ? `${engine === 'gemini' ? 'Gemini' : 'AI'} tách được ${drafts.length} giao dịch. Chạm vào từng dòng để sửa danh mục.`
                      : 'Mình chưa thấy số tiền nào. Thử ghi kèm số, ví dụ "phở 45k".'}
                  </Txt>
                </View>
                {!!aiError && <Txt size={12} color={C.warn}>{aiError}</Txt>}

                {drafts.length > 0 && (
                  <View style={{ backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4 }}>
                    {drafts.map((d, i) => {
                      const cat = data.categories.find((c) => c.id === d.categoryId)!;
                      return (
                        <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i === drafts.length - 1 ? 0 : 1, borderBottomColor: C.lineSoft }}>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Sửa ${d.note || cat.name}`} onPress={() => setEditing(d.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Badge text={cat.short} fg={cat.fg} bg={cat.bg} />
                            <View style={{ flex: 1, gap: 3 }}>
                              <Txt w="medium" numberOfLines={1}>{d.note || cat.name}</Txt>
                              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10, backgroundColor: cat.bg }}>
                                  <Txt w="semibold" size={11} color={cat.fg}>{cat.name}</Txt>
                                </View>
                                <Txt size={12} color={C.sub}>{d.timeLabel}</Txt>
                              </View>
                            </View>
                            <Txt w="semibold" color={d.type === 'income' ? C.accent : C.ink}>{d.type === 'income' ? '+' : '-'}{vnd(d.amount)}</Txt>
                          </Pressable>
                          <IconButton name="trash" label="Bỏ dòng này" size={34} bordered={false} bg={C.bg} color={C.sub} onPress={() => setDrafts(drafts.filter((x) => x.key !== d.key))} />
                        </View>
                      );
                    })}
                  </View>
                )}

                {impact && (
                  <View style={{ backgroundColor: C.accentSoft, borderRadius: 14, padding: 12 }}>
                    <Txt size={13} color={C.accentInk}>{impact}</Txt>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn label="Nhập lại" kind="secondary" style={{ flex: 1 }} onPress={() => { setText(lastInput); setDrafts(null); }} />
                  <Btn label={drafts.length ? `Lưu ${drafts.length} giao dịch` : 'Lưu'} disabled={!drafts.length} style={{ flex: 2 }} onPress={saveDrafts} />
                </View>
              </>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line }}>
            <TextInput
              accessibilityLabel="Mô tả chi tiêu"
              value={text}
              onChangeText={setText}
              placeholder="VD: cafe 35k, grab 40k…"
              placeholderTextColor="#8A919B"
              onSubmitEditing={() => analyze()}
              returnKeyType="send"
              autoFocus
              style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 15, color: C.ink }}
            />
            <IconButton name="send" label="Phân tích" onPress={() => analyze()} bg={text.trim() ? C.accent : '#9AA19B'} color="#FFFFFF" size={46} bordered={false} />
          </View>
        </>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['expense', 'income'] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: type === t }}
                onPress={() => { setType(t); setCategoryId(t === 'income' ? 'tn' : 'an'); }}
                style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: type === t ? 2 : 1, borderColor: type === t ? C.accent : C.line, backgroundColor: type === t ? C.accentSoft : C.card }}>
                <Txt w="semibold" size={14}>{t === 'expense' ? 'Khoản chi' : 'Khoản thu'}</Txt>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 6 }}>
            <Txt w="medium" size={13} color={C.sub}>Số tiền (đ)</Txt>
            <TextInput
              accessibilityLabel="Số tiền"
              value={manualAmount ? manualAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#8A919B"
              style={{ height: 60, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, fontFamily: F.bold, fontSize: 28, color: C.ink }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Txt w="medium" size={13} color={C.sub}>Danh mục</Txt>
            <CategoryGrid selected={categoryId} onSelect={setCategoryId} type={type} />
          </View>

          <View style={{ gap: 6 }}>
            <Txt w="medium" size={13} color={C.sub}>Ghi chú</Txt>
            <TextInput
              accessibilityLabel="Ghi chú"
              value={note}
              onChangeText={setNote}
              placeholder="VD: Phở bò"
              placeholderTextColor="#8A919B"
              style={{ height: 48, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, fontFamily: F.regular, fontSize: 15, color: C.ink }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Txt w="medium" size={13} color={C.sub}>Ngày</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[{ v: 0, l: 'Hôm nay' }, { v: -1, l: 'Hôm qua' }, { v: -2, l: 'Hôm kia' }].map((o) => (
                <Pressable key={o.v} accessibilityRole="button" accessibilityState={{ selected: dayOffset === o.v }} onPress={() => setDayOffset(o.v)}
                  style={{ paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: dayOffset === o.v ? C.ink : C.card, borderWidth: dayOffset === o.v ? 0 : 1, borderColor: C.line }}>
                  <Txt size={13} w="medium" color={dayOffset === o.v ? '#FFFFFF' : C.ink}>{o.l}</Txt>
                </Pressable>
              ))}
            </View>
          </View>

          <Btn label="Lưu giao dịch" onPress={saveManual} disabled={!manualAmount} />
        </ScrollView>
      )}

      <Sheet visible={!!editingDraft} onClose={() => setEditing(null)} title="Sửa giao dịch">
        {editingDraft && (
          <>
            <Txt w="semibold" size={16}>{editingDraft.note || 'Giao dịch'} · {vnd(editingDraft.amount)}</Txt>
            <Txt w="medium" size={13} color={C.sub}>Ghi chú</Txt>
            <TextInput
              accessibilityLabel="Ghi chú"
              value={editingDraft.note}
              onChangeText={(v) => setDrafts((ds) => ds!.map((d) => (d.key === editingDraft.key ? { ...d, note: v } : d)))}
              style={{ height: 46, borderRadius: 12, backgroundColor: C.bg, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 15, color: C.ink }}
            />
            <Txt w="medium" size={13} color={C.sub}>Danh mục</Txt>
            <CategoryGrid
              selected={editingDraft.categoryId}
              onSelect={(id) => {
                const t = data.categories.find((c) => c.id === id)!.type;
                setDrafts((ds) => ds!.map((d) => (d.key === editingDraft.key ? { ...d, categoryId: id, type: t } : d)));
              }}
            />
            <Btn label="Xong" onPress={() => setEditing(null)} />
          </>
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
