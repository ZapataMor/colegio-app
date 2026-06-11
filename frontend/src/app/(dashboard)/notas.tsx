import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type NotaFila = {
  notaId: number;
  asignatura: string;
  asignaturaId: number;
  profesor: string;
  profesorId: number;
  periodo: string;
  periodoId: number;
  nota: number;
  observacion: string | null;
};

type Estudiante = {
  estudianteId: number;
  estudianteNombre: string;
  documento: string;
  notas: NotaFila[];
};

type CursoAgrupado = {
  cursoId: number;
  cursoNombre: string;
  estudiantes: Estudiante[];
};

type CatalogItem = { id: number; nombre: string; curso_id?: number; curso_nombre?: string };

type Catalog = {
  estudiantes: (CatalogItem & { curso_id: number; curso_nombre: string; documento: string })[];
  asignaturas: CatalogItem[];
  profesores: CatalogItem[];
  periodos: (CatalogItem & { estado: string })[];
  cursos: CatalogItem[];
};

const emptyForm = {
  estudianteId: '',
  cursoId: '',
  asignaturaId: '',
  profesorId: '',
  periodoId: '',
  nota: '',
  observacion: '',
};

const desempenoColor = (nota: number) => {
  if (nota >= 4.6) return '#8FBF26';
  if (nota >= 4.0) return '#4CA5DC';
  if (nota >= 3.0) return '#E8A020';
  return '#F25C5C';
};

