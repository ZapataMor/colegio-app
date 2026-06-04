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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
