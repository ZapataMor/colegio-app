import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import PencilSquareIcon from 'react-native-heroicons/outline/PencilSquareIcon';
import TrashIcon from 'react-native-heroicons/outline/TrashIcon';
import UsersIcon from 'react-native-heroicons/outline/UsersIcon';
import ShieldCheckIcon from 'react-native-heroicons/outline/ShieldCheckIcon';

import { ErrorState, SkeletonList } from '@/components/crud/FeedbackStates';
import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { SearchBar } from '@/components/crud/SearchBar';
import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

type Rol = { id: number; nombre: string };
type PersonaDisponible = {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  telefono: string | null;
};
type Usuario = {
  id: number;
  persona_id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  documento: string;
  telefono: string | null;
  tipo_documento?: string;
  estado: string;
  rol: string;
  roles: string;
  rol_id?: number;
};

const TIPOS_USUARIO = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'acudiente', label: 'Acudiente' },
];

const TIPOS_DOC = [
  { value: 'CC', label: 'CC' },
  { value: 'TI', label: 'TI' },
  { value: 'CE', label: 'CE' },
  { value: 'PP', label: 'PP' },
  { value: 'RC', label: 'RC' },
];

const ESTADOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'bloqueado', label: 'Bloqueado' },
];

const FILTRO_ESTADO = [
  { value: '', label: 'Todos' },
  ...ESTADOS_CUENTA,
];

const FILTRO_ROL = [{ value: '', label: 'Todos los roles' }, ...TIPOS_USUARIO];

const emptyCreate = {
  tipoRol: 'profesor',
  personaId: '',
  contrasena: '',
};

const emptyEdit = {
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  documento: '',
  tipoDocumento: 'CC',
  tipoRol: '',
  estado: 'activo',
  contrasena: '',
  confirmarContrasena: '',
};

