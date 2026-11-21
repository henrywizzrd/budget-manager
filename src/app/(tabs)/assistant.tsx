import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { amEndPadding } from '../../components/dock/metrics';
import { Btn, F, Icon, IconButton, Txt } from '../../components/ui';
import { answerOffline, SUGGESTIONS } from '../../lib/assistant';
import { uid } from '../../lib/format';
import { askGemini } from '../../lib/gemini';
import { catName, useL, useLang, useMoney } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { ChatMessage } from '../../lib/types';
import { useColors } from '../../theme';

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { data, setCategoryLimit, addDrafts, upsertGoal } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const hasGemini = !!data.settings.geminiKey.trim();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'hello', role: 'assistant', text: L('Chào bạn, mình là trợ lý của MYX. Mình xem được chi tiêu của bạn, giúp ghi chép, đặt ngân sách và trả lời "mua được không?". Mọi thay đổi đều cần bạn xác nhận.', "Hi, I'm the MYX assistant. I can see your spending, log transactions, set budgets and answer \"can I afford it?\". Every change needs your confirmation.") },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  async function send(q = input) {
    const text = q.trim();
    if (!text || busy) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { id: uid(), role: 'user', text }]);
    setInput('');
    setBusy(true);
    const off = answerOffline(text, data);
    let reply: ChatMessage = { id: uid(), role: 'assistant', ...off, actionState: off.action ? 'proposed' : undefined };
    // Gemini only for free-form questions: actions and money tools stay deterministic and offline
    if (hasGemini && !off.action) {
      try {
        const t = await askGemini(text, history, data);
        reply = { id: uid(), role: 'assistant', text: t };
      } catch (e: any) {
        reply = { ...reply, text: `${L('(Gemini lỗi, trả lời offline.)', '(Gemini failed, answering offline.)')}\n${off.text}` };
      }
    }
    setMessages((m) => [...m, reply]);
    setBusy(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }

  function confirm(id: string, ok: boolean) {
    const msg = messages.find((m) => m.id === id);
    if (!msg?.action) return;
    if (ok) {
      const a = msg.action;
      if (a.type === 'set_category_limit') setCategoryLimit(a.categoryId, a.limit);
      if (a.type === 'add_transactions') addDrafts(a.items, 'ai');
      if (a.type === 'create_goal') upsertGoal({ id: uid(), name: a.name, target: a.target, saved: 0, emergency: false, dailyTarget: 0, days: [] });
    }
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, actionState: ok ? 'confirmed' : 'rejected' } : m)));
  }

  function actionLabel(m: ChatMessage): string {
    const a = m.action!;
    if (a.type === 'set_category_limit') {
      const cat = data.categories.find((x) => x.id === a.categoryId);
      return `${catName(cat, lang)}: ${fmt(cat?.limit ?? 0)} → ${fmt(a.limit)} / ${L('tháng', 'month')}`;
    }
    if (a.type === 'create_goal') return `${L('Mục tiêu', 'Goal')}: ${a.name} · ${fmt(a.target)}`;
    return a.items.map((d) => `${d.note || catName(data.categories.find((x) => x.id === d.categoryId), lang)} ${d.type === 'income' ? '+' : '−'}${fmt(d.amount)}`).join(', ');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Txt w="bold" size={28} style={{ lineHeight: 34 }}>{L('Trợ lý', 'Assistant')}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hasGemini ? c.accent : c.hi }} />
            <Txt size={13} color={c.sub}>{hasGemini ? L('Gemini (key của bạn)', 'Gemini (your key)') : L('Offline · miễn phí', 'Offline · free')}</Txt>
          </View>
        </View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {messages.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '84%', backgroundColor: c.accent, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 15, paddingVertical: 11 }}>
              <Txt color={c.onAccent}>{m.text}</Txt>
            </View>
          ) : (
            <View key={m.id} style={{ alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: c.card, borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 15, paddingVertical: 12, gap: 10, borderWidth: 0.5, borderColor: c.line }}>
              <Txt style={{ lineHeight: 22 }}>{m.text}</Txt>
              {m.bars && m.bars.length > 0 && (
                <View style={{ gap: 8 }}>
                  {m.bars.map((b, i) => {
                    const max = Math.max(...m.bars!.map((x) => x.value), 1);
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Txt size={12} color={c.sub} style={{ width: 64 }} numberOfLines={1}>{b.label}</Txt>
                        <View style={{ flex: 1, height: 12, borderRadius: 4, backgroundColor: c.lineSoft, overflow: 'hidden' }}>
                          <View style={{ width: `${(b.value / max) * 100}%`, height: 12, borderRadius: 4, backgroundColor: c.accent }} />
                        </View>
                        <Txt w="semibold" size={12} style={{ minWidth: 70, textAlign: 'right' }}>{data.settings.hideAmounts ? '•••' : b.display}</Txt>
                      </View>
                    );
                  })}
                </View>
              )}
              {m.action && (
                <View style={{ borderWidth: 2, borderColor: c.accent, borderRadius: 16, padding: 12, gap: 8, backgroundColor: c.accentSoft }}>
                  <Txt size={13} color={c.sub}>{L('Đề xuất thay đổi', 'Proposed change')}</Txt>
                  <Txt w="semibold">{actionLabel(m)}</Txt>
                  {m.actionState === 'proposed' ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Btn label={L('Xác nhận', 'Confirm')} onPress={() => confirm(m.id, true)} style={{ flex: 1, minHeight: 40 }} />
                      <Btn label={L('Bỏ qua', 'Dismiss')} kind="secondary" onPress={() => confirm(m.id, false)} style={{ flex: 1, minHeight: 40 }} />
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {m.actionState === 'confirmed' && <Icon name="check" size={16} color={c.accent} />}
                      <Txt size={13} color={c.sub}>{m.actionState === 'confirmed' ? L('Đã cập nhật', 'Done') : L('Đã bỏ qua', 'Dismissed')}</Txt>
                    </View>
                  )}
                </View>
              )}
            </View>
          ),
        )}
        {busy && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14 }}>
            <ActivityIndicator color={c.accent} />
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
        {SUGGESTIONS[lang].map((s) => (
          <Pressable key={s} accessibilityRole="button" onPress={() => send(s)} style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, justifyContent: 'center' }}>
            <Txt size={13}>{s}</Txt>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: amEndPadding(insets.bottom) - 8 }}>
        <TextInput
          accessibilityLabel={L('Câu hỏi cho trợ lý', 'Message to the assistant')}
          value={input}
          onChangeText={setInput}
          placeholder={L('Hỏi về tiền của bạn…', 'Ask about your money…')}
          placeholderTextColor={c.faint}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 16, color: c.ink }}
        />
        <IconButton name="send" label={L('Gửi', 'Send')} onPress={() => send()} bg={c.accent} color={c.onAccent} size={46} bordered={false} />
      </View>
    </KeyboardAvoidingView>
  );
}
