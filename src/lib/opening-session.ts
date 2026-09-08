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

/** Call on sign-out so the next login can play the paper unfold again. */
export function clearOpeningSession(): void {
  enteredThisSession = false;
  listeners.forEach((listener) => listener());
}

export function subscribeOpeningSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
