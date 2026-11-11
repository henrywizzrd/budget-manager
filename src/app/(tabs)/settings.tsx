import { useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, C, Card, F, Txt } from '../../components/ui';
import { DEFAULT_GEMINI_MODEL, testGeminiKey } from '../../lib/gemini';
import { useStore } from '../../lib/store';

const input = { height: 48, borderRadius: 12, backgroundColor: C.bg, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 15, color: C.ink } as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateSettings, loadSample, resetAll } = useStore();
  const [name, setName] = useState(data.settings.userName);
  const [key, setKey] = useState(data.settings.geminiKey);
  const [model, setModel] = useState(data.settings.geminiModel);
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');

  async function saveAi() {
    const k = key.trim();
    const m = model.trim() || DEFAULT_GEMINI_MODEL;
    updateSettings({ geminiKey: k, geminiModel: m });
    if (!k) {
      setStatus('Đã tắt Gemini, app dùng AI offline.');
      return;
    }
    setTesting(true);
    setStatus('Đang kiểm tra key…');
    try {
      await testGeminiKey(k, m);
      setStatus('Kết nối Gemini thành công.');
    } catch (e: any) {
      setStatus(`Không kết nối được: ${e?.message ?? 'lỗi không rõ'}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Txt w="bold" size={22}>Cài đặt</Txt>

      <Card style={{ gap: 10 }}>
        <Txt w="semibold" size={15}>Tên của bạn</Txt>
        <TextInput accessibilityLabel="Tên của bạn" value={name} onChangeText={setName} onEndEditing={() => updateSettings({ userName: name.trim() })} onBlur={() => updateSettings({ userName: name.trim() })} placeholder="VD: Tyson" placeholderTextColor="#8A919B" style={input} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt w="semibold" size={15}>AI nâng cao (Gemini, tùy chọn)</Txt>
        <Txt size={13} color={C.sub}>
          Không có key, app vẫn tách câu và trả lời bằng AI offline. Dán API key Gemini (miễn phí ở Google AI Studio) để trợ lý hiểu câu hỏi tự do hơn. Key chỉ lưu trên máy bạn.
        </Txt>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}>
          <Txt w="semibold" size={13} color={C.accent}>Lấy API key tại aistudio.google.com →</Txt>
        </Pressable>
        <TextInput accessibilityLabel="API key Gemini" value={key} onChangeText={setKey} placeholder="AIza…" placeholderTextColor="#8A919B" autoCapitalize="none" autoCorrect={false} secureTextEntry style={input} />
        <Txt size={12} color={C.sub}>Model</Txt>
        <TextInput accessibilityLabel="Tên model Gemini" value={model} onChangeText={setModel} placeholder={DEFAULT_GEMINI_MODEL} placeholderTextColor="#8A919B" autoCapitalize="none" autoCorrect={false} style={input} />
        <Btn label="Lưu & kiểm tra" onPress={saveAi} loading={testing} />
        {!!status && <Txt size={13} color={status.startsWith('Không') ? C.danger : C.accentInk}>{status}</Txt>}
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt w="semibold" size={15}>Dữ liệu</Txt>
        <Txt size={13} color={C.sub}>Dữ liệu lưu trên máy (AsyncStorage). Hiện có {data.transactions.length} giao dịch.</Txt>
        <Btn label="Tạo dữ liệu mẫu (6 tuần)" kind="secondary" onPress={() => { loadSample(); setMsg('Đã tạo dữ liệu mẫu.'); }} />
        {!confirmReset ? (
          <Btn label="Xóa toàn bộ giao dịch" kind="danger" onPress={() => setConfirmReset(true)} />
        ) : (
          <View style={{ gap: 8 }}>
            <Txt size={13} color={C.danger}>Xóa hết giao dịch và hạn mức? Không hoàn tác được.</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn label="Hủy" kind="secondary" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
              <Btn label="Xóa hết" kind="danger" style={{ flex: 1 }} onPress={() => { resetAll(); setConfirmReset(false); setMsg('Đã xóa dữ liệu.'); }} />
            </View>
          </View>
        )}
        {!!msg && <Txt size={13} color={C.accentInk}>{msg}</Txt>}
      </Card>

      <Txt size={12} color={C.sub} style={{ textAlign: 'center' }}>Budget AI · v1.0.0</Txt>
    </ScrollView>
  );
}
