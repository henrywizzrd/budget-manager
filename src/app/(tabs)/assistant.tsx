import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, Icon, IconButton, Txt } from '../../components/ui';
import { answerOffline } from '../../lib/assistant';
import { uid } from '../../lib/format';
import { askGemini } from '../../lib/gemini';
import { useStore } from '../../lib/store';
import { ChatMessage } from '../../lib/types';

const SUGGESTIONS = ['Tháng này tiêu cà phê bao nhiêu?', 'So sánh với tháng trước', 'Dự báo cuối tháng', 'Mình nên tiết kiệm ở đâu?', 'Tuần này chi bao nhiêu?'];

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const hasGemini = !!data.settings.geminiKey.trim();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'hello', role: 'assistant', text: 'Chào bạn! Mình là trợ lý tài chính. Hỏi mình về chi tiêu, ngân sách hay cách tiết kiệm nhé.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  async function send(q = input) {
    const text = q.trim();
    if (!text || busy) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', text };
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    let reply: ChatMessage;
    if (hasGemini) {
      try {
        const t = await askGemini(text, history, data);
        reply = { id: uid(), role: 'assistant', text: t };
      } catch (e: any) {
        const off = answerOffline(text, data);
        reply = { id: uid(), role: 'assistant', ...off, text: `(Gemini lỗi: ${e?.message ?? 'không rõ'}. Trả lời offline.)\n${off.text}` };
      }
    } else {
      reply = { id: uid(), role: 'assistant', ...answerOffline(text, data) };
    }
    setMessages((m) => [...m, reply]);
    setBusy(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="spark" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="semibold" size={16}>Trợ lý tài chính</Txt>
          <Txt size={12} color={C.sub}>{hasGemini ? 'Đang dùng Gemini' : 'Chế độ offline · thêm key Gemini trong Cài đặt'}</Txt>
        </View>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 14 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {messages.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: C.ink, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Txt color="#FFFFFF">{m.text}</Txt>
            </View>
          ) : (
            <View key={m.id} style={{ alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: C.card, borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <Txt style={{ lineHeight: 21 }}>{m.text}</Txt>
              {m.bars && m.bars.length > 0 && (
                <View style={{ gap: 8 }}>
                  {m.bars.map((b) => {
                    const max = Math.max(...m.bars!.map((x) => x.value), 1);
                    return (
                      <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Txt size={12} color={C.sub} style={{ width: 28 }}>{b.label}</Txt>
                        <View style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: C.lineSoft, overflow: 'hidden' }}>
                          <View style={{ width: `${(b.value / max) * 100}%`, height: 14, borderRadius: 4, backgroundColor: C.accent }} />
                        </View>
                        <Txt w="semibold" size={12} style={{ minWidth: 76, textAlign: 'right' }}>{b.display}</Txt>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ),
        )}
        {busy && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14 }}>
            <ActivityIndicator color={C.accent} />
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 10 }}>
        {SUGGESTIONS.map((s) => (
          <Pressable key={s} accessibilityRole="button" onPress={() => send(s)} style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, justifyContent: 'center' }}>
            <Txt size={13}>{s}</Txt>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line }}>
        <TextInput
          accessibilityLabel="Câu hỏi cho trợ lý"
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi trợ lý…"
          placeholderTextColor="#8A919B"
          onSubmitEditing={() => send()}
          returnKeyType="send"
          style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 15, color: C.ink }}
        />
        <IconButton name="send" label="Gửi" onPress={() => send()} bg={C.accent} color="#FFFFFF" size={46} bordered={false} />
      </View>
    </KeyboardAvoidingView>
  );
}
