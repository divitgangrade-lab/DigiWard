import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './TargetCursor.css';

/**
 * Cursor-target animation adapted from React Bits' TargetCursor.
 *
 * It is deliberately additive: the native cursor is never hidden, so the
 * reticle cannot become the only pointer affordance. It only mounts for a fine
 * pointer, never for touch or prefers-reduced-motion, and its rAF loop stops
 * when the springs settle instead of spinning forever.
 */

export interface TargetCursorProps {
  targetSelector?: string;
  color?: string;
  targetColor?: string;
  size?: number;
  cornerSize?: number;
  thickness?: number;
  padding?: number;
  dotSize?: number;
  hoverDuration?: number;
}

interface Spring {
  x: number;
  v: number;
}

const stepSpring = (state: Spring, goal: number, stiffness: number, damping: number, dt: number) => {
  const steps = 2;
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    state.v += (stiffness * (goal - state.x) - damping * state.v) * h;
    state.x += state.v * h;
  }
};

const CORNER_ANGLES = [0, 90, 180, 270];

export function TargetCursor({
  targetSelector = 'a[href], button',
  color = 'var(--accent)',
  targetColor = 'var(--ink)',
  size = 30,
  cornerSize = 10,
  thickness = 1.5,
  padding = 5,
  dotSize = 3,
  hoverDuration = 0.18,
}: TargetCursorProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHost(!reduced && fine.matches ? document.body : null);
    update();
    fine.addEventListener('change', update);
    return () => fine.removeEventListener('change', update);
  }, [reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!host || !root) return undefined;

    const pointer = { x: 0, y: 0, inside: false, pressed: false };
    const centerX = { x: 0, v: 0 };
    const centerY = { x: 0, v: 0 };
    const halfW = { x: size / 2, v: 0 };
    const halfH = { x: size / 2, v: 0 };
    const lock = { x: 0, v: 0 };
    const press = { x: 0, v: 0 };
    const presence = { x: 0, v: 0 };
    let target: Element | null = null;
    let raf = 0;
    let last = 0;
    let currentColor = '';

    const findTarget = (x: number, y: number): Element | null => {
      const element = document.elementFromPoint(x, y);
      return element?.closest(targetSelector) ?? null;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last === 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
      last = now;

      if (target && !target.isConnected) target = null;
      const rect = target?.getBoundingClientRect() ?? null;
      const locked = rect !== null && pointer.inside;
      const snapW = 4.6 / Math.max(0.05, hoverDuration);
      const snapK = snapW * snapW;
      const snapC = 2 * 0.62 * snapW;

      stepSpring(presence, pointer.inside ? 1 : 0, 260, 32, dt);
      stepSpring(lock, locked ? 1 : 0, snapK, snapC, dt);
      stepSpring(press, pointer.pressed ? 1 : 0, 900, 40, dt);

      const goalX = rect && locked ? rect.left + rect.width / 2 : pointer.x;
      const goalY = rect && locked ? rect.top + rect.height / 2 : pointer.y;
      const goalW = rect && locked ? rect.width / 2 + padding : size / 2;
      const goalH = rect && locked ? rect.height / 2 + padding : size / 2;

      stepSpring(centerX, goalX, locked ? snapK : 2200, locked ? snapC : 94, dt);
      stepSpring(centerY, goalY, locked ? snapK : 2200, locked ? snapC : 94, dt);
      stepSpring(halfW, goalW, snapK, snapC, dt);
      stepSpring(halfH, goalH, snapK, snapC, dt);

      const squeeze = 1 - press.x * 0.12;
      const w = Math.max(0, halfW.x) * squeeze;
      const h = Math.max(0, halfH.x) * squeeze;
      const local: [number, number][] = [
        [-w, -h],
        [w, -h],
        [w, h],
        [-w, h],
      ];
      const degrees = 0;
      cornerRefs.current.forEach((corner, index) => {
        if (!corner) return;
        const point = local[index];
        if (!point) return;
        const [lx, ly] = point;
        corner.style.transform = `translate3d(${(centerX.x + lx).toFixed(2)}px, ${(centerY.x + ly).toFixed(2)}px, 0) rotate(${(CORNER_ANGLES[index] ?? 0) + degrees}deg)`;
        corner.style.width = `${cornerSize}px`;
        corner.style.height = `${cornerSize}px`;
        corner.style.borderWidth = `${thickness}px 0 0 ${thickness}px`;
      });

      if (dotRef.current) {
        const dotScale = 1 - press.x * 0.3;
        dotRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(${dotScale.toFixed(3)})`;
        dotRef.current.style.width = `${dotSize}px`;
        dotRef.current.style.height = `${dotSize}px`;
      }

      const nextColor = locked ? targetColor : color;
      if (nextColor !== currentColor) {
        root.style.setProperty('--target-cursor-color', nextColor);
        currentColor = nextColor;
      }
      root.style.opacity = Math.max(0, Math.min(1, presence.x)).toFixed(3);

      const resting =
        !pointer.inside &&
        Math.abs(presence.x) < 0.002 &&
        Math.abs(presence.v) < 0.002 &&
        Math.abs(lock.x) < 0.002 &&
        Math.abs(press.x) < 0.002;
      const moving =
        Math.abs(centerX.v) + Math.abs(centerY.v) + Math.abs(halfW.v) + Math.abs(halfH.v) > 0.02 ||
        Math.abs(lock.v) + Math.abs(press.v) + Math.abs(presence.v) > 0.001;
      if (!resting && moving) {
        raf = requestAnimationFrame(frame);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (raf === 0 && !reduced) raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      target = findTarget(event.clientX, event.clientY);
      wake();
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer.pressed = true;
      wake();
    };
    const onUp = () => {
      pointer.pressed = false;
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.pressed = false;
      target = null;
      wake();
    };
    const onScroll = () => {
      if (pointer.inside) {
        target = findTarget(pointer.x, pointer.y);
        wake();
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [host, color, targetColor, size, cornerSize, thickness, padding, dotSize, hoverDuration, targetSelector, reduced]);

  if (!host || reduced) return null;

  return createPortal(
    <div ref={rootRef} className="target-cursor" aria-hidden="true">
      {CORNER_ANGLES.map((angle, index) => (
        <span
          key={angle}
          ref={(element) => {
            cornerRefs.current[index] = element;
          }}
          className="target-cursor__corner"
        />
      ))}
      <span ref={dotRef} className="target-cursor__dot" />
    </div>,
    host,
  );
}

export default TargetCursor;
