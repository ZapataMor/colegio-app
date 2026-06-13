import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import ClipboardDocumentCheckIcon from 'react-native-heroicons/outline/ClipboardDocumentCheckIcon';
import DocumentTextIcon from 'react-native-heroicons/outline/DocumentTextIcon';
import IdentificationIcon from 'react-native-heroicons/outline/IdentificationIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PhoneIcon from 'react-native-heroicons/outline/PhoneIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UserIcon from 'react-native-heroicons/outline/UserIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type Curso = { id: number; nombre: string; nivel?: string; jornada?: string };
type Estudiante = { id: number; nombres: string; apellidos: string; documento: string };
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
  acudiente: '',
  observaciones: '',
};

type Tab = 'lista' | 'registro' | 'detalle';

export default function MatriculaScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('lista');
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selected, setSelected] = useState<Matricula | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [matRes, estRes, cursosRes] = await Promise.all([
        apiFetch<Matricula[]>(`/api/matriculas?anio=${ANIO_ACTUAL}`),
        apiFetch<Estudiante[]>('/api/estudiantes'),
        apiFetch<Curso[]>('/api/cursos'),
      ]);
      const data = matRes.data ?? [];
      setMatriculas(data);
      setSelected((current) => current ?? data[0] ?? null);
      setEstudiantes(estRes.data ?? []);
      setCursos(cursosRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar matriculas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const activas = matriculas.filter((m) => m.estado === 'activa').length;
    const retirados = matriculas.filter((m) => m.estado === 'retirada' || m.estado === 'cancelada').length;
    return {
      total: matriculas.length,
      activas,
      pendientes: Math.max(matriculas.length - activas - retirados, 0),
      retirados,
    };
  }, [matriculas]);

  const startCreate = () => {
    setForm({
      ...emptyForm,
      estudianteId: estudiantes[0] ? String(estudiantes[0].id) : '',
      cursoId: cursos[0] ? String(cursos[0].id) : '',
    });
    setTab('registro');
  };

  const startEdit = (matricula: Matricula) => {
    setSelected(matricula);
    setForm({
      ...emptyForm,
      estudianteId: String(matricula.estudiante_id),
      cursoId: String(matricula.curso_id),
      anio: String(matricula.anio),
      estado: matricula.estado,
    });
    setTab('registro');
  };

  const handleSave = async () => {
    if (!form.estudianteId || !form.cursoId || !form.anio.trim()) {
      Alert.alert('Validacion', 'Estudiante, curso y periodo son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/matriculas', {
        method: 'POST',
        body: {
          estudianteId: Number(form.estudianteId),
          cursoId: Number(form.cursoId),
          anio: Number(form.anio),
        },
      });
      await loadData();
      setTab('lista');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (matricula: Matricula) => {
    setConfirmState({
      title: 'Retirar matricula',
      message: `Retirar a ${matricula.estudiante_nombres} ${matricula.estudiante_apellidos}?`,
      confirmText: 'Retirar',
      onConfirm: async () => {
        await apiFetch(`/api/matriculas/${matricula.id}`, { method: 'DELETE' });
        setSelected(null);
        await loadData();
      },
    });
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <AcademicCapIcon width={20} height={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Gestion academica
          </ThemedText>
          <ThemedText style={styles.title}>Matriculas {ANIO_ACTUAL}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {matriculas.length} matricula{matriculas.length !== 1 ? 's' : ''} - Periodo activo
          </ThemedText>
        </View>
        <Pressable onPress={startCreate} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Nueva</ThemedText>
        </Pressable>
      </ThemedView>

      <View style={[styles.tabs, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <TabButton active={tab === 'lista'} label="Lista" onPress={() => setTab('lista')} />
        <TabButton active={tab === 'registro'} label="Registro" onPress={startCreate} />
        <TabButton active={tab === 'detalle'} label="Detalle" onPress={() => setTab('detalle')} />
      </View>

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
      ) : tab === 'registro' ? (
        <RegistroView
          cursos={cursos}
          estudiantes={estudiantes}
          form={form}
          saving={saving}
          setForm={setForm}
          onSave={handleSave}
        />
      ) : tab === 'detalle' ? (
        <DetalleView matricula={selected ?? matriculas[0] ?? null} onEdit={startEdit} onDelete={handleDelete} />
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
          contentContainerStyle={styles.listScreen}>
          <View style={styles.metricsGrid}>
            <Metric label="Total" value={metrics.total} />
            <Metric label="Activas" value={metrics.activas} tone="ok" />
            <Metric label="Pendientes" value={metrics.pendientes} tone="warn" />
            <Metric label="Retirados" value={metrics.retirados} tone="danger" />
          </View>

          <ThemedText type="small" style={styles.sectionLabel}>
            RECIENTES
          </ThemedText>
          {matriculas.map((matricula, index) => (
            <MatriculaItem
              key={matricula.id}
              index={index}
              matricula={matricula}
              onPress={() => {
                setSelected(matricula);
                setTab('detalle');
              }}
            />
          ))}

          <Pressable onPress={startCreate} style={styles.newButton}>
            <PlusIcon width={16} height={16} color="#111" />
            <ThemedText style={styles.newButtonText}>Nueva matricula</ThemedText>
          </Pressable>
        </ScrollView>
      )}
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

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && { backgroundColor: theme.primary }]}>
      <ThemedText style={[styles.tabText, active && { color: theme.primaryText }]}>{label}</ThemedText>
    </Pressable>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' | 'danger' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'danger' ? theme.danger : tone === 'warn' ? '#B86B00' : theme.text;
  return (
    <ThemedView type="backgroundElement" style={styles.metricCard}>
      <ThemedText type="small" style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function MatriculaItem({ matricula, index, onPress }: { matricula: Matricula; index: number; onPress: () => void }) {
  const theme = useTheme();
  const percent = [100, 60, 30][index % 3];
  const colors = [theme.accent, '#B86B00', theme.primary];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: `${theme.primary}30` }]}>
        <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
          {`${matricula.estudiante_nombres[0] ?? ''}${matricula.estudiante_apellidos[0] ?? ''}`.toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <ThemedText style={styles.itemName}>
            {matricula.estudiante_nombres} {matricula.estudiante_apellidos}
          </ThemedText>
          <Status estado={matricula.estado} />
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {matricula.curso_nombre} - Mat. #{matricula.anio}-{String(matricula.id).padStart(3, '0')}
        </ThemedText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: colors[index % 3] }]} />
        </View>
        <ThemedText type="small" style={styles.progressText}>{percent === 100 ? 'Completa' : `${percent}%`}</ThemedText>
      </View>
    </Pressable>
  );
}

