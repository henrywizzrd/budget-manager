import { Pressable, View } from 'react-native';

import { catName, useLang } from '../lib/i18n';
import { useStore } from '../lib/store';
import { TxType } from '../lib/types';
import { useColors } from '../theme';
import { CategoryIcon } from './icons/CategoryIcon';
import { Txt } from './ui';

export function CategoryGrid({ selected, onSelect, type }: { selected: string; onSelect: (id: string) => void; type?: TxType }) {
  const { data } = useStore();
  const lang = useLang();
  const c = useColors();
  const cats = type ? data.categories.filter((x) => x.type === type) : data.categories;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {cats.map((x) => {
        const on = x.id === selected;
        return (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(x.id)}
            style={{ width: '31%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 16, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : c.card }}>
            <CategoryIcon id={x.icon} color={x.color} size={34} />
            <Txt size={13} w={on ? 'semibold' : 'regular'} numberOfLines={1}>{catName(x, lang)}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
