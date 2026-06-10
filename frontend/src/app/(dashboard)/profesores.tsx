import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import SparklesIcon from 'react-native-heroicons/outline/SparklesIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';

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
  const theme = useTheme();
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Profesor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

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

  const filteredProfesores = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profesores;
    return profesores.filter((prof) =>
      `${prof.nombres} ${prof.apellidos} ${prof.documento} ${prof.especialidad ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [profesores, search]);

  const stats = useMemo(() => {
    const activos = profesores.filter((prof) => prof.estado === 'activo').length;
    const conCorreo = profesores.filter((prof) => Boolean(prof.correo)).length;
    return {
      total: profesores.length,
      activos,
      inactivos: profesores.length - activos,
      conCorreo,
    };
  }, [profesores]);

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
              Equipo docente
            </ThemedText>
            <ThemedText type="title" style={[styles.heroTitle, { color: theme.text }]}>
              Profesores
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Gestión moderna de docentes con tarjetas limpias y acciones rápidas.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.page}>
        <ModuleHeader title="Profesores" onAdd={openCreate} addLabel="+ Nuevo" />

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
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }}
              />
            }
            contentContainerStyle={styles.panel}>
            <View style={styles.statsGrid}>
              <StatCard label="Total docentes" value={stats.total} />
              <StatCard label="Activos" value={stats.activos} tone="ok" />
              <StatCard label="Inactivos" value={stats.inactivos} tone="danger" />
              <StatCard label="Con correo" value={stats.conCorreo} />
            </View>

            <View style={[styles.searchBox, { borderColor: theme.border }]}>
              <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar docente, documento o especialidad"
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>

            <ThemedView type="backgroundElement" style={[styles.table, { borderColor: theme.border }]}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                <ThemedText style={styles.headName}>DOCENTE</ThemedText>
                <ThemedText style={styles.headCell}>DOCUMENTO</ThemedText>
                <ThemedText style={styles.headCell}>ESPECIALIDAD</ThemedText>
                <ThemedText style={styles.headCell}>ESTADO</ThemedText>
              </View>
              {filteredProfesores.length === 0 ? (
                <ThemedText style={styles.emptyText}>No hay profesores para mostrar.</ThemedText>
              ) : (
                filteredProfesores.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => openEdit(item)}
                    onLongPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      { borderBottomColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.teacherCell}>
                      <View style={[styles.avatar, { backgroundColor: `${theme.primary}30` }]}>
                        <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
                          {getInitials(item.nombres, item.apellidos)}
                        </ThemedText>
                      </View>
                      <View style={styles.teacherInfo}>
                        <ThemedText style={[styles.teacherName, { color: theme.text }]}>
                          {item.nombres} {item.apellidos}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {item.correo ?? 'Sin correo'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.tableCell, { color: theme.text }]}>{item.documento}</ThemedText>
                    <ThemedText style={[styles.tableCell, { color: theme.text }]}>{item.especialidad ?? 'General'}</ThemedText>
                    <ThemedText
                      style={[
                        styles.badge,
                        {
                          backgroundColor: item.estado === 'activo' ? `${theme.accent}22` : `${theme.danger}16`,
                          color: item.estado === 'activo' ? theme.accent : theme.danger,
                        },
                      ]}>
                      {item.estado}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ThemedView>
          </ScrollView>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
              <ThemedText type="title" style={[styles.modalTitle, { color: theme.text }]}>
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

function Detail({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.detailChip, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <View style={styles.detailText}>
        <ThemedText type="small" style={[styles.detailLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.detailValue, { color: theme.text }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

function getInitials(nombres: string, apellidos: string) {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'danger' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'danger' ? theme.danger : theme.text;

  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
    </ThemedView>
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
  panel: { gap: Spacing.three, paddingBottom: Spacing.five },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: {
    flex: 1,
    minWidth: 130,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  statLabel: { fontSize: 12, fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '600', marginTop: 4 },
  searchBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.two },
  table: { borderWidth: 1, borderRadius: Spacing.two, overflow: 'hidden' },
  tableHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
  },
  headName: { flex: 2, fontSize: 11, fontWeight: '600', opacity: 0.55 },
  headCell: { flex: 1, fontSize: 11, fontWeight: '600', opacity: 0.55 },
  tableRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  teacherCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minWidth: 0 },
  avatar: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '600' },
  teacherInfo: { flex: 1, minWidth: 0 },
  teacherName: { fontWeight: '500' },
  tableCell: { flex: 1, fontWeight: '500' },
  badge: {
    flex: 1,
    maxWidth: 86,
    textAlign: 'center',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
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
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  detailText: { gap: 2 },
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
  emptyText: { textAlign: 'center', opacity: 0.6, marginTop: Spacing.five },
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
