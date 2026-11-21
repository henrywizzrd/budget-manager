import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, Switch, View } from 'react-native';

import { canUseBiometrics } from '../../components/AppLock';
import { CategoryIcon } from '../../components/icons/CategoryIcon';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { Btn, Card, Field, Icon, Seg, Txt } from '../../components/ui';
import { CategoryGrid } from '../../components/CategoryPicker';
import { uid } from '../../lib/format';
import { testGeminiKey } from '../../lib/gemini';
import { catName, useL, useLang, useMoney } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { ensurePermission } from '../../services/notifications';
import { THEMES, useColors } from '../../theme';

const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

function csv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function Settings() {
  const { data, updateSettings, loadSample, resetAll, upsertTemplate, removeTemplate } = useStore();
  const st = data.settings;
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const [key, setKey] = useState(st.geminiKey);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');
  const [tpl, setTpl] = useState<{ name: string; amount: string; categoryId: string } | null>(null);

  const Row = ({ label, sub, right, onPress }: { label: string; sub?: string; right?: React.ReactNode; onPress?: () => void }) => (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.lineSoft }}>
      <View style={{ flex: 1 }}>
        <Txt w="medium">{label}</Txt>
        {sub ? <Txt size={13} color={c.sub}>{sub}</Txt> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevR" size={18} color={c.sub} /> : null)}
    </Pressable>
  );

  async function toggleLock(v: boolean) {
    if (v && !(await canUseBiometrics())) {
      setMsg(L('Máy chưa bật Face ID / vân tay / mã khóa, nên chưa khóa app được.', 'This phone has no Face ID, fingerprint or passcode set up, so the app cannot be locked.'));
      return;
    }
    updateSettings({ lock: v });
  }

  async function exportData() {
    const cat = (id: string) => catName(data.categories.find((x) => x.id === id), lang);
    const wallet = (id: string) => data.wallets.find((w) => w.id === id)?.name ?? '';
    const body = csv([
      ['date', 'type', 'amount', 'category', 'wallet', 'note'],
      ...data.transactions.map((t) => [t.date, t.type, t.amount, cat(t.categoryId), wallet(t.walletId), t.note]),
    ]);
    try {
      await Share.share({ title: 'MYX export.csv', message: body });
    } catch {}
  }

  async function saveKey() {
    const k = key.trim();
    if (!k) {
      updateSettings({ geminiKey: '' });
      return setMsg(L('Đã xóa key, trợ lý dùng chế độ offline.', 'Key removed; the assistant is offline.'));
    }
    setTesting(true);
    try {
      await testGeminiKey(k, st.geminiModel);
      updateSettings({ geminiKey: k });
      setMsg(L('Key hoạt động. Trợ lý sẽ dùng Gemini.', 'Key works. The assistant will use Gemini.'));
    } catch (e: any) {
      setMsg(L(`Key không dùng được: ${e?.message ?? ''}`, `Key failed: ${e?.message ?? ''}`));
    } finally {
      setTesting(false);
    }
  }

  return (
    <Screen title={L('Cài đặt', 'Settings')} back>
      {!!msg && <Card style={{ backgroundColor: c.accentSoft }}><Txt size={14}>{msg}</Txt></Card>}

      <Card style={{ gap: 10 }}>
        <Field label={L('Tên của bạn', 'Your name')} value={st.userName} onChangeText={(v) => updateSettings({ userName: v })} placeholder="Tyson" />
        <Txt w="medium" size={13} color={c.sub}>{L('Ngôn ngữ', 'Language')}</Txt>
        <Seg value={st.lang} onChange={(v) => updateSettings({ lang: v })} options={[{ v: 'vi', l: 'Tiếng Việt' }, { v: 'en', l: 'English' }]} />
        <Txt w="medium" size={13} color={c.sub}>{L('Giao diện', 'Appearance')}</Txt>
        <Seg value={st.appearance} onChange={(v) => updateSettings({ appearance: v })} options={[{ v: 'light', l: L('Sáng', 'Light') }, { v: 'dark', l: L('Tối', 'Dark') }, { v: 'system', l: L('Hệ thống', 'System') }]} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt w="semibold">Theme</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {THEMES.map((t) => {
            const on = st.theme === t.id;
            const locked = t.pro && !st.pro;
            return (
              <Pressable key={t.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => (locked ? router.push('/pro') : updateSettings({ theme: t.id }))}
                style={{ width: '30%', flexGrow: 1, borderRadius: 16, padding: 8, borderWidth: 2, borderColor: on ? c.ink : c.line, backgroundColor: c.card, gap: 6 }}>
                <View style={{ height: 44, borderRadius: 10, backgroundColor: t.p, flexDirection: 'row', alignItems: 'flex-end', padding: 6, gap: 4 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
                  <View style={{ width: 14, height: 14, borderRadius: 5, backgroundColor: t.a }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Txt size={13} w="semibold" style={{ flex: 1 }}>{lang === 'vi' ? t.vi : t.en}</Txt>
                  {t.pro && <Txt size={11} w="bold" color={c.hi}>PRO</Txt>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <Row label={L('Ẩn số tiền', 'Hide amounts')} sub={L('Hiện ••• thay cho số tiền khi ở nơi đông người', 'Show ••• instead of amounts in public')} right={<Switch value={st.hideAmounts} onValueChange={(v) => updateSettings({ hideAmounts: v })} trackColor={{ true: c.accent }} />} />
        <Row label={L('Khóa app', 'App lock')} sub={L('Face ID / vân tay / mã khóa của máy', 'Face ID / fingerprint / device passcode')} right={<Switch value={st.lock} onValueChange={toggleLock} trackColor={{ true: c.accent }} />} />
        {st.lock && (
          <View style={{ paddingVertical: 10, gap: 6 }}>
            <Txt size={13} color={c.sub}>{L('Khóa lại sau khi rời app', 'Re-lock after leaving the app')}</Txt>
            <Seg value={st.lockDelay} onChange={(v) => updateSettings({ lockDelay: v })} options={[{ v: 0, l: L('Ngay', 'Now') }, { v: 30, l: '30s' }, { v: 300, l: L('5 phút', '5 min') }]} />
          </View>
        )}
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <View style={{ paddingVertical: 10, gap: 6 }}>
          <Txt w="medium">{L('Ngày nhận tiền hằng tháng', 'Monthly payday')}</Txt>
          <Txt size={13} color={c.sub}>{L('Dùng để tính "hôm nay còn tiêu được". Để 0 nếu không cố định (tính tới cuối tháng).', 'Used for "left to spend today". Use 0 if it varies (counts to month end).')}</Txt>
          <Field keyboardType="number-pad" value={String(st.payday)} onChangeText={(v) => updateSettings({ payday: Math.min(31, num(v)) })} />
        </View>
        <Row label={L('Ví và chuyển tiền', 'Wallets & transfers')} sub={L(`${data.wallets.length} ví`, `${data.wallets.length} wallets`)} onPress={() => router.push('/wallets')} />
        <Row label={L('Recap tháng', 'Monthly recap')} sub={L('Thẻ tổng kết để chia sẻ', 'A shareable summary card')} onPress={() => router.push('/recap')} />
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <Row label={L('Tổng kết cuối ngày', 'Daily recap')} sub={L(`Thông báo lúc ${st.recapHour}:00`, `Notification at ${st.recapHour}:00`)} right={<Switch value={st.recap} onValueChange={(v) => { updateSettings({ recap: v }); if (v) ensurePermission(); }} trackColor={{ true: c.accent }} />} />
        {st.recap && (
          <View style={{ paddingVertical: 10 }}>
            <Seg value={st.recapHour} onChange={(v) => updateSettings({ recapHour: v })} options={[20, 21, 22].map((h) => ({ v: h, l: `${h}:00` }))} />
          </View>
        )}
        <Row label={L('Tổng kết tuần', 'Weekly summary')} sub={L('Tối Chủ nhật', 'Sunday evening')} right={<Switch value={st.weekly} onValueChange={(v) => { updateSettings({ weekly: v }); if (v) ensurePermission(); }} trackColor={{ true: c.accent }} />} />
      </Card>

      <Card style={{ gap: 6 }}>
        <Txt w="semibold">{L('Mẫu chi quen thuộc', 'Quick templates')}</Txt>
        <Txt size={13} color={c.sub}>{L('Hiện trên Trang chủ, chạm một lần là ghi.', 'Shown on Home; one tap logs it.')}</Txt>
        {data.templates.map((t) => {
          const cat = data.categories.find((x) => x.id === t.categoryId);
          return (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              {cat && <CategoryIcon id={cat.icon} color={cat.color} size={30} />}
              <Txt style={{ flex: 1 }} numberOfLines={1}>{t.name} · {fmt(t.amount)}</Txt>
              <Pressable accessibilityRole="button" accessibilityLabel={L('Xóa', 'Delete')} onPress={() => removeTemplate(t.id)} hitSlop={8}><Icon name="trash" size={18} color={c.sub} /></Pressable>
            </View>
          );
        })}
        <Btn label={L('+ Thêm mẫu', '+ Add template')} kind="secondary" onPress={() => setTpl({ name: '', amount: '', categoryId: 'cf' })} />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={{ borderRadius: 20, padding: 16, borderWidth: 2, borderColor: c.hi, backgroundColor: c.card, gap: 2 }}>
        <Txt w="bold" size={17}>MYX Pro {st.pro ? '✓' : ''}</Txt>
        <Txt size={14} color={c.sub}>{L('AI cloud, thêm theme, báo cáo nâng cao. Tính năng cốt lõi luôn miễn phí.', 'Cloud AI, more themes, advanced reports. Core features are always free.')}</Txt>
      </Pressable>

      <Card style={{ gap: 10 }}>
        <Txt w="semibold">{L('Trợ lý AI (tùy chọn)', 'AI assistant (optional)')}</Txt>
        <Txt size={13} color={c.sub}>{L('Dán API key Gemini miễn phí từ aistudio.google.com để trợ lý hiểu câu hỏi tự do hơn. Key chỉ lưu trên máy.', 'Paste a free Gemini API key from aistudio.google.com for free-form questions. The key stays on this phone.')}</Txt>
        <Field value={key} onChangeText={setKey} placeholder="AIza…" autoCapitalize="none" autoCorrect={false} secureTextEntry />
        <Btn label={L('Lưu key', 'Save key')} onPress={saveKey} loading={testing} kind="secondary" />
      </Card>

      <Card style={{ paddingVertical: 2 }}>
        <Row label={L('Xuất dữ liệu (CSV)', 'Export data (CSV)')} onPress={exportData} />
        <Row label={L('Tạo dữ liệu mẫu', 'Load sample data')} sub={L('Thay dữ liệu hiện tại bằng 6 tuần mẫu', 'Replace current data with 6 sample weeks')} onPress={() => Alert.alert(L('Tạo dữ liệu mẫu?', 'Load sample data?'), L('Dữ liệu hiện tại sẽ bị thay thế.', 'Your current data will be replaced.'), [{ text: L('Hủy', 'Cancel'), style: 'cancel' }, { text: 'OK', onPress: loadSample }])} />
        <Row label={L('Xóa toàn bộ dữ liệu', 'Erase all data')} onPress={() => Alert.alert(L('Xóa toàn bộ dữ liệu?', 'Erase all data?'), L('Không thể hoàn tác.', 'This cannot be undone.'), [{ text: L('Hủy', 'Cancel'), style: 'cancel' }, { text: L('Xóa', 'Erase'), style: 'destructive', onPress: resetAll }])} />
      </Card>
      <Txt size={12} color={c.faint} style={{ textAlign: 'center' }}>MYX · v1.0.0 · {L('bản thử nghiệm, dữ liệu lưu trên máy', 'test build, data stays on this phone')}</Txt>

      <Sheet visible={!!tpl} onClose={() => setTpl(null)} title={L('Mẫu chi mới', 'New template')}>
        {tpl && (
          <>
            <Field label={L('Tên', 'Name')} value={tpl.name} onChangeText={(v) => setTpl({ ...tpl, name: v })} placeholder={L('Cà phê như mọi ngày', 'Usual coffee')} />
            <Field label={L('Số tiền (đ)', 'Amount (₫)')} keyboardType="number-pad" value={tpl.amount} onChangeText={(v) => setTpl({ ...tpl, amount: v })} />
            <CategoryGrid type="expense" selected={tpl.categoryId} onSelect={(id) => setTpl({ ...tpl, categoryId: id })} />
            <Btn label={L('Lưu', 'Save')} disabled={!tpl.name.trim() || !num(tpl.amount)} onPress={() => { upsertTemplate({ id: uid(), name: tpl.name.trim(), amount: num(tpl.amount), categoryId: tpl.categoryId }); setTpl(null); }} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
