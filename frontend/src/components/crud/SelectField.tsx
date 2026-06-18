import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Muestra un campo de busqueda dentro del desplegable. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchable = false,
  searchPlaceholder = 'Buscar...',
}: SelectFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => (open ? close() : setOpen(true))}
        style={[styles.trigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>v</ThemedText>
      </Pressable>
      {open ? (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          {searchable ? (
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.textSecondary}
              style={[styles.search, { borderColor: theme.border, color: theme.text }]}
            />
          ) : null}
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View style={styles.item}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Sin resultados</ThemedText>
              </View>
            ) : filtered.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  close();
                }}
                style={[styles.item, option.value === value && { backgroundColor: `${theme.primary}22` }]}>
                <ThemedText type="small" style={{ color: theme.text }} numberOfLines={1}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  label: { fontWeight: '700', opacity: 0.78 },
  trigger: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dropdown: { borderWidth: 1, borderRadius: Spacing.two, marginTop: 2, zIndex: 99, overflow: 'hidden' },
  search: {
    minHeight: 40,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  item: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,127,127,0.12)',
  },
});
