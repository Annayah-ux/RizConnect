export type User = {
  email: string
  name: string
}

const STORAGE_KEY = 'rizconnect.session'
const SESSION_DAYS = 7

/** Compte de démonstration — à remplacer par un vrai appel API plus tard. */
const DEMO_ACCOUNT = {
  email: 'demo@rizconnect.app',
  password: 'demo1234',
  name: 'Utilisateur démo',
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

function readSession(storage: Storage): User | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as { user: User; expiresAt: number }
    if (Date.now() > stored.expiresAt) {
      storage.removeItem(STORAGE_KEY)
      return null
    }
    return stored.user
  } catch {
    return null
  }
}

/** Lit la session persistée (onglet en cours, puis stockage durable). */
export function getSession(): User | null {
  return readSession(sessionStorage) ?? readSession(localStorage)
}

/**
 * Mock de connexion : simule un appel réseau puis valide les identifiants.
 * Lance une Error avec un message affichable en cas d'échec.
 *
 * `remember` conserve la session après la fermeture du navigateur ;
 * sinon elle ne dure que le temps de l'onglet.
 */
export function login(
  email: string,
  password: string,
  remember = true,
): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (
        email.toLowerCase() !== DEMO_ACCOUNT.email ||
        password !== DEMO_ACCOUNT.password
      ) {
        reject(new Error('Adresse e-mail ou mot de passe incorrect.'))
        return
      }

      const user: User = { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name }
      const payload = JSON.stringify({
        user,
        expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
      })

      clearSession()
      try {
        const storage = remember ? localStorage : sessionStorage
        storage.setItem(STORAGE_KEY, payload)
      } catch {
        // Stockage indisponible (navigation privée, quota…) : la session
        // reste utilisable en mémoire pour cette visite.
      }

      resolve(user)
    }, 600)
  })
}

export function logout(): void {
  clearSession()
}

export const DEMO_CREDENTIALS = {
  email: DEMO_ACCOUNT.email,
  password: DEMO_ACCOUNT.password,
}
