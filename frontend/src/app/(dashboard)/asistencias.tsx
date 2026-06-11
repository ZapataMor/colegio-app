import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import CheckBadgeIcon from 'react-native-heroicons/outline/CheckBadgeIcon';

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
import { getUserSession } from '@/lib/session';

type Attendance = {
  id: number;
  estudiante_id: number;
  curso_id: number;
  asignatura_id: number;
  profesor_id: number;
  fecha: string;
  estado_asistencia: string;
  observacion: string | null;
  curso_nombre?: string;
  asignatura_nombre?: string;
  profesor_nombre?: string;
  estudiante_nombres?: string;
  estudiante_apellidos?: string;
};

type AsistenciaMarca = {
  asistenciaId: number;
  asignaturaId: number;
  profesorId: number;
  profesor: string;
  fecha: string;
  estado: string;
  observacion: string | null;
};

type EstudianteAsistencia = {
  estudianteId: number;
  estudianteNombre: string;
  documento: string;
  asistencias: AsistenciaMarca[];
};

type ResumenAsignatura = {
  presente: number;
  ausente: number;
  excusa: number;
  tardanza: number;
  total: number;
};

type AsignaturaCurso = {
  asignaturaId: number;
  asignaturaNombre: string;
  fechas: string[];
  resumen: ResumenAsignatura;
};

type CursoAsistencia = {
  cursoId: number;
  cursoNombre: string;
  asignaturas: AsignaturaCurso[];
  estudiantes: EstudianteAsistencia[];
};

type Catalog = {
  cursos: { id: number; nombre: string }[];
  estudiantes: { id: number; curso_id: number; nombre: string }[];
  profesores: { id: number; nombre: string }[];
  asignaturas: { id: number; nombre: string }[];
  periodos: { id: number; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string }[];
};

type EditingAttendance = Attendance | null;

const ESTADOS = ['presente', 'ausente', 'excusa', 'tardanza'];
const COL = { estudiante: 190, fecha: 82 };
const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  estudianteId: '',
  cursoId: '',
  asignaturaId: '',
  profesorId: '',
  fecha: today,
  estadoAsistencia: 'presente',
  observacion: '',
};

const emptyCatalog: Catalog = {
  cursos: [],
  estudiantes: [],
  profesores: [],
  asignaturas: [],
  periodos: [],
};

