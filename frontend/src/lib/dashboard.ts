export type Modulo = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
};

export const MODULOS_ADMIN: Modulo[] = [
  {
    id: 'matricula',
    nombre: 'Matrícula',
    descripcion: 'Gestión de matrículas de estudiantes',
    icono: '📋',
    ruta: '/(dashboard)/matricula',
  },
  {
    id: 'estudiantes',
    nombre: 'Estudiantes',
    descripcion: 'Lista y gestión de estudiantes',
    icono: '👨‍🎓',
    ruta: '/(dashboard)/estudiantes',
  },
  {
    id: 'profesores',
    nombre: 'Profesores',
    descripcion: 'Gestión de profesores y docentes',
    icono: '👨‍🏫',
    ruta: '/(dashboard)/profesores',
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Accesos al sistema por persona',
    icono: '👥',
    ruta: '/(dashboard)/usuarios',
  },
  {
    id: 'salones',
    nombre: 'Salones',
    descripcion: 'Gestión de salones y aulas',
    icono: '🏫',
    ruta: '/(dashboard)/salones',
  },
];

export const WELCOME_BY_ROLE: Record<string, { titulo: string; subtitulo: string }> = {
  administrador: {
    titulo: 'Panel de administración',
    subtitulo: 'Gestiona matrículas, personas, usuarios y recursos del colegio.',
  },
  profesor: {
    titulo: 'Hola, docente',
    subtitulo: 'Tu espacio docente estará disponible muy pronto.',
  },
  estudiante: {
    titulo: 'Hola, estudiante',
    subtitulo: 'Pronto podrás consultar tus notas y asistencias aquí.',
  },
  acudiente: {
    titulo: 'Hola, acudiente',
    subtitulo: 'Pronto podrás ver el avance académico de tus acudidos.',
  },
};

export function getWelcomeForRole(rol: string, nombre: string) {
  const config = WELCOME_BY_ROLE[rol] ?? {
    titulo: `Hola, ${nombre}`,
    subtitulo: 'Bienvenido a Colegio App.',
  };

  return {
    titulo: rol === 'administrador' ? config.titulo : `${config.titulo}, ${nombre}`,
    subtitulo: config.subtitulo,
  };
}

export function isAdmin(rol: string) {
  return rol === 'administrador';
}
