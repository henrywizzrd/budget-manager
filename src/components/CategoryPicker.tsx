import { Pressable, View } from 'react-native';

import { useStore } from '../lib/store';
import { TxType } from '../lib/types';
import { Badge, C, Txt } from './ui';

export function CategoryGrid({ selected, onSelect, type }: { selected: string; onSelect: (id: string) => void; type?: TxType }) {
  const { data } = useStore();
  const cats = type ? data.categories.filter((c) => c.type === type) : data.categories;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {cats.map((c) => {
        const on = c.id === selected;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(c.id)}
            style={{
              width: '31%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 14,
              borderWidth: on ? 2 : 1, borderColor: on ? C.accent : C.line, backgroundColor: on ? C.accentSoft : C.card,
            }}>
            <Badge text={c.short} fg={c.fg} bg={c.bg} size={32} />
            <Txt size={12} w={on ? 'semibold' : 'regular'} numberOfLines={1}>{c.name}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
