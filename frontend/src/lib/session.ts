export type UserSession = {
  id: number;
  personaId?: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  roles?: string[];
  welcomeMessage?: string;
  token?: string;
};

let userSessionGlobal: UserSession | null = null;

export function setUserSession(session: UserSession | null) {
  userSessionGlobal = session;

  if (typeof window !== 'undefined') {
    if (session) {
      window.localStorage.setItem('userSession', JSON.stringify(session));
    } else {
      window.localStorage.removeItem('userSession');
    }
  }
}

export function getUserSession(): UserSession | null {
  if (typeof window !== 'undefined' && !userSessionGlobal) {
    const stored = window.localStorage.getItem('userSession');
    if (stored) {
      userSessionGlobal = JSON.parse(stored) as UserSession;
    }
  }

  return userSessionGlobal;
}
