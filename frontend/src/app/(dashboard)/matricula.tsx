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

type Curso = { id: number; nombre: string };
type Estudiante = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
};
type Matricula = {
  id: number;
  estudiante_id: number;
  curso_id: number;
  anio: number;
  estado: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_documento: string;
  curso_nombre: string;
  curso_nivel: string;
  curso_jornada: string;
};

const ANIO_ACTUAL = String(new Date().getFullYear());

const emptyForm = {
  estudianteId: '',
  cursoId: '',
  anio: ANIO_ACTUAL,
  estado: 'activa',
};

export default function MatriculaScreen() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Matricula | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filtroAnio, setFiltroAnio] = useState(ANIO_ACTUAL);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const query = filtroAnio ? `?anio=${filtroAnio}` : '';
      const [matRes, estRes, cursosRes] = await Promise.all([
        apiFetch<Matricula[]>(`/api/matriculas${query}`),
        apiFetch<Estudiante[]>('/api/estudiantes'),
        apiFetch<Curso[]>('/api/cursos'),
      ]);
      setMatriculas(matRes.data ?? []);
      setEstudiantes(estRes.data ?? []);
      setCursos(cursosRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar matrículas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroAnio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    if (estudiantes.length === 0) {
      Alert.alert('Sin estudiantes', 'Primero registra estudiantes en el módulo correspondiente.');
      return;
    }
    setEditing(null);
    setForm({
      ...emptyForm,
      estudianteId: String(estudiantes[0].id),
      cursoId: cursos[0] ? String(cursos[0].id) : '',
      anio: filtroAnio || ANIO_ACTUAL,
    });
    setModalVisible(true);
  };

  const openEdit = (mat: Matricula) => {
    setEditing(mat);
    setForm({
      estudianteId: String(mat.estudiante_id),
      cursoId: String(mat.curso_id),
      anio: String(mat.anio),
      estado: mat.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.estudianteId || !form.cursoId || !form.anio.trim()) {
      Alert.alert('Validación', 'Estudiante, curso y año son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        estudianteId: Number(form.estudianteId),
        cursoId: Number(form.cursoId),
        anio: Number(form.anio),
        ...(editing ? { estado: form.estado } : {}),
      };

      if (editing) {
        await apiFetch(`/api/matriculas/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/matriculas', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (mat: Matricula) => {
    Alert.alert(
      'Eliminar matrícula',
      `¿Eliminar matrícula de ${mat.estudiante_nombres} ${mat.estudiante_apellidos} (${mat.anio})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/matriculas/${mat.id}`, { method: 'DELETE' });
              await loadData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  const aniosFiltro = [
    { value: ANIO_ACTUAL, label: ANIO_ACTUAL },
    { value: String(Number(ANIO_ACTUAL) - 1), label: String(Number(ANIO_ACTUAL) - 1) },
    { value: '', label: 'Todos' },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ModuleHeader title="Matrícula" onAdd={openCreate} />

        <OptionChips
          label="Filtrar por año"
          options={aniosFiltro}
          value={filtroAnio}
          onChange={(anio) => {
            setLoading(true);
            setFiltroAnio(anio);
          }}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : (
          <FlatList
            data={matriculas}
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
              <ThemedText style={styles.emptyText}>
                No hay matrículas{filtroAnio ? ` para ${filtroAnio}` : ''}.
              </ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle">
                    {item.estudiante_nombres} {item.estudiante_apellidos}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={item.estado === 'activa' ? styles.badgeActive : styles.badgeOther}>
                    {item.estado}
                  </ThemedText>
                </View>
                <ThemedText type="small">Año: {item.anio}</ThemedText>
                <ThemedText type="small" style={styles.muted}>
                  Curso: {item.curso_nombre} · {item.curso_jornada}
                </ThemedText>
                <ThemedText type="small" style={styles.muted}>
                  Doc: {item.estudiante_documento}
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
                {editing ? 'Editar matrícula' : 'Nueva matrícula'}
              </ThemedText>
              <ScrollView contentContainerStyle={styles.form}>
                <OptionChips
                  label="Estudiante"
                  options={estudiantes.map((e) => ({
                    value: String(e.id),
                    label: `${e.apellidos} ${e.nombres}`,
                  }))}
                  value={form.estudianteId}
                  onChange={(estudianteId) => setForm((f) => ({ ...f, estudianteId }))}
                />
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
                  label="Año"
                  value={form.anio}
                  onChangeText={(anio) => setForm((f) => ({ ...f, anio }))}
                  keyboardType="numeric"
                  placeholder="2026"
                />
                {editing && (
                  <OptionChips
                    label="Estado"
                    options={[
                      { value: 'activa', label: 'Activa' },
                      { value: 'cancelada', label: 'Cancelada' },
                      { value: 'finalizada', label: 'Finalizada' },
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
  list: { gap: Spacing.three, paddingBottom: Spacing.five, paddingTop: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { opacity: 0.65 },
  badgeActive: { color: '#16A34A', fontWeight: '700' },
  badgeOther: { color: '#D97706', fontWeight: '700' },
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