function getInitials(nombres: string, apellidos: string) {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function RoleBadge({ rol }: { rol: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    administrador: { bg: '#EDE9FE', text: '#6D28D9' },
    profesor: { bg: '#DBEAFE', text: '#1D4ED8' },
    estudiante: { bg: '#D1FAE5', text: '#047857' },
    acudiente: { bg: '#FEF3C7', text: '#B45309' },
  };
  const c = colors[rol] ?? { bg: '#F3F4F6', text: '#374151' };

  return (
    <View style={[styles.roleBadge, { backgroundColor: c.bg }]}>
      <ThemedText style={[styles.roleBadgeText, { color: c.text }]}>{rol}</ThemedText>
    </View>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const isActive = estado === 'activo';
  const isBlocked = estado === 'bloqueado';

  return (
    <View
      style={[
        styles.statusBadge,
        isActive && styles.statusActive,
        isBlocked && styles.statusBlocked,
        !isActive && !isBlocked && styles.statusInactive,
      ]}>
      <ThemedText style={styles.statusBadgeText}>{estado}</ThemedText>
    </View>
  );
}

export default function UsuariosScreen() {
  const theme = useTheme();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [personas, setPersonas] = useState<PersonaDisponible[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (busquedaDebounced) params.set('q', busquedaDebounced);
    if (filtroEstado) params.set('estado', filtroEstado);
    if (filtroRol) params.set('rol', filtroRol);
    const qs = params.toString();
    return qs ? `/api/usuarios?${qs}` : '/api/usuarios';
  }, [busquedaDebounced, filtroEstado, filtroRol]);

  const loadUsuarios = useCallback(async () => {
    try {
      setError('');
      const [usuariosRes, rolesRes] = await Promise.all([
        apiFetch<Usuario[]>(buildQuery()),
        apiFetch<Rol[]>('/api/roles'),
      ]);
      setUsuarios(usuariosRes.data ?? []);
      setRoles(rolesRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQuery]);

  const loadPersonasDisponibles = useCallback(async (tipoRol: string) => {
    setLoadingPersonas(true);
    try {
      const res = await apiFetch<PersonaDisponible[]>(
        `/api/personas/disponibles-usuario?rol=${encodeURIComponent(tipoRol)}`
      );
      const lista = res.data ?? [];
      setPersonas(lista);
      setCreateForm((f) => ({ ...f, personaId: lista[0] ? String(lista[0].id) : '' }));
    } catch {
      setPersonas([]);
      setCreateForm((f) => ({ ...f, personaId: '' }));
    } finally {
      setLoadingPersonas(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    if (modalVisible && !editing) {
      loadPersonasDisponibles(createForm.tipoRol);
    }
  }, [modalVisible, editing, createForm.tipoRol, loadPersonasDisponibles]);

  const stats = useMemo(() => {
    const activos = usuarios.filter((u) => u.estado === 'activo').length;
    return { total: usuarios.length, activos };
  }, [usuarios]);

  const openCreate = () => {
    setEditing(null);
    setCreateForm(emptyCreate);
    setModalVisible(true);
  };

  const openEdit = (usuario: Usuario) => {
    setEditing(usuario);
    setEditForm({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      documento: usuario.documento,
      tipoDocumento: usuario.tipo_documento ?? 'CC',
      tipoRol: usuario.rol || TIPOS_USUARIO[0].value,
      estado: usuario.estado,
      contrasena: '',
      confirmarContrasena: '',
    });
    setModalVisible(true);
  };

  const getRolIdByNombre = (nombre: string) => roles.find((r) => r.nombre === nombre)?.id;

  const handleSave = async () => {
    if (editing) {
      if (editForm.contrasena && editForm.contrasena !== editForm.confirmarContrasena) {
        Alert.alert('Validación', 'Las contraseñas no coinciden.');
        return;
      }

      const rolId = getRolIdByNombre(editForm.tipoRol);
      if (!rolId) {
        Alert.alert('Validación', 'Selecciona un rol válido.');
        return;
      }

      setSaving(true);
      try {
        const body: Record<string, unknown> = {
          nombres: editForm.nombres.trim(),
          apellidos: editForm.apellidos.trim(),
          correo: editForm.correo.trim(),
          telefono: editForm.telefono.trim() || null,
          documento: editForm.documento.trim(),
          tipoDocumento: editForm.tipoDocumento,
          estado: editForm.estado,
          rolId,
        };
        if (editForm.contrasena.trim()) {
          body.contrasena = editForm.contrasena;
        }

        await apiFetch(`/api/usuarios/${editing.id}`, { method: 'PUT', body });
        setModalVisible(false);
        await loadUsuarios();
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const rolId = getRolIdByNombre(createForm.tipoRol);
    if (!rolId || !createForm.personaId || !createForm.contrasena.trim()) {
      Alert.alert('Validación', 'Selecciona tipo, persona y contraseña.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/usuarios', {
        method: 'POST',
        body: {
          personaId: Number(createForm.personaId),
          rolId,
          contrasena: createForm.contrasena,
        },
      });
      setModalVisible(false);
      await loadUsuarios();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (usuario: Usuario) => {
    Alert.alert(
      'Eliminar acceso',
      `¿Quitar el acceso de ${usuario.nombres} ${usuario.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/usuarios/${usuario.id}`, { method: 'DELETE' });
              await loadUsuarios();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  const renderUserCard = ({ item }: { item: Usuario }) => {
    const rolesList = (item.roles || item.rol || '')
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    return (
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: `${theme.primary}24` }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
            {getInitials(item.nombres, item.apellidos)}
          </ThemedText>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <ThemedText type="subtitle" style={[styles.cardName, { color: theme.text }]}>
              {item.nombres} {item.apellidos}
            </ThemedText>
            <StatusBadge estado={item.estado} />
          </View>
          <ThemedText type="small" style={[styles.cardEmail, { color: theme.textSecondary }]}>
            {item.correo}
          </ThemedText>
          <ThemedText type="small" style={[styles.cardMeta, { color: theme.textSecondary }]}>
            {item.tipo_documento ?? 'CC'} {item.documento}
            {item.telefono ? ` · ${item.telefono}` : ''}
          </ThemedText>
          <View style={styles.rolesRow}>
            {rolesList.map((r) => (
              <RoleBadge key={r} rol={r} />
            ))}
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            onPress={() => openEdit(item)}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <PencilSquareIcon width={18} height={18} color={theme.primary} />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <TrashIcon width={18} height={18} color={theme.danger} />
          </Pressable>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <ModuleHeader title="Usuarios" onAdd={openCreate} addLabel="+ Acceso" />

          <ThemedText type="small" style={[styles.helpText, { color: theme.textSecondary }]}>
            Administra accesos al sistema. Cada usuario está vinculado a una persona registrada.
          </ThemedText>

          <View style={styles.statsRow}>
            <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
              <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total
              </ThemedText>
              <ThemedText type="title" style={[styles.statValue, { color: theme.text }]}>
                {stats.total}
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: theme.border }]}>
              <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
                Activos
              </ThemedText>
              <ThemedText type="title" style={[styles.statValue, { color: theme.accent }]}>
                {stats.activos}
              </ThemedText>
            </ThemedView>
          </View>

          <SearchBar value={busqueda} onChangeText={setBusqueda} />

          <View style={styles.filtersBlock}>
            <ThemedText type="small" style={[styles.filterLabel, { color: theme.textSecondary }]}>
              Estado
            </ThemedText>
            <OptionChips
              label=""
              options={FILTRO_ESTADO}
              value={filtroEstado}
              onChange={setFiltroEstado}
            />
            <ThemedText
              type="small"
              style={[styles.filterLabel, styles.filterLabelSpaced, { color: theme.textSecondary }]}>
              Rol
            </ThemedText>
            <OptionChips label="" options={FILTRO_ROL} value={filtroRol} onChange={setFiltroRol} />
          </View>

          {loading ? (
            <SkeletonList variant="compact" />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setLoading(true);
                loadUsuarios();
              }}
            />
          ) : (
            <FlatList
              data={usuarios}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderUserCard}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadUsuarios();
                  }}
                />
              }
              ListEmptyComponent={
                <ThemedView type="backgroundElement" style={styles.emptyBox}>
                  <ThemedText style={styles.emptyText}>
                    No se encontraron usuarios con los filtros aplicados.
                  </ThemedText>
                </ThemedView>
              }
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ThemedView style={[styles.modalContent, { borderColor: theme.border }]}>
              <ThemedText type="title" style={[styles.modalTitle, { color: theme.text }]}>
                {editing ? 'Editar usuario' : 'Nuevo acceso'}
              </ThemedText>

              <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                {editing ? (
                  <>
                    <ThemedText style={styles.sectionTitle}>Datos personales</ThemedText>
                    <View style={styles.formRow}>
                      <View style={styles.formHalf}>
                        <FormField
                          label="Nombres"
                          value={editForm.nombres}
                          onChangeText={(nombres) => setEditForm((f) => ({ ...f, nombres }))}
                        />
                      </View>
                      <View style={styles.formHalf}>
                        <FormField
                          label="Apellidos"
                          value={editForm.apellidos}
                          onChangeText={(apellidos) => setEditForm((f) => ({ ...f, apellidos }))}
                        />
                      </View>
                    </View>
                    <FormField
                      label="Correo (login)"
                      value={editForm.correo}
                      onChangeText={(correo) => setEditForm((f) => ({ ...f, correo }))}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <FormField
                      label="Teléfono"
                      value={editForm.telefono}
                      onChangeText={(telefono) => setEditForm((f) => ({ ...f, telefono }))}
                      keyboardType="phone-pad"
                    />
                    <OptionChips
                      label="Tipo documento"
                      options={TIPOS_DOC}
                      value={editForm.tipoDocumento}
                      onChange={(tipoDocumento) => setEditForm((f) => ({ ...f, tipoDocumento }))}
                    />
                    <FormField
                      label="Número de documento"
                      value={editForm.documento}
                      onChangeText={(documento) => setEditForm((f) => ({ ...f, documento }))}
                    />

                    <ThemedText style={styles.sectionTitle}>Acceso al sistema</ThemedText>
                    <OptionChips
                      label="Rol principal"
                      options={TIPOS_USUARIO}
                      value={editForm.tipoRol}
                      onChange={(tipoRol) => setEditForm((f) => ({ ...f, tipoRol }))}
                    />
                    <OptionChips
                      label="Estado de la cuenta"
                      options={ESTADOS_CUENTA}
                      value={editForm.estado}
                      onChange={(estado) => setEditForm((f) => ({ ...f, estado }))}
                    />

                    <ThemedText style={styles.sectionTitle}>Cambiar contraseña</ThemedText>
                    <ThemedText type="small" style={styles.hint}>
                      Deja en blanco si no deseas cambiarla.
                    </ThemedText>
                    <FormField
                      label="Nueva contraseña"
                      value={editForm.contrasena}
                      onChangeText={(contrasena) => setEditForm((f) => ({ ...f, contrasena }))}
                      secureTextEntry
                      placeholder="Mínimo 6 caracteres"
                    />
                    <FormField
                      label="Confirmar contraseña"
                      value={editForm.confirmarContrasena}
                      onChangeText={(confirmarContrasena) =>
                        setEditForm((f) => ({ ...f, confirmarContrasena }))
                      }
                      secureTextEntry
                    />
                  </>
                ) : (
                  <>
                    <OptionChips
                      label="Tipo de usuario"
                      options={TIPOS_USUARIO}
                      value={createForm.tipoRol}
                      onChange={(tipoRol) =>
                        setCreateForm((f) => ({ ...f, tipoRol, personaId: '' }))
                      }
                    />
                    {loadingPersonas ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : personas.length === 0 ? (
                      <ThemedView type="backgroundElement" style={styles.noPersonas}>
                        <ThemedText type="small" style={styles.hint}>
                          No hay personas disponibles. Regístrala en el módulo correspondiente con
                          correo.
                        </ThemedText>
                      </ThemedView>
                    ) : (
                      <OptionChips
                        label="Persona"
                        options={personas.map((p) => ({
                          value: String(p.id),
                          label: `${p.apellidos}, ${p.nombres}`,
                        }))}
                        value={createForm.personaId}
                        onChange={(personaId) => setCreateForm((f) => ({ ...f, personaId }))}
                      />
                    )}
                    <FormField
                      label="Contraseña inicial"
                      value={createForm.contrasena}
                      onChangeText={(contrasena) => setCreateForm((f) => ({ ...f, contrasena }))}
                      secureTextEntry
                      placeholder="Mínimo 6 caracteres"
                    />
                  </>
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
                  style={[
                    styles.saveBtn,
                    { backgroundColor: theme.primary },
                    !editing && (!createForm.personaId || personas.length === 0) && styles.saveDisabled,
                  ]}
                  disabled={saving || (!editing && (!createForm.personaId || personas.length === 0))}>
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
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  helpText: { opacity: 0.65, marginBottom: Spacing.three, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
    borderWidth: 1,
  },
  statLabel: { opacity: 0.6, textTransform: 'uppercase', fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 28 },
  statValueGreen: { color: '#22C55E' },
  filtersBlock: {
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  filterLabel: { fontWeight: '700', opacity: 0.7, marginLeft: Spacing.one },
  filterLabelSpaced: { marginTop: Spacing.two },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    ...(Platform.OS === 'web' ? { paddingBottom: 80 } : {}),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      },
      default: {},
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: 16 },
  cardBody: { flex: 1, gap: 4, minWidth: 0 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  cardName: { flexShrink: 1, fontSize: 16 },
  cardEmail: { opacity: 0.85 },
  cardMeta: { opacity: 0.55, fontSize: 12 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: 'rgba(22,163,74,0.14)' },
  statusInactive: { backgroundColor: 'rgba(220,38,38,0.14)' },
  statusBlocked: { backgroundColor: 'rgba(217,119,6,0.14)' },
  statusBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', gap: Spacing.two },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnEdit: {},
  iconBtnEditText: { fontSize: 18, color: '#79D0F2' },
  iconBtnDelete: {},
  iconBtnDeleteText: { fontSize: 16 },
  pressed: { opacity: 0.7 },
  emptyBox: {
    padding: Spacing.five,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
  },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.four },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 14,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
    opacity: 0.85,
  },
  formRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Spacing.three,
  },
  formHalf: { flex: 1 },
  hint: { opacity: 0.65, lineHeight: 18 },
  noPersonas: { padding: Spacing.three, borderRadius: Spacing.two },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(121, 208, 242, 0.22)',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '700' },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  saveDisabled: { opacity: 0.45 },
  saveBtnText: { fontWeight: '800' },
});
