import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { SpendCharts } from '../../components/Charts';
import { CategoryIcon } from '../../components/icons/CategoryIcon';
import { Screen } from '../../components/Screen';
import { TxRow } from '../../components/TxRow';
import { Card, Icon, IconButton, Ring, Txt } from '../../components/ui';
import { useL, useLang, useMoney } from '../../lib/i18n';
import { buildInsights, monthStats } from '../../lib/insights';
import { ddmm, safeToSpend, walletBalances } from '../../lib/money';
import { useStore } from '../../lib/store';
import { useColors } from '../../theme';

export default function Home() {
  const { data, addTransaction, updateSettings } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt, short } = useMoney();
  const now = new Date();
  const s = safeToSpend(data, now);
  const m = monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now);
  const insight = buildInsights(data.transactions, data.categories, now, lang)[0];
  const balances = walletBalances(data);
  const greet = data.settings.userName ? L(`Chào ${data.settings.userName}`, `Hi ${data.settings.userName}`) : L('Xin chào', 'Hello');
  const dateLabel = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'numeric' });
  const survival = s.shortfall > 0;

  return (
    <Screen
      sub={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      title={greet}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton name={data.settings.hideAmounts ? 'eyeOff' : 'eye'} label={L('Ẩn/hiện số tiền', 'Hide or show amounts')} onPress={() => updateSettings({ hideAmounts: !data.settings.hideAmounts })} size={40} />
          <IconButton name="settings" label={L('Cài đặt', 'Settings')} onPress={() => router.navigate('/settings')} size={40} />
        </View>
      }>
      {/* hero: left to spend today */}
      <View style={{ backgroundColor: survival ? c.warn : c.accent, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Ring pct={s.daily ? s.leftToday / s.daily : 0} size={112} stroke={13} color={c.hi} track="rgba(255,255,255,0.22)">
          <Txt w="bold" size={22} color="#FFFFFF">{s.daily ? Math.round((s.leftToday / s.daily) * 100) : 0}%</Txt>
          <Txt size={12} color="rgba(255,255,255,0.85)">{L('còn lại', 'left')}</Txt>
        </Ring>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={13} color="rgba(255,255,255,0.88)">{L('Hôm nay còn tiêu được', 'Left to spend today')}</Txt>
          <Txt w="bold" size={30} color="#FFFFFF" numberOfLines={1} adjustsFontSizeToFit style={{ lineHeight: 36 }}>{fmt(s.leftToday)}</Txt>
          <Txt size={13} color="rgba(255,255,255,0.9)">
            {survival
              ? L(`Thiếu ${fmt(s.shortfall)} đến kỳ nhận tiền`, `${fmt(s.shortfall)} short until payday`)
              : L(`Mỗi ngày ${fmt(s.daily)} · còn ${s.daysLeft} ngày tới ${ddmm(s.periodEnd)}`, `${fmt(s.daily)} a day · ${s.daysLeft} days until ${ddmm(s.periodEnd)}`)}
          </Txt>
        </View>
      </View>

      {survival && (
        <Card style={{ backgroundColor: c.warnSoft, borderColor: c.warn, gap: 6 }}>
          <Txt w="semibold" color={c.warnInk}>{L('Chế độ cứu nguy', 'Survival mode')}</Txt>
          <Txt size={14} color={c.warnInk}>
            {L(
              `Tiền hiện có không đủ tới kỳ nhận tiền. Ưu tiên tiền phòng, điện nước, đi lại; tạm dừng mua sắm và giải trí. Mức tối thiểu gợi ý: ${fmt(Math.max(30_000, Math.floor((s.balance - s.reserved) / s.daysLeft / 1000) * 1000))}/ngày cho ăn uống.`,
              `Your money won't last until payday. Pay rent, utilities and transport first; pause shopping and fun. Suggested minimum: ${fmt(Math.max(30_000, Math.floor((s.balance - s.reserved) / s.daysLeft / 1000) * 1000))}/day for food.`,
            )}
          </Txt>
          <Txt size={13} color={c.warnInk}>{L('Tránh vay qua app cho vay lãi cao: phí và lãi thường rất nặng. Hỏi người thân hoặc trường trước.', 'Avoid high-interest lending apps: fees and interest are usually very heavy. Ask family or your school first.')}</Txt>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { v: s.balance, l: L('Số dư', 'Balance'), go: '/wallets' as const },
          { v: s.reserved, l: L('Giữ cho hóa đơn', 'Held for bills'), go: '/bills' as const },
          { v: s.setAside, l: L('Đã để dành', 'Set aside'), go: '/budget' as const },
        ].map((x) => (
          <Pressable key={x.l} accessibilityRole="button" onPress={() => router.navigate(x.go)} style={{ flex: 1, backgroundColor: c.card, borderRadius: 18, padding: 10, borderWidth: 0.5, borderColor: c.line }}>
            <Txt w="bold" size={15} numberOfLines={1} adjustsFontSizeToFit>{fmt(x.v)}</Txt>
            <Txt size={12} color={c.sub} numberOfLines={2}>{x.l}</Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/budget')} style={{ flex: 1, backgroundColor: c.card, borderRadius: 18, padding: 12, borderWidth: 0.5, borderColor: c.line, gap: 2 }}>
          <Txt w="semibold" size={15}>{L('Ngân sách & mục tiêu', 'Budget & goals')}</Txt>
          <Txt size={13} color={c.sub}>{L(`Đã chi ${short(m.expense)} / ${short(m.budget)}`, `Spent ${short(m.expense)} of ${short(m.budget)}`)}</Txt>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/bills')} style={{ flex: 1, backgroundColor: c.card, borderRadius: 18, padding: 12, borderWidth: 0.5, borderColor: c.line, gap: 2 }}>
          <Txt w="semibold" size={15}>{L('Hóa đơn, nợ & gói', 'Bills, debts & plans')}</Txt>
          <Txt size={13} color={c.sub}>{L(`Cần trả ${short(s.reserved)}`, `Due ${short(s.reserved)}`)}</Txt>
        </Pressable>
      </View>

      {data.templates.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {data.templates.map((t) => {
            const cat = data.categories.find((x) => x.id === t.categoryId);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={L(`Ghi nhanh ${t.name}`, `Quick log ${t.name}`)}
                onPress={() => addTransaction({ amount: t.amount, type: 'expense', categoryId: t.categoryId, walletId: data.wallets[0]?.id ?? 'cash', note: t.name, date: new Date().toISOString(), source: 'template' })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.6 : 1 })}>
                {cat && <CategoryIcon id={cat.icon} color={cat.color} size={26} />}
                <Txt size={13} w="medium">{t.name} · {short(t.amount)}</Txt>
              </Pressable>
            );
          })}
        </View>
      )}

      <SpendCharts />

      {s.due.length > 0 && (
        <Card style={{ gap: 2 }}>
          <Txt w="semibold" style={{ marginBottom: 4 }}>{L('Sắp đến hạn', 'Coming up')}</Txt>
          {s.due.slice(0, 4).map((d, i, a) => (
            <View key={d.kind + d.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: i === a.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
              <View style={{ flex: 1 }}>
                <Txt w="medium" numberOfLines={1}>{d.name}</Txt>
                <Txt size={13} color={c.sub}>{d.days === 0 ? L('Hôm nay', 'Today') : L(`còn ${d.days} ngày · ${ddmm(d.due)}`, `in ${d.days} days · ${ddmm(d.due)}`)}</Txt>
              </View>
              <Txt w="semibold">{fmt(d.amount)}</Txt>
            </View>
          ))}
        </Card>
      )}

      {insight && (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="spark" size={16} color={c.accent} />
            <Txt w="semibold" color={c.accentInk}>{insight.title}</Txt>
          </View>
          <Txt size={14}>{insight.text}</Txt>
        </Card>
      )}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Txt w="semibold" style={{ flex: 1 }}>{L('Gần đây', 'Recent')}</Txt>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/history')} hitSlop={8}>
            <Txt size={13} w="semibold" color={c.accent}>{L('Xem tất cả', 'See all')}</Txt>
          </Pressable>
        </View>
        {data.transactions.length === 0 ? (
          <Txt size={14} color={c.sub} style={{ paddingVertical: 8 }}>{L('Chưa có giao dịch. Bấm nút + để ghi khoản đầu tiên.', 'No transactions yet. Tap + to log your first one.')}</Txt>
        ) : (
          data.transactions.slice(0, 5).map((t, i, a) => <TxRow key={t.id} tx={t} last={i === a.length - 1} showDate />)
        )}
      </Card>

      {data.wallets.length > 1 && (
        <Card style={{ gap: 6 }}>
          <Txt w="semibold">{L('Ví', 'Wallets')}</Txt>
          {data.wallets.map((w) => (
            <View key={w.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={14} color={c.sub}>{w.name}</Txt>
              <Txt size={14} w="semibold">{fmt(balances[w.id] ?? 0)}</Txt>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
