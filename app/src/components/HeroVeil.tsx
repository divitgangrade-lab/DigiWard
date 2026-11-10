import { Component, Suspense, lazy, type ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const DitherVeil = lazy(() => import('./DitherVeil.jsx'));

const heroSrc = `${import.meta.env.BASE_URL}media/hero-fold.png`;

const StaticFold = () => (
  <img
    className="hero__fold-image"
    src={heroSrc}
    alt=""
    width={900}
    height={1100}
    decoding="async"
  />
);

class VeilBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The React Bits DitherVeil hero from AGENTS.md, kept decorative. When the
 * visitor asks for reduced motion, or when WebGL is unavailable, the same
 * photograph renders as a plain image instead: no pointer reveal, no motion.
 */
export default function HeroVeil() {
  const reduced = useReducedMotion();

  if (reduced) {
    return <StaticFold />;
  }

  return (
    <VeilBoundary fallback={<StaticFold />}>
      <Suspense fallback={<StaticFold />}>
        <DitherVeil
          src={heroSrc}
          fit="cover"
          pattern="floyd"
          pixelSize={3}
          levels={2}
          palette="duotone"
          inkColor="#16130f"
          paperColor="#f4f1ea"
          contrast={1.08}
          brightness={0.03}
          revealRadius={170}
          softness={0.55}
          linger={0.7}
          rim={0}
          reverse={false}
          wander={false}
          clickBurst={false}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </VeilBoundary>
  );
}
