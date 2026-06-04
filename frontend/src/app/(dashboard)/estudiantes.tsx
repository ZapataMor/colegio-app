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

type Curso = { id: number; nombre: string; nivel: string; jornada: string };
type Estudiante = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  curso_id: number;
  curso_nombre: string;
  estado: string;
  genero: string | null;
  telefono_acudiente: string | null;
  nombre_acudiente: string | null;
};

const emptyForm = {
  cursoId: '',
  nombres: '',
  apellidos: '',
  documento: '',
  genero: 'no_especifica',
  telefonoAcudiente: '',
  nombreAcudiente: '',
  estado: 'activo',
};

export default function EstudiantesScreen() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Estudiante | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [estRes, cursosRes] = await Promise.all([
        apiFetch<Estudiante[]>('/api/estudiantes'),
        apiFetch<Curso[]>('/api/cursos'),
      ]);
      setEstudiantes(estRes.data ?? []);
      setCursos(cursosRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estudiantes.');
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
    setForm({
      ...emptyForm,
      cursoId: cursos[0] ? String(cursos[0].id) : '',
    });
    setModalVisible(true);
  };

  const openEdit = (est: Estudiante) => {
    setEditing(est);
    setForm({
      cursoId: String(est.curso_id),
      nombres: est.nombres,
      apellidos: est.apellidos,
      documento: est.documento,
      genero: est.genero ?? 'no_especifica',
      telefonoAcudiente: est.telefono_acudiente ?? '',
      nombreAcudiente: est.nombre_acudiente ?? '',
      estado: est.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.documento.trim() || !form.cursoId) {
      Alert.alert('Validación', 'Curso, nombres, apellidos y documento son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        cursoId: Number(form.cursoId),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        documento: form.documento.trim(),
        genero: form.genero,
        telefonoAcudiente: form.telefonoAcudiente.trim() || null,
        nombreAcudiente: form.nombreAcudiente.trim() || null,
        ...(editing ? { estado: form.estado } : {}),
      };

      if (editing) {
        await apiFetch(`/api/estudiantes/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/estudiantes', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (est: Estudiante) => {
    Alert.alert(
      'Eliminar estudiante',
      `¿Eliminar a ${est.nombres} ${est.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/estudiantes/${est.id}`, { method: 'DELETE' });
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
        <ModuleHeader title="Estudiantes" onAdd={openCreate} />

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : (
          <FlatList
            data={estudiantes}
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
              <ThemedText style={styles.emptyText}>No hay estudiantes registrados.</ThemedText>
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
                <ThemedText type="small" style={styles.muted}>
                  Curso: {item.curso_nombre ?? 'Sin curso'}
                </ThemedText>
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
                {editing ? 'Editar estudiante' : 'Nuevo estudiante'}
              </ThemedText>
              <ScrollView contentContainerStyle={styles.form}>
                <OptionChips
                  label="Curso"
                  options={cursos.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  value={form.cursoId}
                  onChange={(cursoId) => setForm((f) => ({ ...f, cursoId }))}
                />
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
                <OptionChips
                  label="Género"
                  options={[
                    { value: 'masculino', label: 'Masculino' },
                    { value: 'femenino', label: 'Femenino' },
                    { value: 'otro', label: 'Otro' },
                    { value: 'no_especifica', label: 'N/E' },
                  ]}
                  value={form.genero}
                  onChange={(genero) => setForm((f) => ({ ...f, genero }))}
                />
                <FormField
                  label="Acudiente"
                  value={form.nombreAcudiente}
                  onChangeText={(nombreAcudiente) => setForm((f) => ({ ...f, nombreAcudiente }))}
                />
                <FormField
                  label="Tel. acudiente"
                  value={form.telefonoAcudiente}
                  onChangeText={(telefonoAcudiente) => setForm((f) => ({ ...f, telefonoAcudiente }))}
                  keyboardType="phone-pad"
                />
                {editing && (
                  <OptionChips
                    label="Estado"
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                      { value: 'retirado', label: 'Retirado' },
                      { value: 'egresado', label: 'Egresado' },
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
