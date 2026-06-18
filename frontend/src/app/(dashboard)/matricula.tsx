import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
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
import IdentificationIcon from 'react-native-heroicons/outline/IdentificationIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UserGroupIcon from 'react-native-heroicons/outline/UserGroupIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type Curso = {
  id: number;
  nombre: string;
  nivel?: string | null;
  jornada?: string | null;
  grade_id?: number | null;
  grado_nombre?: string | null;
  numeric_level?: number | null;
};

type Estudiante = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  curso_id?: number;
  curso_nombre?: string;
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
const emptyForm = { estudianteId: '', cursoId: '', anio: ANIO_ACTUAL, estado: 'activa' };

export default function MatriculaScreen() {
  const theme = useTheme();
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Matricula | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterCurso, setFilterCurso] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');
      const [matRes, estRes, cursosRes] = await Promise.all([
        apiFetch<Matricula[]>(`/api/matriculas?anio=${ANIO_ACTUAL}`),
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cursosById = useMemo(() => new Map(cursos.map((curso) => [curso.id, curso])), [cursos]);

  const gradeOptions = useMemo(() => {
    const grades = new Map<string, string>();
    for (const curso of cursos) {
      const key = String(curso.grade_id ?? parseCursoName(curso.nombre).grado);
      if (!key || key === 'null') continue;
      const label = curso.grado_nombre || `Grado ${curso.numeric_level ?? parseCursoName(curso.nombre).grado}`;
      grades.set(key, label);
    }
    return Array.from(grades.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => Number(a.value) - Number(b.value));
  }, [cursos]);

  const cursoOptions = useMemo(
    () =>
      cursos
        .filter((curso) => {
          if (!filterGrade) return true;
          const cursoGrade = String(curso.grade_id ?? parseCursoName(curso.nombre).grado);
          return cursoGrade === filterGrade;
        })
        .map((curso) => ({ value: String(curso.id), label: curso.nombre })),
    [cursos, filterGrade]
  );

  const filteredMatriculas = useMemo(() => {
    const term = normalize(filterStudent);
    return matriculas.filter((matricula) => {
      const curso = cursosById.get(matricula.curso_id);
      const cursoGrade = String(curso?.grade_id ?? parseCursoName(matricula.curso_nombre).grado);
      const fullName = `${matricula.estudiante_nombres} ${matricula.estudiante_apellidos}`;
      const matchGrade = !filterGrade || cursoGrade === filterGrade;
      const matchCurso = !filterCurso || String(matricula.curso_id) === filterCurso;
      const matchStudent =
        !term ||
        normalize(fullName).includes(term) ||
        normalize(matricula.estudiante_documento).includes(term);

      return matchGrade && matchCurso && matchStudent;
    });
  }, [cursosById, filterCurso, filterGrade, filterStudent, matriculas]);

  const metrics = useMemo(() => {
    const activas = filteredMatriculas.filter((m) => m.estado === 'activa').length;
    const canceladas = filteredMatriculas.filter((m) => m.estado === 'cancelada').length;
    const finalizadas = filteredMatriculas.filter((m) => m.estado === 'finalizada').length;
    return { total: filteredMatriculas.length, activas, canceladas, finalizadas };
  }, [filteredMatriculas]);

  const openCreate = () => {
    const firstCurso = cursoOptions[0]?.value ?? String(cursos[0]?.id ?? '');
    const firstStudent = estudiantes[0] ? String(estudiantes[0].id) : '';
    setEditing(null);
    setForm({ ...emptyForm, estudianteId: firstStudent, cursoId: firstCurso });
    setModalVisible(true);
  };

  const openEdit = (matricula: Matricula) => {
    setEditing(matricula);
    setForm({
      estudianteId: String(matricula.estudiante_id),
      cursoId: String(matricula.curso_id),
      anio: String(matricula.anio),
      estado: matricula.estado,
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
        estado: form.estado,
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

  const handleDelete = (matricula: Matricula) => {
    setConfirmState({
      title: 'Retirar matrícula',
      message: `Retirar a ${matricula.estudiante_nombres} ${matricula.estudiante_apellidos}?`,
      confirmText: 'Retirar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/matriculas/${matricula.id}`, { method: 'DELETE' });
          await loadData();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo retirar la matrícula.');
        }
      },
    });
  };

  const clearFilters = () => {
    setFilterGrade('');
    setFilterCurso('');
    setFilterStudent('');
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <AcademicCapIcon width={20} height={20} color={theme.primary} />
        </View>
        <View style={styles.heroText}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Gestión académica
          </ThemedText>
          <ThemedText style={styles.title}>Matrículas {ANIO_ACTUAL}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Consulta estudiantes matriculados por grado, curso y estudiante.
          </ThemedText>
        </View>
        <Pressable onPress={openCreate} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Matricular estudiante</ThemedText>
        </Pressable>
      </ThemedView>

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
                loadData(true);
              }}
            />
          }
          contentContainerStyle={styles.listScreen}>
          <ThemedView type="backgroundElement" style={[styles.filters, { borderColor: theme.border }]}>
            <SelectField
              label="Grado"
              value={filterGrade}
              options={[{ value: '', label: 'Todos los grados' }, ...gradeOptions]}
              onSelect={(value) => {
                setFilterGrade(value);
                setFilterCurso('');
              }}
            />
            <SelectField
              label="Curso"
              value={filterCurso}
              options={[{ value: '', label: 'Todos los cursos' }, ...cursoOptions]}
              onSelect={setFilterCurso}
            />
            <SearchField value={filterStudent} onChangeText={setFilterStudent} />
            <Pressable onPress={clearFilters} style={[styles.clearButton, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.clearText}>Limpiar filtros</ThemedText>
            </Pressable>
          </ThemedView>

          <View style={styles.metricsGrid}>
            <Metric label="Filtradas" value={metrics.total} />
            <Metric label="Activas" value={metrics.activas} tone="ok" />
            <Metric label="Canceladas" value={metrics.canceladas} tone="danger" />
            <Metric label="Finalizadas" value={metrics.finalizadas} tone="info" />
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText type="small" style={styles.sectionLabel}>ESTUDIANTES MATRICULADOS</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {filteredMatriculas.length} resultado{filteredMatriculas.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {filteredMatriculas.length === 0 ? (
            <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
              <UserGroupIcon width={28} height={28} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                No hay estudiantes matriculados con los filtros actuales.
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={styles.matriculaList}>
              {filteredMatriculas.map((matricula) => (
                <MatriculaItem
                  key={matricula.id}
                  matricula={matricula}
                  onEdit={() => openEdit(matricula)}
                  onDelete={() => handleDelete(matricula)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <MatriculaModal
        visible={modalVisible}
        editing={Boolean(editing)}
        cursos={cursos}
        estudiantes={estudiantes}
        form={form}
        saving={saving}
        setForm={setForm}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

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
    </ScreenShell>
  );
}

function MatriculaItem({
  matricula,
  onEdit,
  onDelete,
}: {
  matricula: Matricula;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const initials = `${matricula.estudiante_nombres[0] ?? ''}${matricula.estudiante_apellidos[0] ?? ''}`.toUpperCase();

  return (
    <ThemedView type="backgroundElement" style={[styles.itemCard, { borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: `${theme.primary}30` }]}>
        <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>{initials}</ThemedText>
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <ThemedText style={styles.itemName}>
            {matricula.estudiante_nombres} {matricula.estudiante_apellidos}
          </ThemedText>
          <Status estado={matricula.estado} />
        </View>
        <View style={styles.itemMeta}>
          <IdentificationIcon width={13} height={13} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {matricula.estudiante_documento}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {matricula.curso_nombre} - {matricula.curso_nivel || 'Sin nivel'} - {matricula.anio}
        </ThemedText>
      </View>
      <View style={styles.itemActions}>
        <Pressable onPress={onEdit} style={[styles.iconBtn, { borderColor: theme.border }]}>
          <PencilSquareIcon width={16} height={16} color={theme.text} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconBtn, { borderColor: `${theme.danger}55` }]}>
          <TrashIcon width={16} height={16} color={theme.danger} />
        </Pressable>
      </View>
    </ThemedView>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'danger' | 'info' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'danger' ? theme.danger : tone === 'info' ? theme.primary : theme.text;
  return (
    <ThemedView type="backgroundElement" style={[styles.metricCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function SearchField({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>Estudiante</ThemedText>
      <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Nombre o documento"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>
    </View>
  );
}

function MatriculaModal({
  visible,
  editing,
  cursos,
  estudiantes,
  form,
  saving,
  setForm,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: boolean;
  cursos: Curso[];
  estudiantes: Estudiante[];
  form: typeof emptyForm;
  saving: boolean;
  setForm: Dispatch<SetStateAction<typeof emptyForm>>;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>{editing ? 'Editar matrícula' : 'Matricular estudiante'}</ThemedText>
          <SelectField
            label="Estudiante"
            value={form.estudianteId}
            options={estudiantes.map((estudiante) => ({
              value: String(estudiante.id),
              label: `${estudiante.nombres} ${estudiante.apellidos} - ${estudiante.documento}`,
            }))}
            onSelect={(estudianteId) => setForm((current) => ({ ...current, estudianteId }))}
          />
          <SelectField
            label="Curso"
            value={form.cursoId}
            options={cursos.map((curso) => ({ value: String(curso.id), label: curso.nombre }))}
            onSelect={(cursoId) => setForm((current) => ({ ...current, cursoId }))}
          />
          <Field
            label="Año"
            value={form.anio}
            onChangeText={(anio) => setForm((current) => ({ ...current, anio }))}
            placeholder="2026"
          />
          {editing ? (
            <Segmented
              label="Estado"
              value={form.estado}
              options={[
                { value: 'activa', label: 'Activa' },
                { value: 'cancelada', label: 'Cancelada' },
                { value: 'finalizada', label: 'Finalizada' },
              ]}
              onChange={(estado) => setForm((current) => ({ ...current, estado }))}
            />
          ) : null}
          <View style={styles.modalActions}>
            <Pressable disabled={saving} onPress={onClose} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText>Cancelar</ThemedText>
            </Pressable>
            <Pressable disabled={saving} onPress={onSave} style={[styles.outlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted }]}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.input, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? 'Seleccionar...'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>v</ThemedText>
      </Pressable>
      {open ? (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {options.length === 0 ? (
              <View style={styles.dropdownItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Sin opciones</ThemedText>
              </View>
            ) : options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                style={[styles.dropdownItem, option.value === value && { backgroundColor: `${theme.primary}22` }]}>
                <ThemedText type="small" style={{ color: theme.text }}>{option.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      ) : null}
    </View>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.segment,
                { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.surfaceMuted },
              ]}>
              <ThemedText type="small" style={[styles.segmentText, { color: active ? theme.primaryText : theme.text }]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Status({ estado }: { estado: string }) {
  const theme = useTheme();
  const active = estado === 'activa';
  const color = active ? theme.accent : estado === 'cancelada' ? theme.danger : theme.primary;
  return (
    <View style={[styles.status, { backgroundColor: `${color}22` }]}>
      <ThemedText style={[styles.statusTextSmall, { color }]}>
        {active ? 'Activa' : estado}
      </ThemedText>
    </View>
  );
}

function parseCursoName(nombre: string) {
  const match = /^(\d+)\s*([A-Za-z]*)/.exec(nombre.trim());
  return {
    grado: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    seccion: match ? match[2].toUpperCase() : nombre.toUpperCase(),
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.two },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, minWidth: 180 },
  kicker: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0 },
  title: { fontSize: 20, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.two, paddingVertical: 9, borderRadius: 6 },
  addBtnText: { fontWeight: '700', fontSize: 13 },
  listScreen: { gap: Spacing.two, paddingBottom: Spacing.five },
  filters: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.two },
  field: { gap: 5 },
  fieldLabel: { fontWeight: '700', opacity: 0.7 },
  input: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 6, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  searchBox: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minHeight: 40 },
  clearButton: { minHeight: 38, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  clearText: { fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricCard: { flex: 1, minWidth: 128, borderWidth: 1, borderRadius: 8, padding: Spacing.two, gap: 4 },
  metricValue: { fontSize: 24, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, alignItems: 'center' },
  sectionLabel: { fontWeight: '700', opacity: 0.65, letterSpacing: 0 },
  matriculaList: { gap: Spacing.two },
  itemCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 12 },
  itemBody: { flex: 1, minWidth: 0, gap: 4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  itemName: { fontWeight: '800', fontSize: 14 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  status: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  statusTextSmall: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  emptyCard: { borderWidth: 1, borderRadius: 8, minHeight: 150, padding: Spacing.three, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modal: { width: '100%', maxWidth: 540, borderWidth: 1, borderRadius: 10, padding: Spacing.four, gap: Spacing.two },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  outlineBtn: { minHeight: 40, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  segment: { minHeight: 34, borderRadius: 999, borderWidth: 1, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontWeight: '700' },
});
