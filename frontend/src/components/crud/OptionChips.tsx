import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChipOption = {
  value: string;
  label: string;
};

type OptionChipsProps = {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
};

export function OptionChips({ label, options, value, onChange }: OptionChipsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary : theme.surfaceMuted,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}>
              <ThemedText
                style={[
                  styles.chipText,
                  { color: selected ? theme.primaryText : theme.textSecondary },
                  selected && styles.chipTextSelected,
                ]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    fontWeight: '700',
    opacity: 0.78,
  },
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    fontWeight: '800',
  },
});
