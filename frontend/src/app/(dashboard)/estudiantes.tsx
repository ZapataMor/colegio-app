import { useCallback, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type IconType = ComponentType<{ width?: number; height?: number; color?: string }>;

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
  const theme = useTheme();
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
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
            <AcademicCapIcon width={22} height={22} color={theme.primary} />
          </View>
          <View style={styles.heroText}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
              Gestion academica
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Estudiantes
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Lista, estado y acceso rapido para mantener el padrón limpio y claro.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.page}>
        <ModuleHeader title="Estudiantes" onAdd={openCreate} addLabel="+ Nuevo" />

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              loadData();
            }}
          />
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
              <ThemedView type="backgroundElement" style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>No hay estudiantes registrados.</ThemedText>
              </ThemedView>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeading}>
                    <ThemedText type="subtitle" style={[styles.cardName, { color: theme.text }]}>
                      {item.nombres} {item.apellidos}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.muted, { color: theme.textSecondary }]}>
                      Curso: {item.curso_nombre ?? 'Sin curso'}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="small"
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${theme.accent}22`, color: theme.accent },
                    ]}>
                    {item.estado}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Detail icon={CalendarDaysIcon} label="Documento" value={item.documento} />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <PencilSquareIcon width={18} height={18} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <TrashIcon width={18} height={18} color={theme.danger} />
                  </Pressable>
                </View>
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
              <ThemedText type="title" style={[styles.modalTitle, { color: theme.text }]}>
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
                  style={[styles.cancelBtn, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                  disabled={saving}>
                  <ThemedText style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color={theme.primaryText} />
                  ) : (
                    <ThemedText style={[styles.saveBtnText, { color: theme.primaryText }]}>Guardar</ThemedText>
                  )}
                </Pressable>
              </View>
            </ThemedView>
          </View>
        </Modal>
      </View>
    </ScreenShell>
  );
}

function Detail({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.detailChip, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: `${theme.primary}1F` }]}>
        <Icon width={14} height={14} color={theme.textSecondary} />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.detailValue, { color: theme.text }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  heroGlowA: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.12,
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#79D0F2',
    opacity: 0.08,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 1,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  kicker: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {},
  heroSubtitle: { lineHeight: 20 },
  page: { gap: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.five },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeading: { flex: 1, gap: 4 },
  cardName: {},
  muted: { opacity: 0.75 },
  statusPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  detailRow: { gap: Spacing.two },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 176, 192, 0.08)',
  },
  detailText: { flex: 1, gap: 2 },
  detailLabel: { fontWeight: '700' },
  detailValue: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
  emptyState: {
    padding: Spacing.five,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
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
  },
  cancelBtnText: { fontWeight: '700' },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveBtnText: { fontWeight: '800' },
});
