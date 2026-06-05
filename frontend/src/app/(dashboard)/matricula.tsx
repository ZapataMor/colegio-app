import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import AcademicCapIcon from 'react-native-heroicons/outline/AcademicCapIcon';
import ArrowLeftIcon from 'react-native-heroicons/outline/ArrowLeftIcon';
import CalendarDaysIcon from 'react-native-heroicons/outline/CalendarDaysIcon';
import ClipboardDocumentListIcon from 'react-native-heroicons/outline/ClipboardDocumentListIcon';
import FunnelIcon from 'react-native-heroicons/outline/FunnelIcon';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import PlusIcon from 'react-native-heroicons/outline/PlusIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UserIcon from 'react-native-heroicons/outline/UserIcon';
import BuildingOffice2Icon from 'react-native-heroicons/outline/BuildingOffice2Icon';

import { FormField } from '@/components/crud/FormField';
import { OptionChips } from '@/components/crud/OptionChips';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';

type Curso = { id: number; nombre: string; nivel?: string; jornada?: string };
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
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : 'Error al cargar matriculas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroAnio]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const activas = matriculas.filter((matricula) => matricula.estado === 'activa').length;
    return {
      total: matriculas.length,
      activas,
      cursos: cursos.length,
    };
  }, [matriculas, cursos.length]);

  const openCreate = () => {
    if (estudiantes.length === 0) {
      Alert.alert('Sin estudiantes', 'Primero registra estudiantes en el modulo correspondiente.');
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
      Alert.alert('Validacion', 'Estudiante, curso y ano son obligatorios.');
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

  const handleDelete = (matricula: Matricula) => {
    Alert.alert(
      'Eliminar matricula',
      `¿Eliminar matricula de ${matricula.estudiante_nombres} ${matricula.estudiante_apellidos} (${matricula.anio})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/matriculas/${matricula.id}`, { method: 'DELETE' });
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
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={styles.hero}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(dashboard)/dashboard')}>
            <ArrowLeftIcon width={18} height={18} color="#F5F4F0" />
          </Pressable>
          <View style={styles.heroTitleBlock}>
            <ThemedText type="small" style={styles.kicker}>
              Matriculas
            </ThemedText>
            <ThemedText type="title" style={styles.heroTitle}>
              Gestion academica
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Controla inscripciones, filtros y acciones clave desde una vista mas limpia.
            </ThemedText>
          </View>
          <Pressable onPress={openCreate} style={styles.addButton}>
            <PlusIcon width={16} height={16} color="#101010" />
            <ThemedText style={styles.addButtonText}>Nueva</ThemedText>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard icon={ClipboardDocumentListIcon} label="Matriculas" value={metrics.total} />
          <MetricCard icon={AcademicCapIcon} label="Activas" value={metrics.activas} />
          <MetricCard icon={BuildingOffice2Icon} label="Cursos" value={metrics.cursos} />
        </View>
      </View>

      <ThemedView type="backgroundElement" style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitle}>
            <FunnelIcon width={16} height={16} color="#F5B342" />
            <ThemedText type="subtitle" style={styles.filterLabel}>
              Filtrar por ano
            </ThemedText>
          </View>
          <ThemedText type="small" style={styles.filterHint}>
            Vista rapida y responsive
          </ThemedText>
        </View>
        <OptionChips
          label=""
          options={aniosFiltro}
          value={filtroAnio}
          onChange={(anio) => {
            setLoading(true);
            setFiltroAnio(anio);
          }}
        />
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" color="#F5B342" style={styles.loader} />
      ) : error ? (
        <ThemedView type="backgroundElement" style={styles.emptyState}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
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
            <ThemedView type="backgroundElement" style={styles.emptyState}>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No hay matriculas
              </ThemedText>
              <ThemedText style={styles.emptyDescription}>
                {filtroAnio ? `No se encontraron registros para ${filtroAnio}.` : 'Aun no hay registros.'}
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => {
            const estadoEsActivo = item.estado === 'activa';
            return (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <UserIcon width={20} height={20} color="#F5B342" />
                  </View>
                  <View style={styles.cardHeading}>
                    <ThemedText type="subtitle" style={styles.cardName}>
                      {item.estudiante_nombres} {item.estudiante_apellidos}
                    </ThemedText>
                    <ThemedText type="small" style={styles.cardMeta}>
                      Documento {item.estudiante_documento}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusPill, estadoEsActivo ? styles.statusActive : styles.statusOther]}>
                    <ThemedText style={[styles.statusText, estadoEsActivo ? styles.statusTextActive : styles.statusTextOther]}>
                      {item.estado}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <DetailChip
                    icon={CalendarDaysIcon}
                    label="Ano"
                    value={String(item.anio)}
                  />
                  <DetailChip
                    icon={BuildingOffice2Icon}
                    label="Curso"
                    value={`${item.curso_nombre} · ${item.curso_jornada}`}
                  />
                  <DetailChip
                    icon={ClipboardDocumentListIcon}
                    label="Nivel"
                    value={item.curso_nivel}
                  />
                </View>

                <View style={styles.actions}>
                  <Pressable onPress={() => openEdit(item)} style={({ pressed }) => [styles.actionButton, styles.editButton, pressed && styles.pressed]}>
                    <PencilSquareIcon width={16} height={16} color="#1D4ED8" />
                    <ThemedText style={styles.editText}>Editar</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.pressed]}>
                    <TrashIcon width={16} height={16} color="#DC2626" />
                    <ThemedText style={styles.deleteText}>Eliminar</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIcon}>
                  <ClipboardDocumentListIcon width={18} height={18} color="#F5B342" />
                </View>
                <View>
                  <ThemedText type="small" style={styles.kicker}>
                    Matricula
                  </ThemedText>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {editing ? 'Editar matricula' : 'Nueva matricula'}
                  </ThemedText>
                </View>
              </View>
            </View>

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
                label="Ano"
                value={form.anio}
                onChangeText={(anio) => setForm((f) => ({ ...f, anio }))}
                keyboardType="numeric"
                placeholder="2026"
              />
              {editing ? (
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
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [styles.modalButton, styles.cancelBtn, pressed && styles.pressed]}
                disabled={saving}>
                <ThemedText style={styles.cancelBtnText}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.modalButton, styles.saveBtn, pressed && styles.pressed]}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#101010" />
                ) : (
                  <ThemedText style={styles.saveBtnText}>Guardar</ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ScreenShell>
  );
}

