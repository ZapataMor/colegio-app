import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type ConfirmModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title = 'Confirmar',
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const theme = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: theme.border }]}> 
          <ThemedText type="title" style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{message}</ThemedText>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.button, styles.cancel, { borderColor: theme.border }]}> 
              <ThemedText style={[styles.buttonText, { color: theme.text }]}>{cancelText}</ThemedText>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.button, styles.confirm, { backgroundColor: theme.danger }]}> 
              <ThemedText style={[styles.buttonText, { color: theme.primaryText }]}>{confirmText}</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancel: {
    backgroundColor: 'transparent',
  },
  confirm: {},
  buttonText: {
    fontWeight: '700',
  },
});
