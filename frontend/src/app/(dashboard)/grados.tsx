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
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import EyeIcon from 'react-native-heroicons/outline/EyeIcon';
import MagnifyingGlassIcon from 'react-native-heroicons/outline/MagnifyingGlassIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UsersIcon from 'react-native-heroicons/outline/UsersIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type Estado = 'activo' | 'inactivo';

type Grado = {
  id: number;
  nombre: string;
  numeric_level: number | null;
  education_level: string | null;
  status: Estado;
  cursos_count: number;
  total_estudiantes: number;
};

type Curso = {
  id: number;
  grade_id: number;
  nomenclature: string;
  full_name: string;
  nombre: string;
  nivel: string;
  max_students: number;
  estado: Estado;
  grado_nombre: string;
  numeric_level: number | null;
  education_level: string | null;
  estudiantes_actuales: number;
  cupos_disponibles: number;
};

type EstudianteCurso = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string | null;
  estado: string;
  fecha_asignacion: string;
};

type CursoDetalle = Curso & {
  estudiantes: EstudianteCurso[];
};

const emptyGradeForm = {
  nombre: '',
  numericLevel: '',
  educationLevel: '',
  status: 'activo' as Estado,
};

const emptyCourseForm = {
  nomenclature: '',
  maxStudents: '35',
  estado: 'activo' as Estado,
};