type IconType = ComponentType<{ width?: number; height?: number; color?: string }>;

function MetricCard({ icon: Icon, label, value }: { icon: IconType; label: string; value: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Icon width={18} height={18} color="#F5B342" />
      </View>
      <ThemedText type="small" style={styles.metricLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </ThemedView>
  );
}

function DetailChip({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <View style={styles.detailChip}>
      <View style={styles.detailIcon}>
        <Icon width={14} height={14} color="#A7B0C0" />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="small" style={styles.detailLabel}>
          {label}
        </ThemedText>
        <ThemedText style={styles.detailValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    gap: Spacing.three,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#232936',
    gap: Spacing.three,
  },
  heroGlowA: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.12,
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -60,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#F5B342',
    opacity: 0.08,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTitleBlock: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: '#F5B342',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#F5F4F0',
  },
  heroSubtitle: {
    color: 'rgba(245, 244, 240, 0.72)',
    lineHeight: 20,
    maxWidth: 540,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5B342',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  addButtonText: {
    color: '#101010',
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    zIndex: 1,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: 4,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 179, 66, 0.12)',
    marginBottom: 2,
  },
  metricLabel: {
    color: '#A7B0C0',
    fontWeight: '700',
  },
  metricValue: {
    color: '#F5F4F0',
    fontSize: 20,
    fontWeight: '800',
  },
  filterCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#232936',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  filterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    color: '#F5F4F0',
  },
  filterHint: {
    color: '#A7B0C0',
  },
  loader: {
    marginTop: Spacing.five,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#232936',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 179, 66, 0.12)',
  },
  cardHeading: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    color: '#F5F4F0',
  },
  cardMeta: {
    color: '#A7B0C0',
  },
  statusPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.14)',
  },
  statusOther: {
    backgroundColor: 'rgba(217, 119, 6, 0.14)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#22C55E',
  },
  statusTextOther: {
    color: '#F59E0B',
  },
  detailGrid: {
    gap: Spacing.two,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#2A3344',
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 176, 192, 0.08)',
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    color: '#A7B0C0',
    fontWeight: '700',
  },
  detailValue: {
    color: '#F5F4F0',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  editButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  editText: {
    color: '#60A5FA',
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  deleteText: {
    color: '#F87171',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
  emptyState: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F5F4F0',
  },
  emptyDescription: {
    color: '#A7B0C0',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: '#F87171',
    textAlign: 'center',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '92%',
    padding: Spacing.four,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: Spacing.three,
  },
  modalHeader: {
    paddingBottom: Spacing.two,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 179, 66, 0.12)',
  },
  modalTitle: {
    color: '#F5F4F0',
  },
  form: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Spacing.two,
  },
  cancelBtn: {
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#2A3344',
  },
  cancelBtnText: {
    color: '#D4D9E2',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#F5B342',
  },
  saveBtnText: {
    color: '#101010',
    fontWeight: '900',
  },
});
