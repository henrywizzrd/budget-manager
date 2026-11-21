import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { Btn, Card, Chip, Field, Icon, Row, Seg, Txt } from '../components/ui';
import { uid } from '../lib/format';
import { useL, useMoney } from '../lib/i18n';
import { walletBalances } from '../lib/money';
import { useStore } from '../lib/store';
import { Wallet, WalletType } from '../lib/types';
import { useColors } from '../theme';

const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

/** Wallets and transfers (US11, FR-042): transfers never count as spending. */
export default function Wallets() {
  const { data, upsertWallet, removeWallet, transfer } = useStore();
  const c = useColors();
  const L = useL();
  const { fmt } = useMoney();
  const bal = walletBalances(data);
  const total = Object.values(bal).reduce((a, b) => a + b, 0);
  const [edit, setEdit] = useState<(Wallet & { init: string }) | null>(null);
  const [tr, setTr] = useState<{ from: string; to: string; amount: string } | null>(null);
  const typeName = (t: WalletType) => ({ cash: L('Tiền mặt', 'Cash'), bank: L('Ngân hàng', 'Bank'), ewallet: L('Ví điện tử', 'E-wallet'), other: L('Khác', 'Other') })[t];

  return (
    <Screen title={L('Ví', 'Wallets')} back dock={false}>
      <View style={{ backgroundColor: c.accent, borderRadius: 24, padding: 16 }}>
        <Txt size={13} color="rgba(255,255,255,0.88)">{L('Tổng số dư', 'Total balance')}</Txt>
        <Txt w="bold" size={30} color="#FFFFFF">{fmt(total)}</Txt>
      </View>
      <Card style={{ paddingVertical: 2 }}>
        {data.wallets.map((w, i) => (
          <Row key={w.id} last={i === data.wallets.length - 1} left={<Icon name="wallet" color={c.accent} />} title={w.name} sub={typeName(w.type)} right={<Txt w="semibold">{fmt(bal[w.id] ?? 0)}</Txt>} onPress={() => setEdit({ ...w, init: String(w.initial) })} />
        ))}
      </Card>
      <Btn label={L('+ Thêm ví', '+ Add wallet')} kind="secondary" onPress={() => setEdit({ id: '', name: '', type: 'ewallet', initial: 0, init: '' })} />
      {data.wallets.length > 1 && <Btn label={L('Chuyển tiền giữa các ví', 'Move money between wallets')} onPress={() => setTr({ from: data.wallets[0].id, to: data.wallets[1].id, amount: '' })} />}
      {data.transfers.length > 0 && (
        <Card style={{ gap: 6 }}>
          <Txt w="semibold">{L('Chuyển gần đây', 'Recent transfers')}</Txt>
          {[...data.transfers].reverse().slice(0, 8).map((t) => (
            <Txt key={t.id} size={14} color={c.sub}>
              {data.wallets.find((w) => w.id === t.from)?.name} → {data.wallets.find((w) => w.id === t.to)?.name} · {fmt(t.amount)}
            </Txt>
          ))}
        </Card>
      )}

      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit?.id ? L('Sửa ví', 'Edit wallet') : L('Ví mới', 'New wallet')}>
        {edit && (
          <>
            <Field label={L('Tên ví', 'Name')} value={edit.name} onChangeText={(v) => setEdit({ ...edit, name: v })} placeholder="MoMo" />
            <Seg value={edit.type} onChange={(v: WalletType) => setEdit({ ...edit, type: v })} options={[{ v: 'cash', l: L('Tiền mặt', 'Cash') }, { v: 'bank', l: L('Ngân hàng', 'Bank') }, { v: 'ewallet', l: L('Ví điện tử', 'E-wallet') }]} />
            <Field label={L('Số dư ban đầu (đ)', 'Opening balance (₫)')} keyboardType="number-pad" value={edit.init} onChangeText={(v) => setEdit({ ...edit, init: v })} />
            <Btn label={L('Lưu', 'Save')} disabled={!edit.name.trim()} onPress={() => { const { init, ...w } = edit; upsertWallet({ ...w, id: w.id || uid(), name: w.name.trim(), initial: num(init) }); setEdit(null); }} />
            {!!edit.id && data.wallets.length > 1 && <Btn label={L('Xóa ví (giao dịch chuyển sang ví khác)', 'Delete wallet (moves its transactions)')} kind="danger" onPress={() => { removeWallet(edit.id); setEdit(null); }} />}
          </>
        )}
      </Sheet>

      <Sheet visible={!!tr} onClose={() => setTr(null)} title={L('Chuyển tiền', 'Transfer')}>
        {tr && (
          <>
            <Txt w="medium" size={13} color={c.sub}>{L('Từ', 'From')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{data.wallets.map((w) => <Chip key={w.id} label={w.name} on={tr.from === w.id} onPress={() => setTr({ ...tr, from: w.id })} />)}</View>
            <Txt w="medium" size={13} color={c.sub}>{L('Đến', 'To')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{data.wallets.map((w) => <Chip key={w.id} label={w.name} on={tr.to === w.id} onPress={() => setTr({ ...tr, to: w.id })} />)}</View>
            <Field label={L('Số tiền (đ)', 'Amount (₫)')} keyboardType="number-pad" value={tr.amount} onChangeText={(v) => setTr({ ...tr, amount: v })} />
            <Btn label={L('Chuyển', 'Move')} disabled={!num(tr.amount) || tr.from === tr.to} onPress={() => { transfer(tr.from, tr.to, num(tr.amount)); setTr(null); }} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
