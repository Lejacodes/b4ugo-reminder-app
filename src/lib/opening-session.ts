type Listener = () => void;

let enteredThisSession = false;
const listeners = new Set<Listener>();

export function hasEnteredOpeningSession(): boolean {
  return enteredThisSession;
}

export function markOpeningEntered(): void {
  enteredThisSession = true;
  listeners.forEach((listener) => listener());
}

export function subscribeOpeningSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
