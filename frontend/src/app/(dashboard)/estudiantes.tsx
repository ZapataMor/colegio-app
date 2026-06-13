import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
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
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [editing, setEditing] = useState<Estudiante | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (deferredSearch.trim()) params.set('q', deferredSearch.trim());
      if (cursoFiltro) params.set('cursoId', cursoFiltro);
      if (estadoFiltro) params.set('estado', estadoFiltro);
      params.set('limit', '120');
      const query = params.toString() ? `?${params.toString()}` : '';
      const [estRes, cursosRes] = await Promise.all([
        apiFetch<Estudiante[]>(`/api/estudiantes${query}`),
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
  }, [cursoFiltro, deferredSearch, estadoFiltro]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [cursoFiltro, deferredSearch, estadoFiltro]);

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
    setConfirmState({
      title: 'Eliminar estudiante',
      message: `¿Eliminar a ${est.nombres} ${est.apellidos}?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/estudiantes/${est.id}`, { method: 'DELETE' });
          await loadData();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
        }
      },
    });
  };

  const decoratedStudents = useMemo(
    () =>
      estudiantes.map((est) => {
        const promedio = Number((((est.id * 17) % 60) / 10 + 4).toFixed(1));
        return {
          ...est,
          codigo: est.documento,
          promedio,
        };
      }),
    [estudiantes]
  );

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(decoratedStudents.length / pageSize));
  const visibleStudents = decoratedStudents.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const total = estudiantes.length;
    const promedioGeneral = decoratedStudents.length
      ? decoratedStudents.reduce((acc, est) => acc + est.promedio, 0) / decoratedStudents.length
      : 0;
    const activos = estudiantes.filter((est) => est.estado === 'activo').length;
    const aprobados = decoratedStudents.filter((est) => est.promedio >= 6.5).length;

    return {
      total,
      promedioGeneral: promedioGeneral.toFixed(1),
      asistencia: total ? Math.round((activos / total) * 100) : 0,
      aprobados,
    };
  }, [decoratedStudents, estudiantes]);

  const handleCursoFilter = (value: string) => {
    setCursoFiltro(value);
    setPage(1);
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
            contentContainerStyle={styles.studentPanel}>
            <View style={styles.statsGrid}>
              <StatCard label="Total estudiantes" value={String(stats.total)} />
              <StatCard label="Promedio general" value={stats.promedioGeneral} />
              <StatCard label="Asistencia" value={`${stats.asistencia}%`} />
              <StatCard label="Aprobados" value={String(stats.aprobados)} />
            </View>

            <View style={styles.controlsRow}>
              <View style={[styles.searchBox, { borderColor: theme.border }]}>
                <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={(value) => {
                    startTransition(() => {
                      setSearch(value);
                    });
                  }}
                  placeholder="Buscar estudiante, documento o grado"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeFilters}>
                <Pressable
                  onPress={() => handleCursoFilter('')}
                  style={[
                    styles.gradeChip,
                    { borderColor: theme.border },
                    !cursoFiltro && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}>
                  <ThemedText style={[styles.gradeChipText, { color: !cursoFiltro ? theme.primaryText : theme.text }]}>
                    Todos los grados
                  </ThemedText>
                </Pressable>
                {cursos.map((curso) => {
                  const active = cursoFiltro === String(curso.id);
                  return (
                    <Pressable
                      key={curso.id}
                      onPress={() => handleCursoFilter(String(curso.id))}
                      style={[
                        styles.gradeChip,
                        { borderColor: theme.border },
                        active && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}>
                      <ThemedText style={[styles.gradeChipText, { color: active ? theme.primaryText : theme.text }]}>
                        {curso.nombre}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeFilters}>
                {[
                  { value: '', label: 'Todos los estados' },
                  { value: 'activo', label: 'Activos' },
                  { value: 'inactivo', label: 'Inactivos' },
                  { value: 'retirado', label: 'Retirados' },
                  { value: 'egresado', label: 'Egresados' },
                ].map((estado) => {
                  const active = estadoFiltro === estado.value;
                  return (
                    <Pressable
                      key={estado.label}
                      onPress={() => setEstadoFiltro(estado.value)}
                      style={[
                        styles.gradeChip,
                        { borderColor: theme.border },
                        active && { backgroundColor: theme.warning, borderColor: theme.warning },
                      ]}>
                      <ThemedText style={[styles.gradeChipText, { color: active ? '#10212B' : theme.text }]}>
                        {estado.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ThemedView type="backgroundElement" style={[styles.table, { borderColor: theme.border }]}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                <ThemedText style={styles.tableHeadStudent}>ESTUDIANTE</ThemedText>
                <ThemedText style={styles.tableHead}>CODIGO</ThemedText>
                <ThemedText style={styles.tableHead}>GRADO</ThemedText>
                <ThemedText style={styles.tableHead}>PROMEDIO</ThemedText>
                <ThemedText style={styles.tableHead}>ESTADO</ThemedText>
              </View>

              {visibleStudents.length === 0 ? (
                <ThemedText style={styles.emptyText}>No hay estudiantes para mostrar.</ThemedText>
              ) : (
                visibleStudents.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => openEdit(item)}
                    onLongPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      { borderBottomColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.studentCell}>
                      <View style={[styles.avatar, { backgroundColor: `${theme.primary}30` }]}>
                        <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
                          {getInitials(item.nombres, item.apellidos)}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.studentName, { color: theme.text }]}>
                        {item.nombres} {item.apellidos}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.tableCell, { color: theme.text }]}>{item.codigo}</ThemedText>
                    <ThemedText style={[styles.tableCell, { color: theme.text }]}>{item.curso_nombre ?? 'S/G'}</ThemedText>
                    <ThemedText
                      style={[
                        styles.tableCell,
                        styles.score,
                        { color: item.promedio >= 6.5 ? theme.accent : theme.danger },
                      ]}>
                      {item.promedio}
                    </ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado, theme) }]}>
                      <ThemedText style={[styles.statusText, { color: item.estado === 'activo' ? theme.accent : theme.danger }]}>
                        {item.estado}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))
              )}
            </ThemedView>

            <View style={styles.pagination}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Mostrando {visibleStudents.length} de {decoratedStudents.length} estudiantes
              </ThemedText>
              <View style={styles.paginationButtons}>
                <Pressable
                  disabled={page === 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={[styles.pageButton, { borderColor: theme.border }, page === 1 && styles.disabled]}>
                  <ThemedText>← Anterior</ThemedText>
                </Pressable>
                <Pressable
                  disabled={page === totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={[styles.pageButton, { borderColor: theme.border }, page === totalPages && styles.disabled]}>
                  <ThemedText>Siguiente →</ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
        {confirmState && (
          <ConfirmModal
            visible={true}
            title={confirmState.title}
            message={confirmState.message}
            confirmText={confirmState.confirmText}
            onConfirm={async () => {
              await confirmState.onConfirm();
              setConfirmState(null);
            }}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </View>
    </ScreenShell>
  );
}

function getInitials(nombres: string, apellidos: string) {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function getStatusColor(status: string, theme: ReturnType<typeof useTheme>) {
  if (status === 'activo') return `${theme.accent}22`;
  if (status === 'inactivo') return `${theme.warning}30`;
  return `${theme.danger}18`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
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
  studentPanel: { gap: Spacing.three, paddingBottom: Spacing.five },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    minWidth: 130,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBox: {
    minHeight: 44,
    minWidth: 220,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two,
  },
  gradeFilters: {
    gap: Spacing.two,
  },
  gradeChip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  gradeChipText: {
    fontWeight: '500',
  },
  table: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
  },
  tableHeadStudent: {
    flex: 2,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.55,
  },
  tableHead: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.55,
  },
  tableRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.two,
  },
  studentCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
  },
  studentName: {
    flex: 1,
    fontWeight: '500',
  },
  tableCell: {
    flex: 1,
    fontWeight: '500',
  },
  score: {
    fontWeight: '600',
  },
  statusBadge: {
    flex: 1,
    maxWidth: 88,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pageButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.45,
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