export default function AsistenciasScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const canManage = session?.rol === 'administrador' || session?.rol === 'profesor';

  const [cursos, setCursos] = useState<CursoAsistencia[]>([]);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<EditingAttendance>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filterPeriodo) params.set('periodoId', filterPeriodo);
      if (session?.rol === 'profesor' && session.personaId) {
        params.set('profesorPersonaId', String(session.personaId));
      }
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [cursosRes, catalogRes] = await Promise.all([
        apiFetch<CursoAsistencia[]>(`/api/asistencias/por-curso${qs}`),
        apiFetch<Catalog>('/api/asistencias/catalogo'),
      ]);

      setCursos(cursosRes.data ?? []);
      setCatalog(catalogRes.data ?? emptyCatalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las asistencias.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterPeriodo, session?.personaId, session?.rol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedCurso = useMemo(
    () => cursos.find((curso) => curso.cursoId === selectedCursoId) ?? null,
    [cursos, selectedCursoId]
  );

  const selectedAsignatura = useMemo(
    () => selectedCurso?.asignaturas.find((asignatura) => asignatura.asignaturaId === selectedAsignaturaId) ?? null,
    [selectedAsignaturaId, selectedCurso]
  );

  const courseStudents = useMemo(
    () => catalog.estudiantes.filter((item) => !form.cursoId || String(item.curso_id) === form.cursoId),
    [catalog.estudiantes, form.cursoId]
  );

  const totals = useMemo(() => {
    const initial = { presente: 0, ausente: 0, excusa: 0, tardanza: 0, total: 0 };
    return cursos.reduce((acc, curso) => {
      for (const asignatura of curso.asignaturas) {
        acc.presente += Number(asignatura.resumen.presente ?? 0);
        acc.ausente += Number(asignatura.resumen.ausente ?? 0);
        acc.excusa += Number(asignatura.resumen.excusa ?? 0);
        acc.tardanza += Number(asignatura.resumen.tardanza ?? 0);
        acc.total += Number(asignatura.resumen.total ?? 0);
      }
      return acc;
    }, initial);
  }, [cursos]);

  const openCreate = () => {
    const cursoId = selectedCursoId ?? catalog.cursos[0]?.id ?? '';
    const asignaturaId = selectedAsignaturaId ?? selectedCurso?.asignaturas[0]?.asignaturaId ?? catalog.asignaturas[0]?.id ?? '';

    setEditing(null);
    setForm({
      ...emptyForm,
      cursoId: String(cursoId),
      asignaturaId: String(asignaturaId),
      profesorId: String(catalog.profesores[0]?.id ?? ''),
    });
    setModalVisible(true);
  };

  const openEdit = (item: Attendance) => {
    setEditing(item);
    setForm({
      estudianteId: String(item.estudiante_id),
      cursoId: String(item.curso_id),
      asignaturaId: String(item.asignatura_id),
      profesorId: String(item.profesor_id),
      fecha: item.fecha.slice(0, 10),
      estadoAsistencia: item.estado_asistencia,
      observacion: item.observacion ?? '',
    });
    setModalVisible(true);
  };

  const openEditFromCell = (estudiante: EstudianteAsistencia, marca: AsistenciaMarca) => {
    if (!selectedCurso || !selectedAsignatura) return;

    openEdit({
      id: marca.asistenciaId,
      estudiante_id: estudiante.estudianteId,
      curso_id: selectedCurso.cursoId,
      asignatura_id: selectedAsignatura.asignaturaId,
      profesor_id: marca.profesorId,
      fecha: marca.fecha,
      estado_asistencia: marca.estado,
      observacion: marca.observacion,
      curso_nombre: selectedCurso.cursoNombre,
      asignatura_nombre: selectedAsignatura.asignaturaNombre,
      profesor_nombre: marca.profesor,
    });
  };

  const handleSave = async () => {
    if (!form.estudianteId || !form.cursoId || !form.asignaturaId || !form.profesorId || !form.fecha) {
      Alert.alert('Validacion', 'Completa estudiante, curso, asignatura, docente y fecha.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        estudianteId: Number(form.estudianteId),
        cursoId: Number(form.cursoId),
        asignaturaId: Number(form.asignaturaId),
        profesorId: Number(form.profesorId),
        fecha: form.fecha,
        estadoAsistencia: form.estadoAsistencia,
        observacion: form.observacion.trim() || null,
      };

      if (editing) {
        await apiFetch(`/api/asistencias/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/asistencias', { method: 'POST', body });
      }

      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  const goBackToCursos = () => {
    setSelectedCursoId(null);
    setSelectedAsignaturaId(null);
  };

  const goBackToAsignaturas = () => {
    setSelectedAsignaturaId(null);
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.accent}20` }]}>
          <CheckBadgeIcon width={22} height={22} color={theme.accent} />
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.primary }]}>
            Seguimiento diario
          </ThemedText>
          <ThemedText type="title">Asistencias</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>
            {cursos.length} curso{cursos.length !== 1 ? 's' : ''} - {totals.total} registro{totals.total !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </ThemedView>

      <ModuleHeader title="Registro de asistencia" onAdd={canManage ? openCreate : undefined} addLabel="+ Registrar" />

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadData()} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true); }} />}
          contentContainerStyle={styles.page}>
          {!selectedCurso ? (
            <CursosGrid cursos={cursos} onSelect={(cursoId) => setSelectedCursoId(cursoId)} />
          ) : selectedCurso && !selectedAsignatura ? (
            <AsignaturasGrid
              curso={selectedCurso}
              onBack={goBackToCursos}
              onSelect={(asignaturaId) => setSelectedAsignaturaId(asignaturaId)}
            />
          ) : selectedCurso && selectedAsignatura ? (
            <AsignaturaDetalle
              curso={selectedCurso}
              asignatura={selectedAsignatura}
              periodos={catalog.periodos}
              filterPeriodo={filterPeriodo}
              canManage={canManage}
              onPeriodoChange={setFilterPeriodo}
              onBack={goBackToAsignaturas}
              onEditCell={openEditFromCell}
            />
          ) : null}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              {editing ? 'Editar asistencia' : 'Nueva asistencia'}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <OptionChips
                label="Curso"
                options={catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.cursoId}
                onChange={(cursoId) => setForm((prev) => ({ ...prev, cursoId, estudianteId: '' }))}
              />
              <OptionChips
                label="Estudiante"
                options={courseStudents.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.estudianteId}
                onChange={(estudianteId) => setForm((prev) => ({ ...prev, estudianteId }))}
              />
              <OptionChips
                label="Asignatura"
                options={catalog.asignaturas.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.asignaturaId}
                onChange={(asignaturaId) => setForm((prev) => ({ ...prev, asignaturaId }))}
              />
              <OptionChips
                label="Docente"
                options={catalog.profesores.map((item) => ({ value: String(item.id), label: item.nombre }))}
                value={form.profesorId}
                onChange={(profesorId) => setForm((prev) => ({ ...prev, profesorId }))}
              />
              <FormField label="Fecha" value={form.fecha} onChangeText={(fecha) => setForm((prev) => ({ ...prev, fecha }))} />
              <OptionChips
                label="Estado"
                options={ESTADOS.map((item) => ({ value: item, label: capitalize(item) }))}
                value={form.estadoAsistencia}
                onChange={(estadoAsistencia) => setForm((prev) => ({ ...prev, estadoAsistencia }))}
              />
              <FormField
                label="Observacion"
                value={form.observacion}
                onChangeText={(observacion) => setForm((prev) => ({ ...prev, observacion }))}
                placeholder="Opcional"
                multiline
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
                <ThemedText>Cancelar</ThemedText>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
                {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function CursosGrid({ cursos, onSelect }: { cursos: CursoAsistencia[]; onSelect: (cursoId: number) => void }) {
  const theme = useTheme();

  if (cursos.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>No hay cursos activos registrados.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.cardGrid}>
      {cursos.map((curso) => {
        const total = curso.asignaturas.reduce((sum, item) => sum + Number(item.resumen.total ?? 0), 0);

        return (
          <Pressable
            key={curso.cursoId}
            onPress={() => onSelect(curso.cursoId)}
            style={[styles.courseCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {curso.asignaturas.length} asignatura{curso.asignaturas.length !== 1 ? 's' : ''} - {total} asistencia{total !== 1 ? 's' : ''}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function AsignaturasGrid({
  curso,
  onBack,
  onSelect,
}: {
  curso: CursoAsistencia;
  onBack: () => void;
  onSelect: (asignaturaId: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <BackButton label="Ver cursos" onPress={onBack} />
      <View style={[styles.sectionHeader, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` }]}>
        <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.asignaturas.length} asignatura{curso.asignaturas.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      {curso.asignaturas.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.textSecondary }}>Este curso no tiene asignaturas con actividad academica.</ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.cardGrid}>
          {curso.asignaturas.map((asignatura) => (
            <Pressable
              key={asignatura.asignaturaId}
              onPress={() => onSelect(asignatura.asignaturaId)}
              style={[styles.subjectCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.subjectTitle}>{asignatura.asignaturaNombre}</ThemedText>
              <View style={styles.subjectMeta}>
                <StatusDot label="Presentes" value={asignatura.resumen.presente} color={theme.accent} />
                <StatusDot label="No presentes" value={asignatura.resumen.ausente + asignatura.resumen.excusa + asignatura.resumen.tardanza} color={theme.danger} />
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {asignatura.fechas.length} fecha{asignatura.fechas.length !== 1 ? 's' : ''} registrada{asignatura.fechas.length !== 1 ? 's' : ''}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function AsignaturaDetalle({
  curso,
  asignatura,
  periodos,
  filterPeriodo,
  canManage,
  onPeriodoChange,
  onBack,
  onEditCell,
}: {
  curso: CursoAsistencia;
  asignatura: AsignaturaCurso;
  periodos: Catalog['periodos'];
  filterPeriodo: string;
  canManage: boolean;
  onPeriodoChange: (periodoId: string) => void;
  onBack: () => void;
  onEditCell: (estudiante: EstudianteAsistencia, marca: AsistenciaMarca) => void;
}) {
  const theme = useTheme();
  const tableWidth = COL.estudiante + Math.max(asignatura.fechas.length, 1) * COL.fecha;

  return (
    <View style={styles.section}>
      <BackButton label="Ver asignaturas" onPress={onBack} />
      <View style={[styles.sectionHeader, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` }]}>
        <View>
          <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>{asignatura.asignaturaNombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{curso.cursoNombre}</ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      {periodos.length > 0 ? (
        <OptionChips
          label="Periodo"
          options={[
            { value: '', label: 'Todos' },
            ...periodos.map((periodo) => ({ value: String(periodo.id), label: periodo.nombre })),
          ]}
          value={filterPeriodo}
          onChange={onPeriodoChange}
        />
      ) : null}

      {curso.estudiantes.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.textSecondary }}>Este curso no tiene estudiantes activos.</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: tableWidth }}>
            <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Th text="Estudiante" width={COL.estudiante} />
              {asignatura.fechas.length > 0 ? (
                asignatura.fechas.map((fecha) => (
                  <Th key={fecha} text={formatShortDate(fecha)} width={COL.fecha} align="center" />
                ))
              ) : (
                <Th text="Sin fechas" width={COL.fecha} align="center" />
              )}
            </View>

            {curso.estudiantes.map((estudiante, rowIndex) => (
              <FilaAsistencia
                key={estudiante.estudianteId}
                estudiante={estudiante}
                asignatura={asignatura}
                rowIndex={rowIndex}
                canManage={canManage}
                onEditCell={onEditCell}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function FilaAsistencia({
  estudiante,
  asignatura,
  rowIndex,
  canManage,
  onEditCell,
}: {
  estudiante: EstudianteAsistencia;
  asignatura: AsignaturaCurso;
  rowIndex: number;
  canManage: boolean;
  onEditCell: (estudiante: EstudianteAsistencia, marca: AsistenciaMarca) => void;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;
  const marcasPorFecha = estudiante.asistencias
    .filter((marca) => marca.asignaturaId === asignatura.asignaturaId)
    .reduce<Record<string, AsistenciaMarca>>((acc, marca) => {
      acc[marca.fecha] = marca;
      return acc;
    }, {});

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={COL.estudiante}>
        <ThemedText style={styles.studentName} numberOfLines={2}>{estudiante.estudianteNombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>{estudiante.documento}</ThemedText>
      </Td>
      {asignatura.fechas.length > 0 ? (
        asignatura.fechas.map((fecha) => {
          const marca = marcasPorFecha[fecha];
          const value = getAttendanceMark(marca?.estado);
          const color = value === '✓' ? theme.accent : value === 'X' ? theme.danger : theme.textSecondary;
          const content = (
            <ThemedText style={[styles.markText, { color }]}>
              {value}
            </ThemedText>
          );

          return (
            <Td key={fecha} width={COL.fecha} align="center">
              {marca && canManage ? (
                <Pressable onPress={() => onEditCell(estudiante, marca)} style={styles.cellButton}>
                  {content}
                </Pressable>
              ) : content}
            </Td>
          );
        })
      ) : (
        <Td width={COL.fecha} align="center">
          <ThemedText style={[styles.markText, { color: theme.textSecondary }]}>-</ThemedText>
        </Td>
      )}
    </View>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <ThemedText type="small" style={styles.backButtonText}>{label}</ThemedText>
    </Pressable>
  );
}

function StatusDot({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statusDotRow}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <ThemedText type="small">{value} {label.toLowerCase()}</ThemedText>
    </View>
  );
}

function Th({ text, width, align = 'left' }: { text: string; width: number; align?: 'left' | 'center' }) {
  const theme = useTheme();

  return (
    <View style={[styles.th, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <ThemedText type="small" style={[styles.thText, { color: theme.textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

function Td({ children, width, align = 'left' }: { children: ReactNode; width: number; align?: 'left' | 'center' }) {
  return (
    <View style={[styles.td, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      {children}
    </View>
  );
}

function getAttendanceMark(status?: string) {
  if (!status) return '-';
  return status === 'presente' ? '✓' : 'X';
}

function formatShortDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroIcon: { width: 52, height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  courseCard: { flexGrow: 1, flexBasis: 170, borderRadius: 8, borderWidth: 1, padding: Spacing.three, gap: 6 },
  subjectCard: { flexGrow: 1, flexBasis: 210, borderRadius: 8, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  cardTitle: { fontSize: 22, fontWeight: '800' },
  subjectTitle: { fontSize: 16, fontWeight: '700' },
  subjectMeta: { gap: 4 },
  statusDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 99 },
  section: { gap: Spacing.three },
  sectionHeader: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  backButton: {
    minHeight: 38,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontWeight: '700' },
  tableHead: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingVertical: 7 },
  tableRow: { flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, paddingVertical: 7 },
  th: { paddingHorizontal: 8, justifyContent: 'center' },
  thText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { paddingHorizontal: 8, justifyContent: 'center', minHeight: 44 },
  studentName: { fontWeight: '700', fontSize: 13 },
  markText: { fontSize: 18, fontWeight: '900' },
  cellButton: { minWidth: 36, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 8, borderWidth: 1, padding: Spacing.four, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 20, 29, 0.45)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, padding: Spacing.four },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
