import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

type PeriodoEstado = 'activo' | 'inactivo' | 'cerrado';
type AsignaturaEstado = 'activo' | 'inactivo';

type Periodo = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: PeriodoEstado;
  asignaturas_count?: number;
};

type CatalogAsignatura = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado?: string;
};

type PeriodoAsignatura = {
  id: number;
  periodo_id: number;
  asignatura_id: number;
  estado: AsignaturaEstado;
  observacion: string | null;
  asignatura_nombre: string;
  asignatura_descripcion?: string | null;
  area_nombre?: string | null;
  actividades_count: number;
  notas_count: number;
  asistencias_count: number;
};

const ESTADOS: PeriodoEstado[] = ['activo', 'inactivo', 'cerrado'];
const ASIGNATURA_ESTADOS: AsignaturaEstado[] = ['activo', 'inactivo'];

const emptyPeriodoForm = { nombre: '', fechaInicio: '', fechaFin: '', estado: 'activo' as PeriodoEstado };
const emptyAsignaturaForm = { asignaturaId: '', estado: 'activo' as AsignaturaEstado, observacion: '' };

const estadoColor = (estado: PeriodoEstado | AsignaturaEstado) => {
  if (estado === 'activo') return '#8FBF26';
  if (estado === 'cerrado') return '#F25C5C';
  return '#A0A8B2';
};

const formatDate = (value?: string) => value?.slice(0, 10) ?? '';

