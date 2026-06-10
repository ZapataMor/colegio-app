import { useCallback, useEffect, useMemo, useState } from 'react';
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
import MegaphoneIcon from 'react-native-heroicons/outline/MegaphoneIcon';

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

type Notice = {
  id: number;
  titulo: string;
  resumen: string | null;
  contenido: string;
  prioridad: string;
  audiencia: string;
  curso_id: number | null;
  curso_nombre: string | null;
  publicado_por_nombre: string | null;
  fecha_publicacion: string;
  estado: string;
};

type Catalog = {
  cursos: { id: number; nombre: string }[];
};

const emptyForm = {
  titulo: '',
  resumen: '',
  contenido: '',
  prioridad: 'media',
  audiencia: 'todos',
  cursoId: '',
  estado: 'publicado',
};

export default function ComunicadosScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const canManage = session?.rol === 'administrador' || session?.rol === 'profesor';
  const [items, setItems] = useState<Notice[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ cursos: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedAudience, setSelectedAudience] = useState(session?.rol ?? 'todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const query = new URLSearchParams();
      if (selectedAudience && selectedAudience !== 'todos') query.set('audiencia', selectedAudience);
      query.set('estado', 'publicado');
      query.set('limit', '30');
      const qs = `?${query.toString()}`;
      const [itemsRes, catalogRes] = await Promise.all([
        apiFetch<Notice[]>(`/api/comunicados${qs}`),
        apiFetch<Catalog>('/api/comunicados/catalogo'),
      ]);
      setItems(itemsRes.data ?? []);
      setCatalog(catalogRes.data ?? { cursos: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los comunicados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAudience]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const urgentes = items.filter((item) => item.prioridad === 'urgente').length;
    const porCurso = items.filter((item) => item.curso_id).length;
    return { total: items.length, urgentes, porCurso };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (item: Notice) => {
    setEditing(item);
    setForm({
      titulo: item.titulo,
      resumen: item.resumen ?? '',
      contenido: item.contenido,
      prioridad: item.prioridad,
      audiencia: item.audiencia,
      cursoId: item.curso_id ? String(item.curso_id) : '',
      estado: item.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      Alert.alert('Validacion', 'Titulo y contenido son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        titulo: form.titulo.trim(),
        resumen: form.resumen.trim() || null,
        contenido: form.contenido.trim(),
        prioridad: form.prioridad,
        audiencia: form.audiencia,
        cursoId: form.cursoId ? Number(form.cursoId) : null,
        estado: form.estado,
        publicadoPorPersonaId: session?.personaId,
      };

      if (editing) {
        await apiFetch(`/api/comunicados/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/comunicados', { method: 'POST', body });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el comunicado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell contentStyle={styles.shellContent}>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroGlowA} />
        <View style={styles.heroGlowB} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.warning}1C` }]}>
            <MegaphoneIcon width={22} height={22} color={theme.warning} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="small" style={[styles.kicker, { color: theme.primary }]}>
              Comunicacion interna
            </ThemedText>
            <ThemedText type="title">Comunicados</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Muro editorial para circulares, recordatorios urgentes y mensajes segmentados por rol o curso.
            </ThemedText>
          </View>
        </View>
      </View>

      <ModuleHeader title="Muro institucional" onAdd={canManage ? openCreate : undefined} addLabel="+ Comunicado" />

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); loadData(); }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          contentContainerStyle={styles.page}>
          <View style={styles.statsGrid}>
            <StatCard label="Publicados" value={String(stats.total)} />
            <StatCard label="Urgentes" value={String(stats.urgentes)} />
            <StatCard label="Por curso" value={String(stats.porCurso)} />
          </View>

          <OptionChips
            label="Audiencia"
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'administrador', label: 'Admin' },
              { value: 'profesor', label: 'Docentes' },
              { value: 'estudiante', label: 'Estudiantes' },
              { value: 'acudiente', label: 'Acudientes' },
            ]}
            value={selectedAudience}
            onChange={setSelectedAudience}
          />

          <View style={styles.noticeList}>
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => canManage && openEdit(item)}>
                <ThemedView type="backgroundElement" style={[styles.noticeCard, { borderColor: theme.border }]}>
                  <View style={styles.noticeTop}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={[styles.noticeMeta, { color: getPriorityColor(item.prioridad, theme) }]}>
                        {item.prioridad.toUpperCase()} · {item.audiencia}
                      </ThemedText>
                      <ThemedText type="subtitle" style={styles.noticeTitle}>
                        {item.titulo}
                      </ThemedText>
                    </View>
                    {item.curso_nombre ? (
                      <View style={[styles.courseBadge, { backgroundColor: `${theme.primary}16` }]}>
                        <ThemedText type="small" style={{ color: theme.primary }}>{item.curso_nombre}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {item.resumen ? <ThemedText style={{ color: theme.textSecondary }}>{item.resumen}</ThemedText> : null}
                  <ThemedText>{item.contenido}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.fecha_publicacion.slice(0, 10)}{item.publicado_por_nombre ? ` · ${item.publicado_por_nombre}` : ''}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
            <ThemedText type="title" style={styles.modalTitle}>
              {editing ? 'Editar comunicado' : 'Nuevo comunicado'}
            </ThemedText>
            <ScrollView contentContainerStyle={styles.form}>
              <FormField label="Titulo" value={form.titulo} onChangeText={(titulo) => setForm((prev) => ({ ...prev, titulo }))} />
              <FormField label="Resumen" value={form.resumen} onChangeText={(resumen) => setForm((prev) => ({ ...prev, resumen }))} />
              <FormField
                label="Contenido"
                value={form.contenido}
                onChangeText={(contenido) => setForm((prev) => ({ ...prev, contenido }))}
                multiline
              />
              <OptionChips
                label="Prioridad"
                options={['baja', 'media', 'alta', 'urgente'].map((item) => ({ value: item, label: capitalize(item) }))}
                value={form.prioridad}
                onChange={(prioridad) => setForm((prev) => ({ ...prev, prioridad }))}
              />
              <OptionChips
                label="Audiencia"
                options={['todos', 'administrador', 'profesor', 'estudiante', 'acudiente'].map((item) => ({ value: item, label: capitalize(item) }))}
                value={form.audiencia}
                onChange={(audiencia) => setForm((prev) => ({ ...prev, audiencia }))}
              />
              <OptionChips
                label="Curso"
                options={[
                  { value: '', label: 'General' },
                  ...catalog.cursos.map((item) => ({ value: String(item.id), label: item.nombre })),
                ]}
                value={form.cursoId}
                onChange={(cursoId) => setForm((prev) => ({ ...prev, cursoId }))}
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

function StatCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
    </ThemedView>
  );
}

