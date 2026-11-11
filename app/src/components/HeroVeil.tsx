import { Component, Suspense, lazy, type ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const DitherVeil = lazy(() => import('./DitherVeil.jsx'));

const mediaBase = `${import.meta.env.BASE_URL}media/`;
const heroSrc = `${mediaBase}hero-fold-700.webp`;
const heroSizes = '(max-width: 1120px) 100vw, 40vw';
const avifSrcSet = [360, 540, 700]
  .map((width) => `${mediaBase}hero-fold-${width}.avif ${width}w`)
  .join(', ');
const webpSrcSet = [360, 540, 700]
  .map((width) => `${mediaBase}hero-fold-${width}.webp ${width}w`)
  .join(', ');

const StaticFold = () => (
  <picture>
    <source type="image/avif" srcSet={avifSrcSet} sizes={heroSizes} />
    <source type="image/webp" srcSet={webpSrcSet} sizes={heroSizes} />
    <img
      className="hero__fold-image"
      src={`${mediaBase}hero-fold.png`}
      alt=""
      width={700}
      height={855}
      decoding="async"
      fetchPriority="high"
    />
  </picture>
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