export default function PeriodosScreen() {
  const theme = useTheme();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [asignaturas, setAsignaturas] = useState<CatalogAsignatura[]>([]);
  const [periodoAsignaturas, setPeriodoAsignaturas] = useState<PeriodoAsignatura[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [periodoModalVisible, setPeriodoModalVisible] = useState(false);
  const [asignaturaModalVisible, setAsignaturaModalVisible] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
  const [editingAsignatura, setEditingAsignatura] = useState<PeriodoAsignatura | null>(null);
  const [periodoForm, setPeriodoForm] = useState(emptyPeriodoForm);
  const [asignaturaForm, setAsignaturaForm] = useState(emptyAsignaturaForm);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const selectedPeriodo = useMemo(
    () => periodos.find((periodo) => periodo.id === selectedPeriodoId) ?? null,
    [periodos, selectedPeriodoId]
  );

  const stats = useMemo(() => {
    const activos = periodos.filter((periodo) => periodo.estado === 'activo').length;
    const cerrados = periodos.filter((periodo) => periodo.estado === 'cerrado').length;
    const asignadas = periodos.reduce((sum, periodo) => sum + Number(periodo.asignaturas_count ?? 0), 0);
    return { total: periodos.length, activos, cerrados, asignadas };
  }, [periodos]);

  const loadPeriodoAsignaturas = useCallback(async (periodoId: number | null) => {
    if (!periodoId) {
      setPeriodoAsignaturas([]);
      return;
    }

    try {
      setDetailLoading(true);
      const res = await apiFetch<PeriodoAsignatura[]>(`/api/periodos/${periodoId}/asignaturas`);
      setPeriodoAsignaturas(res.data ?? []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudieron cargar las asignaturas del periodo.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [periodosRes, asignaturasRes] = await Promise.all([
        apiFetch<Periodo[]>('/api/periodos'),
        apiFetch<CatalogAsignatura[]>('/api/asignaturas'),
      ]);

      const nextPeriodos = periodosRes.data ?? [];
      setPeriodos(nextPeriodos);
      setAsignaturas(asignaturasRes.data ?? []);
      setSelectedPeriodoId((current) => current ?? nextPeriodos[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar periodos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPeriodoAsignaturas(selectedPeriodoId);
  }, [loadPeriodoAsignaturas, selectedPeriodoId]);

  const openCreatePeriodo = () => {
    setEditingPeriodo(null);
    setPeriodoForm(emptyPeriodoForm);
    setPeriodoModalVisible(true);
  };

  const openEditPeriodo = (periodo: Periodo) => {
    setEditingPeriodo(periodo);
    setPeriodoForm({
      nombre: periodo.nombre,
      fechaInicio: formatDate(periodo.fecha_inicio),
      fechaFin: formatDate(periodo.fecha_fin),
      estado: periodo.estado,
    });
    setPeriodoModalVisible(true);
  };

  const savePeriodo = async () => {
    if (!periodoForm.nombre.trim() || !periodoForm.fechaInicio || !periodoForm.fechaFin) {
      Alert.alert('Faltan datos', 'Nombre, fecha de inicio y fecha de fin son obligatorios.');
      return;
    }

    if (periodoForm.fechaFin < periodoForm.fechaInicio) {
      Alert.alert('Fechas inválidas', 'La fecha final debe ser mayor o igual a la fecha inicial.');
      return;
    }

    try {
      setSaving(true);
      const body = {
        nombre: periodoForm.nombre.trim(),
        fechaInicio: periodoForm.fechaInicio,
        fechaFin: periodoForm.fechaFin,
        estado: periodoForm.estado,
      };

      if (editingPeriodo) {
        await apiFetch(`/api/periodos/${editingPeriodo.id}`, { method: 'PUT', body });
      } else {
        const res = await apiFetch<Periodo>('/api/periodos', { method: 'POST', body });
        if (res.data?.id) setSelectedPeriodoId(res.data.id);
      }

      setPeriodoModalVisible(false);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const deletePeriodo = (periodo: Periodo) => {
    setConfirmState({
      title: 'Eliminar periodo',
      message: `Eliminar el periodo "${periodo.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/periodos/${periodo.id}`, { method: 'DELETE' });
          if (selectedPeriodoId === periodo.id) setSelectedPeriodoId(null);
          await load();
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
        }
      },
    });
  };

  const asignaturaOptions = useMemo(() => {
    const assignedIds = new Set(periodoAsignaturas.map((item) => item.asignatura_id));
    return asignaturas
      .filter((asignatura) => {
        if (asignatura.estado && asignatura.estado !== 'activo') return false;
        if (editingAsignatura?.asignatura_id === asignatura.id) return true;
        return !assignedIds.has(asignatura.id);
      })
      .map((asignatura) => ({ value: String(asignatura.id), label: asignatura.nombre }));
  }, [asignaturas, editingAsignatura, periodoAsignaturas]);

  const openCreateAsignatura = () => {
    if (!selectedPeriodo) {
      Alert.alert('Selecciona un periodo', 'Primero selecciona el periodo que vas a configurar.');
      return;
    }

    const first = asignaturaOptions[0]?.value ?? '';
    setEditingAsignatura(null);
    setAsignaturaForm({ ...emptyAsignaturaForm, asignaturaId: first });
    setAsignaturaModalVisible(true);
  };

  const openEditAsignatura = (item: PeriodoAsignatura) => {
    setEditingAsignatura(item);
    setAsignaturaForm({
      asignaturaId: String(item.asignatura_id),
      estado: item.estado,
      observacion: item.observacion ?? '',
    });
    setAsignaturaModalVisible(true);
  };

  const saveAsignatura = async () => {
    if (!selectedPeriodo) return;
    if (!asignaturaForm.asignaturaId) {
      Alert.alert('Asignatura requerida', 'Selecciona una asignatura para el periodo.');
      return;
    }

    try {
      setSaving(true);
      const body = {
        asignaturaId: Number(asignaturaForm.asignaturaId),
        estado: asignaturaForm.estado,
        observacion: asignaturaForm.observacion.trim() || null,
      };

      if (editingAsignatura) {
        await apiFetch(`/api/periodos/${selectedPeriodo.id}/asignaturas/${editingAsignatura.id}`, {
          method: 'PUT',
          body,
        });
      } else {
        await apiFetch(`/api/periodos/${selectedPeriodo.id}/asignaturas`, { method: 'POST', body });
      }

      setAsignaturaModalVisible(false);
      await Promise.all([load(), loadPeriodoAsignaturas(selectedPeriodo.id)]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la asignatura.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAsignatura = (item: PeriodoAsignatura) => {
    if (!selectedPeriodo) return;

    setConfirmState({
      title: 'Eliminar asignatura',
      message: `Quitar "${item.asignatura_nombre}" de ${selectedPeriodo.nombre}?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/periodos/${selectedPeriodo.id}/asignaturas/${item.id}`, { method: 'DELETE' });
          await Promise.all([load(), loadPeriodoAsignaturas(selectedPeriodo.id)]);
        } catch (err) {
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar la asignatura.');
        }
      },
    });
  };

  return (
    <ScreenShell contentStyle={styles.shell}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <CalendarDaysIcon width={20} height={20} color={theme.primary} />
        </View>
        <View style={styles.heroText}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
            Calendario escolar
          </ThemedText>
          <ThemedText style={styles.title}>Periodos académicos</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Configura fechas, estado y asignaturas habilitadas por periodo.
          </ThemedText>
        </View>
        <Pressable onPress={openCreatePeriodo} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Nuevo periodo</ThemedText>
        </Pressable>
      </ThemedView>

      {loading ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando periodos...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ThemedText style={{ color: theme.danger, textAlign: 'center' }}>{error}</ThemedText>
          <Pressable onPress={load} style={[styles.outlineBtn, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.statsGrid}>
            <Stat label="Periodos" value={stats.total} />
            <Stat label="Activos" value={stats.activos} tone="ok" />
            <Stat label="Cerrados" value={stats.cerrados} tone="danger" />
            <Stat label="Asignaturas" value={stats.asignadas} tone="info" />
          </View>

          <View style={styles.board}>
            <View style={styles.periodColumn}>
              {periodos.length === 0 ? (
                <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
                  <ThemedText style={{ color: theme.textSecondary }}>No hay periodos registrados.</ThemedText>
                </ThemedView>
              ) : (
                periodos.map((periodo) => (
                  <PeriodoCard
                    key={periodo.id}
                    periodo={periodo}
                    selected={selectedPeriodoId === periodo.id}
                    onSelect={() => setSelectedPeriodoId(periodo.id)}
                    onEdit={() => openEditPeriodo(periodo)}
                    onDelete={() => deletePeriodo(periodo)}
                  />
                ))
              )}
            </View>

            <ThemedView type="backgroundElement" style={[styles.detailPanel, { borderColor: theme.border }]}>
              {!selectedPeriodo ? (
                <View style={styles.centerInner}>
                  <AcademicCapIcon width={28} height={28} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                    Selecciona un periodo para administrar sus asignaturas.
                  </ThemedText>
                </View>
              ) : (
                <>
                  <View style={styles.detailHeader}>
                    <View style={styles.detailCopy}>
                      <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>
                        {formatDate(selectedPeriodo.fecha_inicio)} a {formatDate(selectedPeriodo.fecha_fin)}
                      </ThemedText>
                      <ThemedText style={styles.detailTitle}>{selectedPeriodo.nombre}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {periodoAsignaturas.length} asignatura{periodoAsignaturas.length !== 1 ? 's' : ''} configurada
                        {periodoAsignaturas.length !== 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                    <Pressable onPress={openCreateAsignatura} style={[styles.smallPrimaryBtn, { backgroundColor: theme.primary }]}>
                      <PlusIcon width={14} height={14} color={theme.primaryText} />
                      <ThemedText style={[styles.smallPrimaryText, { color: theme.primaryText }]}>Agregar asignatura</ThemedText>
                    </Pressable>
                  </View>

                  {detailLoading ? (
                    <View style={styles.centerInner}>
                      <ActivityIndicator color={theme.primary} />
                    </View>
                  ) : periodoAsignaturas.length === 0 ? (
                    <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
                      <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                        Este periodo aun no tiene asignaturas asignadas.
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <View style={styles.subjectList}>
                      {periodoAsignaturas.map((item) => (
                        <AsignaturaCard
                          key={item.id}
                          item={item}
                          onEdit={() => openEditAsignatura(item)}
                          onDelete={() => deleteAsignatura(item)}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </ThemedView>
          </View>
        </ScrollView>
      )}

      <PeriodoModal
        visible={periodoModalVisible}
        editing={Boolean(editingPeriodo)}
        form={periodoForm}
        saving={saving}
        setForm={setPeriodoForm}
        onClose={() => setPeriodoModalVisible(false)}
        onSave={savePeriodo}
      />

      <AsignaturaModal
        visible={asignaturaModalVisible}
        editing={Boolean(editingAsignatura)}
        form={asignaturaForm}
        options={asignaturaOptions}
        saving={saving}
        setForm={setAsignaturaForm}
        onClose={() => setAsignaturaModalVisible(false)}
        onSave={saveAsignatura}
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

function PeriodoCard({
  periodo,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  periodo: Periodo;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.periodCard,
        { backgroundColor: theme.backgroundElement, borderColor: selected ? theme.primary : theme.border },
      ]}>
      <View style={styles.cardTop}>
        <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor(periodo.estado)}22` }]}>
          <ThemedText type="small" style={[styles.estadoText, { color: estadoColor(periodo.estado) }]}>
            {periodo.estado}
          </ThemedText>
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} style={[styles.iconBtn, { borderColor: theme.border }]}>
            <PencilSquareIcon width={16} height={16} color={theme.text} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.iconBtn, { borderColor: `${theme.danger}55` }]}>
            <TrashIcon width={16} height={16} color={theme.danger} />
          </Pressable>
        </View>
      </View>
      <ThemedText style={styles.cardNombre}>{periodo.nombre}</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
      </ThemedText>
      <ThemedText type="small" style={[styles.subjectCount, { color: theme.textSecondary }]}>
        {Number(periodo.asignaturas_count ?? 0)} asignatura{Number(periodo.asignaturas_count ?? 0) !== 1 ? 's' : ''}
      </ThemedText>
    </Pressable>
  );
}

function AsignaturaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PeriodoAsignatura;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const usage = Number(item.actividades_count || 0) + Number(item.notas_count || 0) + Number(item.asistencias_count || 0);

  return (
    <View style={[styles.subjectCard, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <View style={styles.subjectMain}>
        <View style={[styles.subjectIcon, { backgroundColor: `${theme.primary}22` }]}>
          <AcademicCapIcon width={17} height={17} color={theme.primary} />
        </View>
        <View style={styles.subjectCopy}>
          <ThemedText style={styles.subjectName}>{item.asignatura_nombre}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.area_nombre ?? 'Área académica'} - {usage} registro{usage !== 1 ? 's' : ''} asociado
            {usage !== 1 ? 's' : ''}
          </ThemedText>
          {item.observacion ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={2}>
              {item.observacion}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.subjectActions}>
        <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor(item.estado)}22` }]}>
          <ThemedText type="small" style={[styles.estadoText, { color: estadoColor(item.estado) }]}>{item.estado}</ThemedText>
        </View>
        <Pressable onPress={onEdit} style={[styles.iconBtn, { borderColor: theme.border }]}>
          <PencilSquareIcon width={16} height={16} color={theme.text} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconBtn, { borderColor: `${theme.danger}55` }]}>
          <TrashIcon width={16} height={16} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'danger' | 'info' }) {
  const theme = useTheme();
  const color = tone === 'ok' ? theme.accent : tone === 'danger' ? theme.danger : tone === 'info' ? theme.primary : theme.text;

  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function PeriodoModal({
  visible,
  editing,
  form,
  saving,
  setForm,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: boolean;
  form: typeof emptyPeriodoForm;
  saving: boolean;
  setForm: Dispatch<SetStateAction<typeof emptyPeriodoForm>>;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>{editing ? 'Editar periodo' : 'Nuevo periodo'}</ThemedText>
          <Field
            label="Nombre del periodo"
            value={form.nombre}
            onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}
            placeholder="Ej. Periodo 1 - 2026"
          />
          <Field
            label="Fecha de inicio (YYYY-MM-DD)"
            value={form.fechaInicio}
            onChangeText={(fechaInicio) => setForm((current) => ({ ...current, fechaInicio }))}
            placeholder="2026-01-15"
          />
          <Field
            label="Fecha de fin (YYYY-MM-DD)"
            value={form.fechaFin}
            onChangeText={(fechaFin) => setForm((current) => ({ ...current, fechaFin }))}
            placeholder="2026-03-30"
          />
          <Segmented
            label="Estado"
            options={ESTADOS.map((estado) => ({ value: estado, label: estado }))}
            value={form.estado}
            onChange={(estado) => setForm((current) => ({ ...current, estado: estado as PeriodoEstado }))}
          />
          <ModalActions saving={saving} onClose={onClose} onSave={onSave} />
        </ThemedView>
      </View>
    </Modal>
  );
}

function AsignaturaModal({
  visible,
  editing,
  form,
  options,
  saving,
  setForm,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: boolean;
  form: typeof emptyAsignaturaForm;
  options: { value: string; label: string }[];
  saving: boolean;
  setForm: Dispatch<SetStateAction<typeof emptyAsignaturaForm>>;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>{editing ? 'Editar asignatura del periodo' : 'Agregar asignatura'}</ThemedText>
          <SelectField
            label="Asignatura"
            value={form.asignaturaId}
            options={options}
            onSelect={(asignaturaId) => setForm((current) => ({ ...current, asignaturaId }))}
          />
          <Segmented
            label="Estado"
            options={ASIGNATURA_ESTADOS.map((estado) => ({ value: estado, label: estado }))}
            value={form.estado}
            onChange={(estado) => setForm((current) => ({ ...current, estado: estado as AsignaturaEstado }))}
          />
          <Field
            label="Observación"
            value={form.observacion}
            onChangeText={(observacion) => setForm((current) => ({ ...current, observacion }))}
            placeholder="Opcional"
            multiline
          />
          <ModalActions saving={saving} onClose={onClose} onSave={onSave} />
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
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.fieldInput,
          multiline && styles.textarea,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted },
        ]}
        value={value}
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
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
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
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Sin asignaturas disponibles</ThemedText>
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

function ModalActions({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.modalActions}>
      <Pressable disabled={saving} onPress={onClose} style={[styles.outlineBtn, { borderColor: theme.border }]}>
        <ThemedText>Cancelar</ThemedText>
      </Pressable>
      <Pressable disabled={saving} onPress={onSave} style={[styles.outlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
        {saving ? <ActivityIndicator color={theme.primaryText} /> : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
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
  center: { minHeight: 180, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.three },
  centerInner: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.three },
  page: { gap: Spacing.two, paddingBottom: Spacing.five },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: { flex: 1, minWidth: 128, borderWidth: 1, borderRadius: 8, padding: Spacing.two, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'flex-start' },
  periodColumn: { flex: 1, minWidth: 260, gap: Spacing.two },
  detailPanel: { flex: 1.5, minWidth: 300, borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: Spacing.three },
  periodCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  cardActions: { flexDirection: 'row', gap: 6 },
  estadoBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  estadoText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardNombre: { fontWeight: '700', fontSize: 15 },
  subjectCount: { fontWeight: '600' },
  iconBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two, flexWrap: 'wrap' },
  detailCopy: { flex: 1, minWidth: 170, gap: 2 },
  detailTitle: { fontSize: 18, fontWeight: '800' },
  smallPrimaryBtn: { minHeight: 36, borderRadius: 6, paddingHorizontal: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  smallPrimaryText: { fontSize: 12, fontWeight: '700' },
  subjectList: { gap: Spacing.two },
  subjectCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.two, gap: Spacing.two },
  subjectMain: { flexDirection: 'row', gap: Spacing.two },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subjectCopy: { flex: 1, minWidth: 0, gap: 3 },
  subjectName: { fontSize: 15, fontWeight: '800' },
  subjectActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' },
  emptyBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modal: { width: '100%', maxWidth: 540, borderWidth: 1, borderRadius: 10, padding: Spacing.four, gap: Spacing.two },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  field: { gap: 5 },
  fieldLabel: { fontWeight: '700', opacity: 0.7 },
  fieldInput: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  textarea: { minHeight: 82, textAlignVertical: 'top', paddingTop: 9 },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 6, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  segment: { minHeight: 34, borderRadius: 999, borderWidth: 1, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontWeight: '700', textTransform: 'capitalize' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  outlineBtn: { minHeight: 40, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
