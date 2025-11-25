let currentRole: string | null = null;

export function setRole(role: string) {
  currentRole = role;
}

export function getRole(): string | null {
  return currentRole;
}