export default function GradosScreen() {
  const theme = useTheme();
  const [grados, setGrados] = useState<Grado[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grado | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CursoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [gradeModal, setGradeModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grado | null>(null);
  const [editingCourse, setEditingCourse] = useState<Curso | null>(null);
  const [gradeForm, setGradeForm] = useState(emptyGradeForm);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const loadGrades = useCallback(async () => {
    try {
      setError('');
      const res = await apiFetch<Grado[]>('/api/grados');
      setGrados(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar grados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const filteredGrades = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grados;
    return grados.filter((grado) =>
      `${grado.nombre} ${grado.numeric_level ?? ''} ${grado.education_level ?? ''}`.toLowerCase().includes(q)
    );
  }, [grados, search]);

  const stats = useMemo(() => {
    const courses = grados.reduce((acc, grado) => acc + Number(grado.cursos_count || 0), 0);
    const students = grados.reduce((acc, grado) => acc + Number(grado.total_estudiantes || 0), 0);
    const activeGrades = grados.filter((grado) => grado.status === 'activo').length;
    return { grades: grados.length, activeGrades, courses, students };
  }, [grados]);

  const loadCoursesForGrade = async (grado: Grado) => {
    try {
      setSelectedCourse(null);
      setSelectedGrade(grado);
      setError('');
      const res = await apiFetch<Curso[]>(`/api/grados/${grado.id}/cursos`);
      setCursos(res.data ?? []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudieron cargar los cursos.');
    }
  };

  const loadCourseDetail = async (curso: Curso) => {
    try {
      const res = await apiFetch<CursoDetalle>(`/api/cursos/${curso.id}`);
      if (res.data) setSelectedCourse(res.data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo cargar el curso.');
    }
  };

  const openCreateGrade = () => {
    setEditingGrade(null);
    setGradeForm(emptyGradeForm);
    setGradeModal(true);
  };

  const openEditGrade = (grado: Grado) => {
    setEditingGrade(grado);
    setGradeForm({
      nombre: grado.nombre,
      numericLevel: grado.numeric_level ? String(grado.numeric_level) : '',
      educationLevel: grado.education_level ?? '',
      status: grado.status,
    });
    setGradeModal(true);
  };

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm(emptyCourseForm);
    setCourseModal(true);
  };

  const openEditCourse = (curso: Curso) => {
    setEditingCourse(curso);
    setCourseForm({
      nomenclature: curso.nomenclature,
      maxStudents: String(curso.max_students),
      estado: curso.estado,
    });
    setCourseModal(true);
  };

  const saveGrade = async () => {
    if (!gradeForm.nombre.trim()) {
      Alert.alert('Validacion', 'El nombre del grado es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nombre: gradeForm.nombre.trim(),
        numericLevel: gradeForm.numericLevel ? Number(gradeForm.numericLevel) : null,
        educationLevel: gradeForm.educationLevel.trim() || null,
        status: gradeForm.status,
      };

      if (editingGrade) {
        await apiFetch(`/api/grados/${editingGrade.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/grados', { method: 'POST', body });
      }

      setGradeModal(false);
      await loadGrades();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el grado.');
    } finally {
      setSaving(false);
    }
  };

  const saveCourse = async () => {
    if (!selectedGrade) return;

    const capacity = Number(courseForm.maxStudents);
    if (!courseForm.nomenclature.trim() || !Number.isInteger(capacity) || capacity <= 0) {
      Alert.alert('Validacion', 'La nomenclatura y una capacidad mayor que cero son obligatorias.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nomenclature: courseForm.nomenclature.trim(),
        maxStudents: capacity,
        estado: courseForm.estado,
      };

      if (editingCourse) {
        await apiFetch(`/api/cursos/${editingCourse.id}`, { method: 'PUT', body });
      } else {
        await apiFetch(`/api/grados/${selectedGrade.id}/cursos`, { method: 'POST', body });
      }

      setCourseModal(false);
      await loadCoursesForGrade(selectedGrade);
      await loadGrades();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGrade = (grado: Grado) => {
    setConfirmState({
      title: 'Eliminar grado',
      message: `Eliminar ${grado.nombre}. Si tiene cursos activos, el backend lo bloqueara.`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/grados/${grado.id}`, { method: 'DELETE' });
          await loadGrades();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el grado.');
        }
      },
    });
  };

  const deleteCourse = (curso: Curso) => {
    setConfirmState({
      title: 'Eliminar curso',
      message: `Eliminar ${curso.full_name}. Si tiene estudiantes asignados, el backend lo bloqueara.`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/cursos/${curso.id}`, { method: 'DELETE' });
          if (selectedGrade) await loadCoursesForGrade(selectedGrade);
          await loadGrades();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el curso.');
        }
      },
    });
  };

  const backToGrades = () => {
    setSelectedGrade(null);
    setSelectedCourse(null);
    setCursos([]);
  };

  const backToCourses = () => {
    setSelectedCourse(null);
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ModuleHeader title="Grados" onAdd={!selectedGrade ? openCreateGrade : openCreateCourse} addLabel={selectedGrade ? '+ Curso' : '+ Grado'} />

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            loadGrades();
          }}
        />
      ) : selectedCourse ? (
        <CourseDetailView course={selectedCourse} onBack={backToCourses} />
      ) : selectedGrade ? (
        <CoursesView
          cursos={cursos}
          grade={selectedGrade}
          onBack={backToGrades}
          onCreate={openCreateCourse}
          onDelete={deleteCourse}
          onEdit={openEditCourse}
          onView={loadCourseDetail}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadGrades();
              }}
            />
          }
          contentContainerStyle={styles.content}>
          <View style={styles.statsGrid}>
            <StatBox label="Grados" value={String(stats.grades)} />
            <StatBox label="Activos" value={String(stats.activeGrades)} />
            <StatBox label="Cursos" value={String(stats.courses)} />
            <StatBox label="Estudiantes" value={String(stats.students)} />
          </View>

          <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <MagnifyingGlassIcon width={16} height={16} color={theme.textSecondary} />
            <TextInput
              onChangeText={setSearch}
              placeholder="Buscar grado o nivel"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
            />
          </View>

          <View style={styles.list}>
            {filteredGrades.length === 0 ? (
              <EmptyState message="No hay grados para mostrar." onCreate={openCreateGrade} label="Agregar grado" />
            ) : (
              filteredGrades.map((grado) => (
                <GradoRow
                  key={grado.id}
                  grado={grado}
                  onDelete={() => deleteGrade(grado)}
                  onEdit={() => openEditGrade(grado)}
                  onView={() => loadCoursesForGrade(grado)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={gradeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={[styles.modalContent, { borderColor: theme.border }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              {editingGrade ? 'Editar grado' : 'Agregar grado'}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <FormField
                label="Nombre del grado"
                value={gradeForm.nombre}
                onChangeText={(nombre) => setGradeForm((form) => ({ ...form, nombre }))}
              />
              <FormField
                label="Numero de grado"
                value={gradeForm.numericLevel}
                onChangeText={(numericLevel) => setGradeForm((form) => ({ ...form, numericLevel }))}
                keyboardType="numeric"
              />
              <FormField
                label="Nivel educativo"
                value={gradeForm.educationLevel}
                onChangeText={(educationLevel) => setGradeForm((form) => ({ ...form, educationLevel }))}
              />
              <OptionChips
                label="Estado"
                options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo' },
                ]}
                value={gradeForm.status}
                onChange={(status) => setGradeForm((form) => ({ ...form, status: status as Estado }))}
              />
            </ScrollView>
            <ModalActions saving={saving} onCancel={() => setGradeModal(false)} onSave={saveGrade} />
          </ThemedView>
        </View>
      </Modal>

      <Modal visible={courseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={[styles.modalContent, { borderColor: theme.border }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              {editingCourse ? 'Editar curso' : `Agregar curso ${selectedGrade?.numeric_level ?? selectedGrade?.nombre ?? ''}`}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <FormField
                label="Nomenclatura"
                value={courseForm.nomenclature}
                onChangeText={(nomenclature) => setCourseForm((form) => ({ ...form, nomenclature }))}
              />
              <FormField
                label="Capacidad maxima"
                value={courseForm.maxStudents}
                onChangeText={(maxStudents) => setCourseForm((form) => ({ ...form, maxStudents }))}
                keyboardType="numeric"
              />
              <OptionChips
                label="Estado"
                options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo' },
                ]}
                value={courseForm.estado}
                onChange={(estado) => setCourseForm((form) => ({ ...form, estado: estado as Estado }))}
              />
            </ScrollView>
            <ModalActions saving={saving} onCancel={() => setCourseModal(false)} onSave={saveCourse} />
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
    </ScreenShell>
  );
}

function GradoRow({
  grado,
  onDelete,
  onEdit,
  onView,
}: {
  grado: Grado;
  onDelete: () => void;
  onEdit: () => void;
  onView: () => void;
}) {
  const theme = useTheme();
  const active = grado.status === 'activo';

  return (
    <ThemedView type="backgroundElement" style={[styles.rowCard, { borderColor: theme.border }]}>
      <View style={styles.rowMain}>
        <View style={[styles.iconBox, { backgroundColor: `${theme.primary}18` }]}>
          <AcademicCapIcon width={18} height={18} color={theme.primary} />
        </View>
        <View style={styles.rowText}>
          <ThemedText style={[styles.rowTitle, { color: theme.text }]}>{grado.nombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Nivel {grado.education_level || 'Sin nivel'} - {grado.cursos_count} cursos - {grado.total_estudiantes} estudiantes
          </ThemedText>
        </View>
      </View>
      <View style={styles.rowActions}>
        <StatusBadge active={active} />
        <IconAction onPress={onView} icon="view" />
        <IconAction onPress={onEdit} icon="edit" />
        <IconAction danger onPress={onDelete} icon="delete" />
      </View>
    </ThemedView>
  );
}

function CoursesView({
  cursos,
  grade,
  onBack,
  onCreate,
  onDelete,
  onEdit,
  onView,
}: {
  cursos: Curso[];
  grade: Grado;
  onBack: () => void;
  onCreate: () => void;
  onDelete: (curso: Curso) => void;
  onEdit: (curso: Curso) => void;
  onView: (curso: Curso) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={[styles.backButton, { borderColor: theme.border }]}>
          <ArrowLeftIcon width={16} height={16} color={theme.text} />
          <ThemedText style={{ color: theme.text }}>Volver</ThemedText>
        </Pressable>
        <View style={styles.subHeaderText}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Cursos del grado {grade.numeric_level ?? grade.nombre}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {grade.education_level || 'Sin nivel'} - {cursos.length} cursos registrados
          </ThemedText>
        </View>
        <Pressable onPress={onCreate} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.primaryButtonText, { color: theme.primaryText }]}>Agregar curso</ThemedText>
        </Pressable>
      </View>

      {cursos.length === 0 ? (
        <EmptyState message="Este grado aun no tiene cursos." onCreate={onCreate} label="Agregar curso" />
      ) : (
        <ThemedView type="backgroundElement" style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
            <ThemedText style={styles.headCourse}>Curso</ThemedText>
            <ThemedText style={styles.headCell}>Capacidad</ThemedText>
            <ThemedText style={styles.headCell}>Estudiantes</ThemedText>
            <ThemedText style={styles.headCell}>Cupos</ThemedText>
            <ThemedText style={styles.headCell}>Estado</ThemedText>
            <ThemedText style={styles.headActions}>Acciones</ThemedText>
          </View>
          {cursos.map((curso) => (
            <View key={curso.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <ThemedText style={[styles.courseCell, { color: theme.text }]}>{curso.full_name}</ThemedText>
              <ThemedText style={[styles.cell, { color: theme.text }]}>{curso.max_students}</ThemedText>
              <ThemedText style={[styles.cell, { color: theme.text }]}>{curso.estudiantes_actuales}</ThemedText>
              <ThemedText style={[styles.cell, { color: curso.cupos_disponibles === 0 ? theme.danger : theme.accent }]}>
                {curso.cupos_disponibles}
              </ThemedText>
              <View style={styles.cell}>
                <StatusBadge active={curso.estado === 'activo'} compact />
              </View>
              <View style={styles.actionsCell}>
                <IconAction onPress={() => onView(curso)} icon="view" />
                <IconAction onPress={() => onEdit(curso)} icon="edit" />
                <IconAction danger onPress={() => onDelete(curso)} icon="delete" />
              </View>
            </View>
          ))}
        </ThemedView>
      )}
    </ScrollView>
  );
}

function CourseDetailView({ course, onBack }: { course: CursoDetalle; onBack: () => void }) {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={[styles.backButton, { borderColor: theme.border }]}>
          <ArrowLeftIcon width={16} height={16} color={theme.text} />
          <ThemedText style={{ color: theme.text }}>Cursos</ThemedText>
        </Pressable>
        <View style={styles.subHeaderText}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{course.full_name}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Grado {course.numeric_level ?? course.grado_nombre} - {course.nivel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatBox label="Capacidad" value={String(course.max_students)} />
        <StatBox label="Estudiantes" value={String(course.estudiantes_actuales)} />
        <StatBox label="Cupos" value={String(course.cupos_disponibles)} />
        <StatBox label="Estado" value={course.estado} />
      </View>

      <ThemedView type="backgroundElement" style={[styles.table, { borderColor: theme.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.headCourse}>Estudiante</ThemedText>
          <ThemedText style={styles.headCell}>Documento</ThemedText>
          <ThemedText style={styles.headCell}>Correo</ThemedText>
          <ThemedText style={styles.headCell}>Estado</ThemedText>
        </View>
        {course.estudiantes.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Este curso no tiene estudiantes asignados.
          </ThemedText>
        ) : (
          course.estudiantes.map((student) => (
            <View key={student.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
              <View style={styles.studentCell}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {student.nombres.charAt(0)}
                    {student.apellidos.charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.courseCell, { color: theme.text }]}>
                  {student.nombres} {student.apellidos}
                </ThemedText>
              </View>
              <ThemedText style={[styles.cell, { color: theme.text }]}>{student.documento}</ThemedText>
              <ThemedText style={[styles.cell, { color: theme.text }]} numberOfLines={1}>
                {student.correo || 'Sin correo'}
              </ThemedText>
              <ThemedText style={[styles.cell, { color: student.estado === 'activo' ? theme.accent : theme.textSecondary }]}>
                {student.estado}
              </ThemedText>
            </View>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.statBox, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function StatusBadge({ active, compact = false }: { active: boolean; compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.statusBadge, compact && styles.statusBadgeCompact, { backgroundColor: active ? `${theme.accent}1F` : `${theme.warning}24` }]}>
      <ThemedText type="small" style={[styles.statusText, { color: active ? theme.accent : theme.warning }]}>
        {active ? 'Activo' : 'Inactivo'}
      </ThemedText>
    </View>
  );
}

function IconAction({
  danger = false,
  icon,
  onPress,
}: {
  danger?: boolean;
  icon: 'view' | 'edit' | 'delete';
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;
  const Icon = icon === 'view' ? EyeIcon : icon === 'edit' ? PencilSquareIcon : TrashIcon;

  return (
    <Pressable onPress={onPress} style={[styles.iconAction, { borderColor: danger ? `${theme.danger}55` : theme.border }]}>
      <Icon width={15} height={15} color={color} />
    </Pressable>
  );
}

function ModalActions({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.modalActions}>
      <Pressable
        disabled={saving}
        onPress={onCancel}
        style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={[styles.buttonText, { color: theme.text }]}>Cancelar</ThemedText>
      </Pressable>
      <Pressable disabled={saving} onPress={onSave} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
        {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={[styles.buttonText, { color: theme.primaryText }]}>Guardar</ThemedText>}
      </Pressable>
    </View>
  );
}

function EmptyState({ label, message, onCreate }: { label: string; message: string; onCreate: () => void }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.emptyState, { borderColor: theme.border }]}>
      <UsersIcon width={22} height={22} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>{message}</ThemedText>
      <Pressable onPress={onCreate} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
        <PlusIcon width={16} height={16} color={theme.primaryText} />
        <ThemedText style={[styles.primaryButtonText, { color: theme.primaryText }]}>{label}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statBox: { minWidth: 130, flex: 1, borderWidth: 1, borderRadius: 8, padding: Spacing.three },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 4, textTransform: 'capitalize' },
  searchBox: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, paddingVertical: 8 },
  list: { gap: Spacing.two },
  rowCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowMain: { flex: 1, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBox: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 17, fontWeight: '800' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  statusBadge: { minHeight: 30, borderRadius: 8, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  statusBadgeCompact: { minHeight: 26, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  iconAction: { width: 34, height: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  subHeaderText: { flex: 1, minWidth: 220 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  backButton: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  primaryButton: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  primaryButtonText: { fontSize: 13, fontWeight: '800' },
  table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  tableHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: Spacing.two },
  tableRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: Spacing.two },
  headCourse: { flex: 1.4, minWidth: 120, fontSize: 11, fontWeight: '800', opacity: 0.58, textTransform: 'uppercase' },
  headCell: { flex: 1, minWidth: 84, fontSize: 11, fontWeight: '800', opacity: 0.58, textTransform: 'uppercase' },
  headActions: { width: 120, fontSize: 11, fontWeight: '800', opacity: 0.58, textTransform: 'uppercase', textAlign: 'right' },
  courseCell: { flex: 1.4, minWidth: 120, fontWeight: '800' },
  cell: { flex: 1, minWidth: 84, fontWeight: '600' },
  actionsCell: { width: 120, flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.one },
  studentCell: { flex: 1.4, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, padding: Spacing.four },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  cancelButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 1, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontWeight: '800' },
  emptyState: { minHeight: 180, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  emptyText: { textAlign: 'center', padding: Spacing.three },
});
