const storageKey = (roomCode: string) =>
  `category-game:${roomCode.toUpperCase()}:playerId`;

function write(storage: Storage, roomCode: string, playerId: string) {
  storage.setItem(storageKey(roomCode), playerId);
}

function read(storage: Storage, roomCode: string) {
  return storage.getItem(storageKey(roomCode));
}

export function savePlayerId(roomCode: string, playerId: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    write(window.sessionStorage, roomCode, playerId);
  } catch {
    // Private mode can block sessionStorage.
  }
  try {
    write(window.localStorage, roomCode, playerId);
  } catch {
    // Private mode can block localStorage.
  }
}

export function getPlayerId(roomCode: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const fromSession = read(window.sessionStorage, roomCode);
    if (fromSession) {
      return fromSession;
    }
  } catch {
    // Ignore unavailable sessionStorage.
  }
  try {
    return read(window.localStorage, roomCode);
  } catch {
    return null;
  }
}

export function auctionPath(roomCode: string, playerId?: string | null) {
  const code = roomCode.trim().toUpperCase();
  if (!playerId) {
    return `/auction/${code}`;
  }
  return `/auction/${code}?player=${encodeURIComponent(playerId)}`;
}
