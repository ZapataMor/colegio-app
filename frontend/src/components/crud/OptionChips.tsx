import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

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
  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
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
              style={[styles.chip, selected && styles.chipSelected]}>
              <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
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
    borderColor: '#2A3344',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: '#101827',
  },
  chipSelected: {
    backgroundColor: '#F5B342',
    borderColor: '#F5B342',
  },
  chipText: {
    fontSize: 13,
    color: '#D4D9E2',
  },
  chipTextSelected: {
    color: '#101010',
    fontWeight: '800',
  },
});