// Anchos de columna para la tabla
const COL = { estudiante: 170, asignatura: 130, profesor: 140, periodo: 110, nota: 62, obs: 180, acciones: 90 };

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function NotasScreen() {
  const theme = useTheme();

  const [cursos, setCursos] = useState<CursoAgrupado[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({
    estudiantes: [], asignaturas: [], profesores: [], periodos: [], cursos: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFila & { estudianteId: number } | null>(null);
  const [form, setForm] = useState(emptyForm);

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');
      const params = filterPeriodo ? `?periodoId=${filterPeriodo}` : '';
      const [cursosRes, catRes] = await Promise.all([
        apiFetch<CursoAgrupado[]>(`/api/notas/por-curso${params}`),
        apiFetch<Catalog>('/api/notas/catalogo'),
      ]);
      setCursos(cursosRes.data ?? []);
      setCatalog(catRes.data ?? { estudiantes: [], asignaturas: [], profesores: [], periodos: [], cursos: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notas.');
    } finally {
      setLoading(false);
    }
  }, [filterPeriodo]);

  useEffect(() => { load(); }, [load]);

  // ── Acciones CRUD ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingNota(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (nota: NotaFila, estudianteId: number) => {
    setEditingNota({ ...nota, estudianteId });
    const est = catalog.estudiantes.find((e) => e.id === estudianteId);
    setForm({
      estudianteId: String(estudianteId),
      cursoId: est ? String(est.curso_id) : '',
      asignaturaId: String(nota.asignaturaId),
      profesorId: String(nota.profesorId),
      periodoId: String(nota.periodoId),
      nota: String(nota.nota),
      observacion: nota.observacion ?? '',
    });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.estudianteId || !form.cursoId || !form.asignaturaId || !form.profesorId || !form.periodoId || !form.nota) {
      Alert.alert('Faltan datos', 'Todos los campos obligatorios deben estar completos.');
      return;
    }
    const notaNum = Number(form.nota.replace(',', '.'));
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      Alert.alert('Nota invalida', 'La nota debe ser un numero entre 0.00 y 5.00.');
      return;
    }
    try {
      setSaving(true);
      const body = {
        estudianteId: Number(form.estudianteId),
        cursoId: Number(form.cursoId),
        asignaturaId: Number(form.asignaturaId),
        profesorId: Number(form.profesorId),
        periodoId: Number(form.periodoId),
        nota: notaNum,
        observacion: form.observacion.trim() || null,
      };
      if (editingNota) {
        await apiFetch(`/api/notas/${editingNota.notaId}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/notas', { method: 'POST', body });
      }
      setModalVisible(false);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNota = (nota: NotaFila, estudianteNombre: string) => {
    const remove = async () => {
      try {
        await apiFetch(`/api/notas/${nota.notaId}`, { method: 'DELETE' });
        await load();
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
      }
    };
    const msg = `Eliminar nota de ${estudianteNombre} en ${nota.asignatura}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) remove();
      return;
    }
    Alert.alert('Eliminar nota', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: remove },
    ]);
  };

  const onEstudianteChange = (estudianteId: string) => {
    const est = catalog.estudiantes.find((e) => String(e.id) === estudianteId);
    setForm((f) => ({ ...f, estudianteId, cursoId: est ? String(est.curso_id) : f.cursoId }));
  };

  // ── Totales para el header ──────────────────────────────────────────────────

  const totalNotas = cursos.reduce((sum, c) =>
    sum + c.estudiantes.reduce((s2, e) => s2 + e.notas.length, 0), 0);
  const totalEstudiantes = cursos.reduce((sum, c) => sum + c.estudiantes.length, 0);
  const selectedCurso = cursos.find((curso) => curso.cursoId === selectedCursoId) ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenShell contentStyle={styles.shell}>
      <View style={styles.contentStack}>

      {/* Header */}
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}24` }]}>
          <AcademicCapIcon width={20} height={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>Registro academico</ThemedText>
          <ThemedText style={styles.title}>Notas</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} · {totalNotas} nota{totalNotas !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <Pressable onPress={openCreate} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <PlusIcon width={16} height={16} color={theme.primaryText} />
          <ThemedText style={[styles.addBtnText, { color: theme.primaryText }]}>Nueva nota</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Filtro por período */}
      {catalog.periodos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
          <Pressable
            onPress={() => setFilterPeriodo('')}
            style={[styles.chip, { borderColor: theme.border }, !filterPeriodo && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            <ThemedText type="small" style={[styles.chipText, !filterPeriodo && { color: theme.primaryText }]}>
              Todos los periodos
            </ThemedText>
          </Pressable>
          {catalog.periodos.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setFilterPeriodo(String(p.id))}
              style={[styles.chip, { borderColor: theme.border }, filterPeriodo === String(p.id) && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              <ThemedText type="small" style={[styles.chipText, filterPeriodo === String(p.id) && { color: theme.primaryText }]}>
                {p.nombre}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Contenido */}
      {loading ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ActivityIndicator color={theme.primary} size="large" />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando notas...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView type="backgroundElement" style={styles.center}>
          <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
          <Pressable onPress={() => load()} style={[styles.outlineBtn, { borderColor: theme.border }]}>
            <ThemedText>Reintentar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <View style={styles.listContent}>
          {selectedCurso ? (
            <>
              <Pressable
                onPress={() => setSelectedCursoId(null)}
                style={[styles.backBtn, { borderColor: theme.border }]}>
                <ThemedText type="small" style={[styles.backBtnText, { color: theme.text }]}>
                  Ver salones
                </ThemedText>
              </Pressable>
              <CursoSeccion curso={selectedCurso} />
            </>
          ) : cursos.length > 0 ? (
            <View style={styles.salonGrid}>
              {cursos.map((curso) => (
                <SalonCard
                  key={curso.cursoId}
                  curso={curso}
                  onPress={() => setSelectedCursoId(curso.cursoId)}
                />
              ))}
            </View>
          ) : (
            <ThemedView type="backgroundElement" style={[styles.center, styles.emptyBox]}>
              <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
                No hay cursos activos registrados.
              </ThemedText>
            </ThemedView>
          )}
        </View>
      )}
      </View>

      {/* Modal crear / editar */}
      <NotaModal
        visible={modalVisible}
        editing={editingNota}
        form={form}
        setForm={setForm}
        catalog={catalog}
        saving={saving}
        onEstudianteChange={onEstudianteChange}
        onSave={save}
        onClose={() => setModalVisible(false)}
      />
    </ScreenShell>
  );
}

// ─── Sección por curso ────────────────────────────────────────────────────────

function SalonCard({ curso, onPress }: { curso: CursoAgrupado; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.salonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText style={[styles.salonName, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
      <ThemedText type="small" style={[styles.salonCount, { color: theme.textSecondary }]}>
        {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
      </ThemedText>
    </Pressable>
  );
}

function CursoSeccion({
  curso,
}: {
  curso: CursoAgrupado;
}) {
  const theme = useTheme();
  const asignaturas = Array.from(
    new Map(
      curso.estudiantes
        .flatMap((est) => est.notas)
        .map((nota) => [nota.asignaturaId, nota])
    ).values()
  ).sort((a, b) => a.asignatura.localeCompare(b.asignatura));
  const tableWidth = COL.estudiante + Math.max(asignaturas.length, 1) * COL.asignatura;

  return (
    <View style={styles.seccion}>
      {/* Título del curso */}
      <View style={[styles.cursoHeader, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}44` }]}>
        <ThemedText style={[styles.cursoTitulo, { color: theme.primary }]}>{curso.cursoNombre}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {curso.estudiantes.length} estudiante{curso.estudiantes.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      {curso.estudiantes.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.emptyRow, { borderColor: theme.border }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Este curso no tiene estudiantes registrados.</ThemedText>
        </ThemedView>
      ) : (
        /* Tabla con scroll horizontal en móvil */
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: tableWidth }}>
            {/* Encabezado de tabla */}
            <View style={[styles.tableHead, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Th text="Estudiante" width={COL.estudiante} />
              {asignaturas.length > 0 ? (
                asignaturas.map((asignatura) => (
                  <Th key={asignatura.asignaturaId} text={asignatura.asignatura} width={COL.asignatura} align="center" />
                ))
              ) : (
                <Th text="Sin notas" width={COL.asignatura} align="center" />
              )}
            </View>

            {/* Filas */}
            {curso.estudiantes.map((est, rowIndex) => (
              <FilaMatrizNotas
                key={est.estudianteId}
                estudiante={est}
                asignaturas={asignaturas}
                rowIndex={rowIndex}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Fila con nota ────────────────────────────────────────────────────────────

function FilaMatrizNotas({
  estudiante,
  asignaturas,
  rowIndex,
}: {
  estudiante: Estudiante;
  asignaturas: NotaFila[];
  rowIndex: number;
}) {
  const theme = useTheme();
  const bg = rowIndex % 2 === 0 ? theme.backgroundElement : `${theme.backgroundElement}cc`;
  const notasPorAsignatura = estudiante.notas.reduce<Record<number, NotaFila[]>>((acc, nota) => {
    acc[nota.asignaturaId] = [...(acc[nota.asignaturaId] ?? []), nota];
    return acc;
  }, {});

  return (
    <View style={[styles.tableRow, { backgroundColor: bg, borderColor: theme.border }]}>
      <Td width={COL.estudiante}>
        <ThemedText style={styles.cellEstudiante} numberOfLines={2}>{estudiante.estudianteNombre}</ThemedText>
      </Td>
      {asignaturas.length > 0 ? (
        asignaturas.map((asignatura) => {
          const notas = notasPorAsignatura[asignatura.asignaturaId] ?? [];
          const notaTexto = notas.map((item) => Number(item.nota).toFixed(1)).join(' / ');
          const notaColor = notas.length === 1 ? desempenoColor(notas[0].nota) : theme.text;

          return (
            <Td key={asignatura.asignaturaId} width={COL.asignatura} align="center">
              <ThemedText style={[styles.notaCell, { color: notaTexto ? notaColor : theme.textSecondary }]}>
                {notaTexto || '-'}
              </ThemedText>
            </Td>
          );
        })
      ) : (
        <Td width={COL.asignatura} align="center">
          <ThemedText style={[styles.notaCell, { color: theme.textSecondary }]}>-</ThemedText>
        </Td>
      )}
    </View>
  );
}

// ─── Fila sin nota ────────────────────────────────────────────────────────────

// ─── Helpers de tabla ─────────────────────────────────────────────────────────

function Th({ text, width, align = 'left' }: { text: string; width: number; align?: 'left' | 'center' }) {
  const theme = useTheme();
  return (
    <View style={[styles.th, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      <ThemedText type="small" style={[styles.thText, { color: theme.textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

function Td({ children, width, align = 'left' }: { children: React.ReactNode; width: number; align?: 'left' | 'center' }) {
  return (
    <View style={[styles.td, { width, alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
      {children}
    </View>
  );
}

// ─── Modal de crear / editar ──────────────────────────────────────────────────

function NotaModal({
  visible, editing, form, setForm, catalog, saving,
  onEstudianteChange, onSave, onClose,
}: {
  visible: boolean;
  editing: (NotaFila & { estudianteId: number }) | null;
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  catalog: Catalog;
  saving: boolean;
  onEstudianteChange: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: theme.border }]}>
          <ThemedText style={styles.modalTitle}>{editing ? 'Editar nota' : 'Registrar nota'}</ThemedText>

          <SelectField
            label="Estudiante *"
            value={form.estudianteId}
            options={catalog.estudiantes.map((e) => ({ value: String(e.id), label: `${e.nombre} (${e.curso_nombre})` }))}
            onSelect={onEstudianteChange}
          />
          <SelectField
            label="Asignatura *"
            value={form.asignaturaId}
            options={catalog.asignaturas.map((a) => ({ value: String(a.id), label: a.nombre }))}
            onSelect={(v) => setForm((f) => ({ ...f, asignaturaId: v }))}
          />
          <SelectField
            label="Profesor *"
            value={form.profesorId}
            options={catalog.profesores.map((p) => ({ value: String(p.id), label: p.nombre }))}
            onSelect={(v) => setForm((f) => ({ ...f, profesorId: v }))}
          />
          <SelectField
            label="Periodo academico *"
            value={form.periodoId}
            options={catalog.periodos.map((p) => ({ value: String(p.id), label: p.nombre }))}
            onSelect={(v) => setForm((f) => ({ ...f, periodoId: v }))}
          />

          <View style={styles.field}>
            <ThemedText type="small" style={styles.fieldLabel}>Nota * (0.00 – 5.00)</ThemedText>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(v) => setForm((f) => ({ ...f, nota: v }))}
              placeholder="Ej. 4.5"
              placeholderTextColor={theme.textSecondary}
              style={[styles.fieldInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted }]}
              value={form.nota}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={styles.fieldLabel}>Observacion (opcional)</ThemedText>
            <TextInput
              multiline
              numberOfLines={2}
              onChangeText={(v) => setForm((f) => ({ ...f, observacion: v }))}
              placeholder="Comentario sobre el desempeno..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.fieldInput, styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceMuted }]}
              value={form.observacion}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable disabled={saving} onPress={onClose} style={[styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText>Cancelar</ThemedText>
            </Pressable>
            <Pressable disabled={saving} onPress={onSave} style={[styles.outlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              {saving
                ? <ActivityIndicator color={theme.primaryText} />
                : <ThemedText style={{ color: theme.primaryText }}>Guardar</ThemedText>}
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

// ─── Select con dropdown ──────────────────────────────────────────────────────

function SelectField({
  label, value, options, onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>{label}</ThemedText>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[styles.fieldInput, styles.selectTrigger, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
        <ThemedText style={{ color: selected ? theme.text : theme.textSecondary, flex: 1 }} numberOfLines={1}>
          {selected?.label ?? 'Seleccionar...'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>▾</ThemedText>
      </Pressable>
      {open && (
        <ThemedView type="backgroundElement" style={[styles.dropdown, { borderColor: theme.border }]}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => { onSelect(o.value); setOpen(false); }}
                style={[styles.dropdownItem, o.value === value && { backgroundColor: `${theme.primary}22` }]}>
                <ThemedText type="small" style={{ color: theme.text }}>{o.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
  contentStack: { gap: Spacing.two },
  hero: {
    borderWidth: 1, borderRadius: 8, padding: Spacing.three,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
  },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.two, paddingVertical: 8, borderRadius: 6, flexShrink: 0 },
  addBtnText: { fontWeight: '600', fontSize: 13 },
  chipScroll: { height: 38, maxHeight: 38, flexGrow: 0, flexShrink: 0 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 2 },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontWeight: '500', fontSize: 12 },
  center: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  listContent: { gap: Spacing.two, paddingBottom: Spacing.five },
  emptyBox: { borderRadius: 8, padding: Spacing.four },
  salonGrid: { gap: Spacing.two },
  salonCard: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  salonName: { fontSize: 16, fontWeight: '700' },
  salonCount: { fontWeight: '600' },
  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontWeight: '600' },

  // Sección por curso
  seccion: { gap: 0 },
  cursoHeader: {
    borderWidth: 1, borderRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cursoTitulo: { fontSize: 15, fontWeight: '700' },
  emptyRow: {
    borderWidth: 1, borderTopWidth: 0, borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    padding: Spacing.two, alignItems: 'center',
  },

  // Tabla
  tableHead: {
    flexDirection: 'row', borderWidth: 1, borderTopWidth: 0,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: 'row', borderWidth: 1, borderTopWidth: 0,
    paddingVertical: 7,
  },
  rowFirst: {},
  rowLast: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  th: { paddingHorizontal: 8, justifyContent: 'center' },
  thText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { paddingHorizontal: 8, justifyContent: 'center' },
  cellEstudiante: { fontWeight: '600', fontSize: 13 },
  continuationMark: { width: 16, height: 1, backgroundColor: 'rgba(0,0,0,0.12)', marginLeft: 4 },
  notaCell: { fontSize: 15, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 5 },
  iconBtn: { width: 28, height: 28, borderWidth: 1, borderColor: '#C0C8D0', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { width: 28, height: 28, borderWidth: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  modal: { width: '100%', maxWidth: 520, borderWidth: 1, borderRadius: 10, padding: Spacing.four, gap: Spacing.two },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  field: { gap: 4 },
  fieldLabel: { opacity: 0.68 },
  fieldInput: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, justifyContent: 'center' },
  selectTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdown: { borderWidth: 1, borderRadius: 6, marginTop: 2, zIndex: 99 },
  dropdownItem: { paddingHorizontal: Spacing.two, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  textarea: { minHeight: 68, textAlignVertical: 'top', paddingTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: 4 },
  outlineBtn: { minHeight: 40, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
