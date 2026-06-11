import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { getUserSession } from '@/lib/session';

type MeData = { estudianteId: number | null; cursoNombre: string | null };

type Asistencia = {
  id: number;
  fecha: string;
  estado_asistencia: string;
  observacion: string | null;
  asignatura_nombre: string;
  profesor_nombre: string;
  curso_nombre: string;
};

const estadoColor = (e: string) => {
  if (e === 'presente') return '#8FBF26';
  if (e === 'ausente') return '#F25C5C';
  if (e === 'excusa') return '#E8A020';
  return '#A0A8B2';
};

const FILTROS = [
  { label: 'Todos', value: '' },
  { label: 'Presente', value: 'presente' },
  { label: 'Ausente', value: 'ausente' },
  { label: 'Excusa', value: 'excusa' },
  { label: 'Tardanza', value: 'tardanza' },
];

export default function MisAsistenciasScreen() {
  const theme = useTheme();
  const session = getUserSession();
  const [me, setMe] = useState<MeData | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const meRes = await apiFetch<MeData>('/api/me');
      const meData = meRes.data ?? null;
      setMe(meData);

      if (!meData?.estudianteId) { setLoading(false); return; }

      const params = new URLSearchParams({ estudianteId: String(meData.estudianteId), limit: '100' });
      if (filtro) params.set('estadoAsistencia', filtro);
      const res = await apiFetch<Asistencia[]>(`/api/asistencias?${params}`);
      setAsistencias(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asistencias.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { load(); }, [load]);

  const resumen = asistencias.reduce(
    (acc, a) => { acc[a.estado_asistencia] = (acc[a.estado_asistencia] || 0) + 1; acc.total += 1; return acc; },
    { presente: 0, ausente: 0, excusa: 0, tardanza: 0, total: 0 } as Record<string, number>
  );

  if (loading) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>Cargando asistencias...</ThemedText>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>
        <Pressable onPress={load} style={[styles.btn, { borderColor: theme.border }]}>
          <ThemedText>Reintentar</ThemedText>
        </Pressable>
      </ScreenShell>
    );
  }

  if (!me?.estudianteId) {
    return (
      <ScreenShell contentStyle={styles.center}>
        <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
          Tu cuenta no tiene un perfil de estudiante asociado.{'\n'}Contacta al administrador.
        </ThemedText>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell contentStyle={styles.shell}>
      <ThemedView type="backgroundElement" style={[styles.hero, { borderColor: theme.border }]}>
        <ThemedText type="small" style={[styles.kicker, { color: theme.accent }]}>Mi historial</ThemedText>
        <ThemedText style={styles.title}>Mis asistencias</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {session?.nombre} · {me.cursoNombre}
        </ThemedText>
      </ThemedView>

      {/* Resumen */}
      <View style={styles.metricsRow}>
        <StatBox label="Total" value={resumen.total} />
        <StatBox label="Presentes" value={resumen.presente} color="#8FBF26" />
        <StatBox label="Ausentes" value={resumen.ausente} color="#F25C5C" />
        <StatBox label="Excusas" value={resumen.excusa} color="#E8A020" />
        <StatBox label="Tardanzas" value={resumen.tardanza} color="#A0A8B2" />
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {FILTROS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFiltro(f.value)}
            style={[styles.chip, filtro === f.value && { backgroundColor: theme.primary }]}>
            <ThemedText type="small" style={[styles.chipText, filtro === f.value && { color: theme.primaryText }]}>
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {asistencias.length === 0 ? (
        <ThemedView type="backgroundElement" style={[styles.emptyBox, { borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
            No hay registros de asistencia.
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {asistencias.map((a) => (
            <ThemedView key={a.id} type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <View style={[styles.estadoBar, { backgroundColor: estadoColor(a.estado_asistencia) }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <ThemedText style={styles.asignatura}>{a.asignatura_nombre}</ThemedText>
                  <View style={[styles.badge, { backgroundColor: `${estadoColor(a.estado_asistencia)}22` }]}>
                    <ThemedText type="small" style={[styles.badgeText, { color: estadoColor(a.estado_asistencia) }]}>
                      {a.estado_asistencia}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {a.fecha?.slice(0, 10)} · Prof. {a.profesor_nombre}
                </ThemedText>
                {a.observacion ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                    {a.observacion}
                  </ThemedText>
                ) : null}
              </View>
            </ThemedView>
          ))}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.statBox}>
      <ThemedText style={[styles.statNum, { color: color ?? theme.text }]}>{value}</ThemedText>
      <ThemedText type="small" style={{ opacity: 0.65 }}>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  shell: { gap: Spacing.two },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  hero: { borderWidth: 1, borderRadius: 8, padding: Spacing.three, gap: 4 },
  kicker: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statBox: { flex: 1, minWidth: 64, padding: Spacing.two, borderRadius: 6, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: 4 },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#C0C8D0' },
  chipText: { fontWeight: '500', fontSize: 12 },
  list: { gap: Spacing.two, paddingBottom: Spacing.five },
  card: { borderWidth: 1, borderRadius: 8, flexDirection: 'row', overflow: 'hidden' },
  estadoBar: { width: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  asignatura: { fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyBox: { borderWidth: 1, borderRadius: 8, padding: Spacing.four, alignItems: 'center' },
  btn: { minHeight: 38, minWidth: 100, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
