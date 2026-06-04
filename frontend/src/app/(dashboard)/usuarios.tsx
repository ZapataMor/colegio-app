import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { FormField } from '@/components/crud/FormField';
import { ModuleHeader } from '@/components/crud/ModuleHeader';
import { OptionChips } from '@/components/crud/OptionChips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiFetch } from '@/lib/api';

type Rol = { id: number; nombre: string };
type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  estado: string;
  rol_id: number;
  rol: string;
};

const emptyForm = {
  rolId: '',
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
  telefono: '',
  estado: 'activo',
};

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [usuariosRes, rolesRes] = await Promise.all([
        apiFetch<Usuario[]>('/api/usuarios'),
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      rolId: roles[0] ? String(roles[0].id) : '',
    });
    setModalVisible(true);
  };

  const openEdit = (usuario: Usuario) => {
    setEditing(usuario);
    setForm({
      rolId: String(usuario.rol_id),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contrasena: '',
      telefono: usuario.telefono ?? '',
      estado: usuario.estado,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      Alert.alert('Validación', 'Nombre y apellido son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/usuarios/${editing.id}`, {
          method: 'PUT',
          body: {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            telefono: form.telefono.trim() || null,
            estado: form.estado,
          },
        });
      } else {
        if (!form.correo.trim() || !form.contrasena.trim() || !form.rolId) {
          Alert.alert('Validación', 'Rol, correo y contraseña son obligatorios al crear.');
          setSaving(false);
          return;
        }
        await apiFetch('/api/usuarios', {
          method: 'POST',
          body: {
            rolId: Number(form.rolId),
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            correo: form.correo.trim(),
            contrasena: form.contrasena,
            telefono: form.telefono.trim() || null,
          },
        });
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (usuario: Usuario) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${usuario.nombre} ${usuario.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/usuarios/${usuario.id}`, { method: 'DELETE' });
              await loadData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ModuleHeader title="Usuarios" onAdd={openCreate} />

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : (
          <FlatList
            data={usuarios}
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
              <ThemedText style={styles.emptyText}>No hay usuarios registrados.</ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle">
                    {item.nombre} {item.apellido}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={item.estado === 'activo' ? styles.badgeActive : styles.badgeInactive}>
                    {item.estado}
                  </ThemedText>
                </View>
                <ThemedText type="small">{item.correo}</ThemedText>
                <ThemedText type="small" style={styles.muted}>
                  Rol: {item.rol}
                </ThemedText>
                <View style={styles.actions}>
                  <Pressable onPress={() => openEdit(item)} style={styles.editBtn}>
                    <ThemedText style={styles.editBtnText}>Editar</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <ThemedText style={styles.deleteBtnText}>Eliminar</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="title" style={styles.modalTitle}>
                {editing ? 'Editar usuario' : 'Nuevo usuario'}
              </ThemedText>
              <ScrollView contentContainerStyle={styles.form}>
                {!editing && (
                  <>
                    <OptionChips
                      label="Rol"
                      options={roles.map((r) => ({ value: String(r.id), label: r.nombre }))}
                      value={form.rolId}
                      onChange={(rolId) => setForm((f) => ({ ...f, rolId }))}
                    />
                    <FormField
                      label="Correo"
                      value={form.correo}
                      onChangeText={(correo) => setForm((f) => ({ ...f, correo }))}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="correo@colegio.com"
                    />
                    <FormField
                      label="Contraseña"
                      value={form.contrasena}
                      onChangeText={(contrasena) => setForm((f) => ({ ...f, contrasena }))}
                      secureTextEntry
                      placeholder="Mínimo 6 caracteres"
                    />
                  </>
                )}
                <FormField
                  label="Nombre"
                  value={form.nombre}
                  onChangeText={(nombre) => setForm((f) => ({ ...f, nombre }))}
                />
                <FormField
                  label="Apellido"
                  value={form.apellido}
                  onChangeText={(apellido) => setForm((f) => ({ ...f, apellido }))}
                />
                <FormField
                  label="Teléfono"
                  value={form.telefono}
                  onChangeText={(telefono) => setForm((f) => ({ ...f, telefono }))}
                  keyboardType="phone-pad"
                />
                {editing && (
                  <OptionChips
                    label="Estado"
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                    ]}
                    value={form.estado}
                    onChange={(estado) => setForm((f) => ({ ...f, estado }))}
                  />
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.cancelBtn}
                  disabled={saving}>
                  <ThemedText>Cancelar</ThemedText>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.saveBtnText}>Guardar</ThemedText>
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
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  loader: { marginTop: Spacing.five },
  list: { gap: Spacing.three, paddingBottom: Spacing.five },
  card: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { opacity: 0.65 },
  badgeActive: { color: '#16A34A', fontWeight: '700' },
  badgeInactive: { color: '#DC2626', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  editBtn: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
  },
  editBtnText: { color: '#2563EB', fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#DC2626', fontWeight: '700' },
  emptyText: { textAlign: 'center', opacity: 0.6, marginTop: Spacing.five },
  errorText: { color: '#DC2626', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    padding: Spacing.four,
  },
  modalTitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three, paddingBottom: Spacing.three },
  modalActions: { flexDirection: 'row', gap: Spacing.two },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#2563EB',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
