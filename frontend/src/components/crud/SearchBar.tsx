import { StyleSheet, TextInput, View } from 'react-native';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

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
  return (
    <View style={styles.wrap}>
      <MagnifyingGlassIcon width={18} height={18} color="#A7B0C0" />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C95A5"
        style={styles.input}
        value={value}
      />
      <ThemedText style={styles.shortcut}>⌘K</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101827',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#293244',
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    color: '#F5F4F0',
    fontSize: 15,
    paddingVertical: Spacing.two,
  },
  shortcut: {
    color: '#A7B0C0',
    fontSize: 11,
    fontWeight: '700',
  },
});
