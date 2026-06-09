import { StyleSheet, TextInput, View } from 'react-native';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar por nombre, correo o documento...',
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}>
      <MagnifyingGlassIcon width={18} height={18} color={theme.textSecondary} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
        value={value}
      />
      <ThemedText style={[styles.shortcut, { color: theme.textSecondary }]}>⌘K</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.two,
  },
  shortcut: {
    fontSize: 11,
    fontWeight: '700',
  },
});