function RegistroView({
  cursos,
  estudiantes,
  form,
  saving,
  setForm,
  onSave,
}: {
  cursos: Curso[];
  estudiantes: Estudiante[];
  form: typeof emptyForm;
  saving: boolean;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSave: () => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.formScreen}>
      <ThemedText style={styles.formTitle}>Nueva matricula</ThemedText>
      <Field label="Estudiante" value={form.estudianteId} placeholder="Buscar estudiante..." onChangeText={(estudianteId) => setForm((f) => ({ ...f, estudianteId }))} />
      <SelectChips
        label="Curso"
        options={cursos.map((c) => ({ value: String(c.id), label: c.nombre }))}
        value={form.cursoId}
        onChange={(cursoId) => setForm((f) => ({ ...f, cursoId }))}
      />
      <Field label="Periodo academico" value={form.anio} onChangeText={(anio) => setForm((f) => ({ ...f, anio }))} />
      <SelectChips
        label="Estado inicial"
        options={[
          { value: 'activa', label: 'Activa' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'condicional', label: 'Condicional' },
        ]}
        value={form.estado}
        onChange={(estado) => setForm((f) => ({ ...f, estado }))}
      />
      <Field label="Acudiente" value={form.acudiente} placeholder="Nombre del acudiente" onChangeText={(acudiente) => setForm((f) => ({ ...f, acudiente }))} />
      <Field label="Observaciones" value={form.observaciones} placeholder="Opcional..." multiline onChangeText={(observaciones) => setForm((f) => ({ ...f, observaciones }))} />
      <Pressable onPress={onSave} disabled={saving || estudiantes.length === 0} style={[styles.saveButton, { borderColor: theme.border }]}>
        {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={styles.saveText}>Guardar matricula</ThemedText>}
      </Pressable>
    </ScrollView>
  );
}

function DetalleView({
  matricula,
  onEdit,
  onDelete,
}: {
  matricula: Matricula | null;
  onEdit: (matricula: Matricula) => void;
  onDelete: (matricula: Matricula) => void;
}) {
  const theme = useTheme();
  if (!matricula) return <ThemedText>No hay matricula seleccionada.</ThemedText>;

  return (
    <ScrollView contentContainerStyle={styles.detailScreen}>
      <View style={styles.detailHeader}>
        <View style={[styles.bigAvatar, { backgroundColor: `${theme.primary}30` }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
            {`${matricula.estudiante_nombres[0] ?? ''}${matricula.estudiante_apellidos[0] ?? ''}`.toUpperCase()}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.detailName}>
            {matricula.estudiante_nombres} {matricula.estudiante_apellidos}
          </ThemedText>
          <ThemedText type="small">Mat. #{matricula.anio}-{String(matricula.id).padStart(3, '0')} - {matricula.curso_nombre}</ThemedText>
        </View>
        <Status estado={matricula.estado} />
      </View>

      <View style={styles.detailGrid}>
        <Info icon={CalendarDaysIcon} label="Periodo" value={`${matricula.anio} - I`} />
        <Info icon={IdentificationIcon} label="Documento" value={matricula.estudiante_documento} />
        <Info icon={UserIcon} label="Acudiente" value="M. Torres" />
        <Info icon={PhoneIcon} label="Telefono" value="315 000 0001" />
      </View>

      <ThemedText type="small" style={styles.sectionLabel}>HISTORIAL</ThemedText>
      <Timeline icon={ClipboardDocumentCheckIcon} title="Matricula confirmada" date="12 ene 2025" />
      <Timeline icon={DocumentTextIcon} title="Documentos entregados" date="10 ene 2025" note="Paz y salvo, fotos, boletin anterior." />
      <Timeline icon={CalendarDaysIcon} title="Solicitud iniciada" date="8 ene 2025" />

      <View style={styles.detailActions}>
        <Pressable onPress={() => onEdit(matricula)} style={[styles.detailButton, { borderColor: theme.border }]}>
          <PencilSquareIcon width={16} height={16} color={theme.text} />
          <ThemedText>Editar</ThemedText>
        </Pressable>
        <Pressable onPress={() => onDelete(matricula)} style={[styles.detailButton, styles.retireButton]}>
          <TrashIcon width={16} height={16} color={theme.danger} />
          <ThemedText style={{ color: theme.danger }}>Retirar</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
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
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea, { borderColor: theme.border, color: theme.text }]}
      />
    </View>
  );
}

function SelectChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, { borderColor: active ? theme.primary : theme.border }, active && { backgroundColor: `${theme.primary}28` }]}>
              <ThemedText style={styles.chipText}>{option.label}</ThemedText>
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
  return (
    <View style={[styles.status, { backgroundColor: active ? `${theme.accent}22` : `${theme.warning}30` }]}>
      <ThemedText style={[styles.statusTextSmall, { color: active ? theme.accent : '#B86B00' }]}>
        {active ? 'Activa' : estado}
      </ThemedText>
    </View>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDaysIcon; label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.infoCard}>
      <Icon width={14} height={14} color={theme.textSecondary} />
      <View>
        <ThemedText type="small" style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </ThemedView>
  );
}

function Timeline({ icon: Icon, title, date, note }: { icon: typeof CalendarDaysIcon; title: string; date: string; note?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.timeline}>
      <View style={[styles.timelineIcon, { borderColor: theme.primary }]}>
        <Icon width={12} height={12} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.timelineTitle}>{title}</ThemedText>
        <ThemedText type="small">{date}</ThemedText>
        {note ? <ThemedView type="backgroundElement" style={styles.note}><ThemedText type="small">{note}</ThemedText></ThemedView> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.two },
  hero: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.two, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { fontWeight: '600', fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderWidth: 1, borderRadius: 10 },
  tabButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontWeight: '500', fontSize: 13 },
  listScreen: { gap: Spacing.two, paddingBottom: Spacing.five },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricCard: { width: '48%', padding: Spacing.two, borderRadius: 6 },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 22, fontWeight: '800' },
  sectionLabel: { fontWeight: '500', opacity: 0.6, letterSpacing: 0.6 },
  itemCard: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.two, borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 8 },
  avatar: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  bigAvatar: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '500', fontSize: 12 },
  itemBody: { flex: 1, gap: 4 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  itemName: { fontWeight: '500' },
  status: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  statusTextSmall: { fontSize: 10, fontWeight: '500' },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: '#EEECE5', overflow: 'hidden', marginTop: 8 },
  progressBar: { height: 4, borderRadius: 999 },
  progressText: { alignSelf: 'flex-end', fontSize: 10, fontWeight: '500' },
  newButton: { minHeight: 36, borderWidth: 1, borderColor: '#B8BEC8', borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  newButtonText: { fontWeight: '500' },
  formScreen: { gap: Spacing.two, paddingBottom: Spacing.five },
  formTitle: { fontWeight: '600', fontSize: 16, marginVertical: Spacing.two },
  field: { gap: 4 },
  fieldLabel: { fontWeight: '500', fontSize: 12 },
  input: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  textArea: { minHeight: 76, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '500' },
  saveButton: { minHeight: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.two },
  saveText: { fontWeight: '500' },
  detailScreen: { gap: Spacing.three, paddingBottom: Spacing.five },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  detailName: { fontSize: 18, fontWeight: '600' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  infoCard: { width: '48%', flexDirection: 'row', gap: Spacing.two, padding: Spacing.two, borderRadius: 6 },
  infoLabel: { fontSize: 10, fontWeight: '500' },
  infoValue: { fontWeight: '500', fontSize: 12 },
  timeline: { flexDirection: 'row', gap: Spacing.two },
  timelineIcon: { width: 18, height: 18, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timelineTitle: { fontWeight: '500' },
  note: { marginTop: 4, padding: Spacing.two, borderRadius: 5 },
  detailActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  detailButton: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  retireButton: { borderColor: '#F25C5C', backgroundColor: 'rgba(242,92,92,0.10)' },
  pressed: { opacity: 0.75 },
});