function getPriorityColor(priority: string, theme: ReturnType<typeof useTheme>) {
  if (priority === 'urgente') return theme.danger;
  if (priority === 'alta') return theme.warning;
  if (priority === 'media') return theme.primary;
  return theme.accent;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  shellContent: { gap: Spacing.three },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: 28, borderWidth: 1, padding: Spacing.four },
  heroGlowA: { position: 'absolute', top: -50, right: -20, width: 170, height: 170, borderRadius: 999, backgroundColor: '#C9891A', opacity: 0.15 },
  heroGlowB: { position: 'absolute', bottom: -60, left: -20, width: 140, height: 140, borderRadius: 999, backgroundColor: '#0F766E', opacity: 0.12 },
  heroTop: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  page: { gap: Spacing.three, paddingBottom: Spacing.five },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: { flex: 1, minWidth: 130, borderRadius: 20, borderWidth: 1, padding: Spacing.three },
  statValue: { fontSize: 26, fontWeight: '700', marginTop: 6 },
  noticeList: { gap: Spacing.two },
  noticeCard: { borderRadius: 24, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  noticeMeta: { fontWeight: '800', letterSpacing: 0.8 },
  noticeTitle: { fontSize: 24, lineHeight: 30 },
  courseBadge: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 6, alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 20, 29, 0.45)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: Spacing.four },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
