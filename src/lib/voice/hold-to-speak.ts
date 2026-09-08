/**
 * Optional speech recognition for hold-to-speak.
 *
 * Never import `expo-speech-recognition` — its JS entry calls
 * `requireNativeModule`, which crashes Expo Go. Probe the native
 * module with `requireOptionalNativeModule` instead.
 */
import { requireOptionalNativeModule } from 'expo';

export type SpeechRecognitionHandle = {
  start: (onResult: (text: string, isFinal: boolean) => void, onError: (message: string) => void) => Promise<void>;
  stop: () => Promise<void>;
};

type NativeSpeech = {
  requestPermissionsAsync?: () => Promise<{ granted?: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  addListener: (event: string, listener: (event: unknown) => void) => { remove: () => void };
};

function loadNativeSpeech(): NativeSpeech | null {
  try {
    const native = requireOptionalNativeModule<NativeSpeech>('ExpoSpeechRecognition');
    if (!native?.start || typeof native.start !== 'function') return null;
    return native;
  } catch {
    return null;
  }
}

export async function createHoldToSpeak(): Promise<SpeechRecognitionHandle | null> {
  const native = loadNativeSpeech();
  if (!native) return null;

  const listeners: { remove: () => void }[] = [];

  const clear = () => {
    while (listeners.length) listeners.pop()?.remove();
  };

  return {
    async start(onResult, onError) {
      clear();
      try {
        if (native.requestPermissionsAsync) {
          const permission = await native.requestPermissionsAsync();
          if (permission && permission.granted === false) {
            onError('Microphone permission is needed to speak a reminder.');
            return;
          }
        }
        listeners.push(
          native.addListener('result', (event) => {
            const payload = event as { results?: { transcript?: string }[]; isFinal?: boolean };
            const transcript = payload.results?.map((item) => item.transcript ?? '').join(' ').trim();
            if (transcript) onResult(transcript, payload.isFinal === true);
          }),
        );
        listeners.push(
          native.addListener('error', (event) => {
            const payload = event as { message?: string; error?: string };
            onError(payload.message ?? payload.error ?? 'Could not hear that.');
          }),
        );
        native.start({
          lang: 'en-US',
          interimResults: true,
          addsPunctuation: true,
        });
      } catch {
        onError('Voice isn’t available in this build.');
      }
    },
    async stop() {
      try {
        native.stop();
      } catch {
        // Expo Go and web have no native recognizer.
      } finally {
        clear();
      }
    },
  };
}
