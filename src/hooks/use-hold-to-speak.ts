import { useCallback, useEffect, useRef, useState } from 'react';

import { createHoldToSpeak, type SpeechRecognitionHandle } from '@/lib/voice/hold-to-speak';

type UseHoldToSpeakOptions = {
  onTranscript: (text: string) => void;
};

export function useHoldToSpeak({ onTranscript }: UseHoldToSpeakOptions) {
  const handleRef = useRef<SpeechRecognitionHandle | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createHoldToSpeak()
      .then((handle) => {
        if (cancelled) return;
        handleRef.current = handle;
        setReady(Boolean(handle));
      })
      .catch(() => {
        if (cancelled) return;
        handleRef.current = null;
        setReady(false);
      });
    return () => {
      cancelled = true;
      void handleRef.current?.stop();
    };
  }, []);

  const onPressIn = useCallback(() => {
    setError(null);
    const handle = handleRef.current;
    if (!handle) {
      setError('Hold-to-speak needs a development build. You can still type.');
      return;
    }
    setListening(true);
    void handle.start(
      (text) => onTranscriptRef.current(text),
      (message) => {
        setListening(false);
        setError(message);
      },
    );
  }, []);

  const onPressOut = useCallback(() => {
    setListening(false);
    void handleRef.current?.stop();
  }, []);

  return { listening, error, ready, onPressIn, onPressOut };
}
