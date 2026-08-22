import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginContent } from '@/components/opening-login/LoginContent';
import { Logo } from '@/components/opening-login/Logo';
import { PaperBall } from '@/components/opening-login/PaperBall';
import { UnfoldingPaper } from '@/components/opening-login/UnfoldingPaper';
import { openingPalette } from '@/constants/opening';
import { useOpeningStages } from '@/hooks/use-opening-stages';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

import './opening-login.css';

type OpeningLoginProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
  /** Fires when the paper sequence reaches its last beat. */
  onSequenceComplete?: () => void;
  /** When false, the paper still settles but login actions stay hidden. */
  showLogin?: boolean;
};

/**
 * First window only: logo → crumpled ball → unfold → settle → login on the paper.
 * Little Guy is not part of this scene.
 */
export function OpeningLogin({
  onCreateAccount,
  onSignIn,
  onSequenceComplete,
  showLogin = true,
}: OpeningLoginProps) {
  const reduceMotion = useReducedMotion();
  const stage = useOpeningStages(reduceMotion);

  useEffect(() => {
    if (stage === 'login') {
      onSequenceComplete?.();
    }
  }, [stage, onSequenceComplete]);

  const paperPhase =
    reduceMotion || stage === 'login' || stage === 'settle'
      ? 'settled'
      : stage === 'unfold'
        ? 'unfolding'
        : 'hidden';

  const showBall = !reduceMotion && (stage === 'ball' || stage === 'unfold');
  const ballExiting = stage === 'unfold';
  const showLoginContent = showLogin && (reduceMotion || stage === 'login');

  return (
    <SafeAreaView className="opening-desk" style={styles.desk} edges={['top', 'bottom']}>
      <View style={styles.logoSlot}>
        <Logo visible reduceMotion={reduceMotion} />
      </View>

      <View style={styles.stage}>
        <UnfoldingPaper phase={paperPhase} reduceMotion={reduceMotion}>
          <LoginContent
            visible={showLoginContent}
            reduceMotion={reduceMotion}
            onCreateAccount={onCreateAccount}
            onSignIn={onSignIn}
          />
        </UnfoldingPaper>
        <View pointerEvents="none" style={styles.ballLayer}>
          <PaperBall visible={showBall} exiting={ballExiting} reduceMotion={reduceMotion} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: openingPalette.desk,
  },
  logoSlot: {
    paddingTop: 12,
    minHeight: 64,
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
