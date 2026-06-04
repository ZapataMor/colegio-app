import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';

type Profesor = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string | null;
  telefono: string | null;
  especialidad: string | null;
  estado: string;
};

const emptyForm = {
  nombres: '',
  apellidos: '',
  documento: '',
  correo: '',
  telefono: '',
  especialidad: '',
  estado: 'activo',
};

export default function ProfesoresScreen() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Profesor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const res = await apiFetch<Profesor[]>('/api/profesores');
      setProfesores(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar profesores.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (prof: Profesor) => {
    setEditing(prof);
    setForm({
      nombres: prof.nombres,
      apellidos: prof.apellidos,
      documento: prof.documento,
      correo: prof.correo ?? '',
      telefono: prof.telefono ?? '',
      especialidad: prof.especialidad ?? '',
      estado: prof.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.documento.trim()) {
      Alert.alert('Validación', 'Nombres, apellidos y documento son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        documento: form.documento.trim(),
        correo: form.correo.trim() || null,
        telefono: form.telefono.trim() || null,
        especialidad: form.especialidad.trim() || null,
        ...(editing ? { estado: form.estado } : {}),
      };

      if (editing) {
        await apiFetch(`/api/profesores/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/profesores', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (prof: Profesor) => {
    Alert.alert(
      'Eliminar profesor',
      `¿Eliminar a ${prof.nombres} ${prof.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/profesores/${prof.id}`, { method: 'DELETE' });
              await loadData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ModuleHeader title="Profesores" onAdd={openCreate} />

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : (
          <FlatList
            data={profesores}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }}
              />
            }
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>No hay profesores registrados.</ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle">
                    {item.nombres} {item.apellidos}
                  </ThemedText>
                  <ThemedText type="small" style={styles.muted}>
                    {item.estado}
                  </ThemedText>
                </View>
                <ThemedText type="small">Doc: {item.documento}</ThemedText>
                {item.especialidad ? (
                  <ThemedText type="small" style={styles.muted}>
                    {item.especialidad}
                  </ThemedText>
                ) : null}
                {item.correo ? (
                  <ThemedText type="small" style={styles.muted}>
                    {item.correo}
                  </ThemedText>
                ) : null}
                <View style={styles.actions}>
                  <Pressable onPress={() => openEdit(item)} style={styles.editBtn}>
                    <ThemedText style={styles.editBtnText}>Editar</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <ThemedText style={styles.deleteBtnText}>Eliminar</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="title" style={styles.modalTitle}>
                {editing ? 'Editar profesor' : 'Nuevo profesor'}
              </ThemedText>
              <ScrollView contentContainerStyle={styles.form}>
                <FormField
                  label="Nombres"
                  value={form.nombres}
                  onChangeText={(nombres) => setForm((f) => ({ ...f, nombres }))}
                />
                <FormField
                  label="Apellidos"
                  value={form.apellidos}
                  onChangeText={(apellidos) => setForm((f) => ({ ...f, apellidos }))}
                />
                <FormField
                  label="Documento"
                  value={form.documento}
                  onChangeText={(documento) => setForm((f) => ({ ...f, documento }))}
                />
                <FormField
                  label="Correo"
                  value={form.correo}
                  onChangeText={(correo) => setForm((f) => ({ ...f, correo }))}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <FormField
                  label="Teléfono"
                  value={form.telefono}
                  onChangeText={(telefono) => setForm((f) => ({ ...f, telefono }))}
                  keyboardType="phone-pad"
                />
                <FormField
                  label="Especialidad"
                  value={form.especialidad}
                  onChangeText={(especialidad) => setForm((f) => ({ ...f, especialidad }))}
                />
                {editing && (
                  <OptionChips
                    label="Estado"
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                    ]}
                    value={form.estado}
                    onChange={(estado) => setForm((f) => ({ ...f, estado }))}
                  />
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.cancelBtn}
                  disabled={saving}>
                  <ThemedText>Cancelar</ThemedText>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.saveBtnText}>Guardar</ThemedText>
                  )}
                </Pressable>
              </View>
            </ThemedView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  loader: { marginTop: Spacing.five },
  list: { gap: Spacing.three, paddingBottom: Spacing.five },
  card: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { opacity: 0.65 },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  editBtn: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
  },
  editBtnText: { color: '#2563EB', fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#DC2626', fontWeight: '700' },
  emptyText: { textAlign: 'center', opacity: 0.6, marginTop: Spacing.five },
  errorText: { color: '#DC2626', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    padding: Spacing.four,
  },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#2563EB',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
