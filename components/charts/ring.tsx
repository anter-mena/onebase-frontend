"use client";

import { arc as arcGenerator } from "@visx/shape";
import { type MotionValue, motion, useTransform } from "motion/react";
import { memo, useCallback } from "react";
import { ringCssVars, useRingHover, useRingStable } from "./ring-context";
import { useEnterComplete } from "./use-enter-complete";
import { useMountProgress } from "./use-mount-progress";

function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number
): string {
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius,
  });
  return generator({ startAngle, endAngle } as unknown as null) || "";
}

export type RingLineCap = "round" | "butt";

export interface RingProps {
  index: number;
  color?: string;
  animate?: boolean;
  showGlow?: boolean;
  lineCap?: RingLineCap;
  /**
   * One Base addition: empty space, in pixels, between the coloured part and the
   * track on both sides. 0 (default) draws the track as a full circle underneath.
   */
  gap?: number;
  /**
   * One Base addition: how round the ends are, in pixels. Default: fully round
   * with `lineCap="round"` (half the ring's thickness), square with "butt".
   */
  cornerRadius?: number;
  /** One Base addition: grow the ring when the pointer is on it. Default: true. */
  hoverScale?: boolean;
}

function ringHoverScale(isHovered: boolean, isPushedOut: boolean): number {
  if (isHovered) {
    return 1.03;
  }
  if (isPushedOut) {
    return 1.02;
  }
  return 1;
}

function RingProgressPath({
  progressComplete,
  progressPath,
  animatedProgressPath,
  color,
}: {
  progressComplete: boolean;
  progressPath: string;
  animatedProgressPath: MotionValue<string>;
  color: string;
}) {
  if (progressComplete) {
    if (!progressPath) {
      return null;
    }
    return <path d={progressPath} fill={color} />;
  }
  return <motion.path d={animatedProgressPath} fill={color} />;
}

export const Ring = memo(function Ring({
  index,
  color: colorProp,
  animate = true,
  showGlow = true,
  lineCap = "round",
  gap = 0,
  cornerRadius: cornerRadiusProp,
  hoverScale: hoverScaleEnabled = true,
}: RingProps) {
  const {
    data,
    getColor,
    getRingRadii,
    startAngle,
    endAngle,
    enterTransition,
    enterStaggerScale,
    animationKey,
  } = useRingStable();
  const { hoveredIndex, setHoveredIndex } = useRingHover();

  const expandDelay = index * 0.08 * enterStaggerScale;
  const expandProgress = useMountProgress(
    enterTransition,
    expandDelay,
    `${animationKey}-expand-${index}`
  );
  const expandComplete = useEnterComplete(expandProgress);

  const progressDelay = (0.6 + index * 0.1) * enterStaggerScale;
  const progressMount = useMountProgress(
    enterTransition,
    progressDelay,
    `${animationKey}-progress-${index}`
  );
  const progressComplete = useEnterComplete(progressMount);

  const ringData = data[index];
  const progress = ringData ? ringData.value / ringData.maxValue : 0;
  const arcRange = endAngle - startAngle;

  const animatedProgressPath = useTransform(progressMount, (v) => {
    if (!ringData) {
      return "";
    }
    const currentEndAngle = startAngle + arcRange * progress * v;
    if (currentEndAngle <= startAngle + 0.01) {
      return "";
    }
    const radii = getRingRadii(index);
    const corner =
      cornerRadiusProp ??
      (lineCap === "round" ? (radii.outerRadius - radii.innerRadius) / 2 : 0);
    return generateArcPath(
      radii.innerRadius,
      radii.outerRadius,
      startAngle,
      currentEndAngle,
      corner
    );
  });

  const enterScale = useTransform(expandProgress, [0, 1], [0, 1]);

  const handleMouseEnter = useCallback(
    () => setHoveredIndex(index),
    [index, setHoveredIndex]
  );
  const handleMouseLeave = useCallback(
    () => setHoveredIndex(null),
    [setHoveredIndex]
  );

  if (!ringData) {
    return null;
  }

  const { innerRadius, outerRadius } = getRingRadii(index);
  const color = colorProp || getColor(index);

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;
  const isPushedOut = hoveredIndex !== null && hoveredIndex < index;

  const cornerRadius =
    cornerRadiusProp ??
    (lineCap === "round" ? (outerRadius - innerRadius) / 2 : 0);
  const progressEndAngle = startAngle + arcRange * progress;
  // With a gap, the track starts after the coloured part and stops before it,
  // so a clear space sits between them on both sides. The gap is turned into an
  // angle at the middle of the ring, so it is the same width whatever the value.
  const gapAngle = gap > 0 ? gap / ((innerRadius + outerRadius) / 2) : 0;
  const trackStart =
    gapAngle > 0 && progress > 0 ? progressEndAngle + gapAngle : startAngle;
  const trackEnd =
    gapAngle > 0 && progress > 0 ? endAngle - gapAngle : endAngle;
  const bgPath =
    trackEnd > trackStart
      ? generateArcPath(innerRadius, outerRadius, trackStart, trackEnd, cornerRadius)
      : "";
  const progressPath =
    progressEndAngle <= startAngle + 0.01
      ? ""
      : generateArcPath(
          innerRadius,
          outerRadius,
          startAngle,
          progressEndAngle,
          cornerRadius
        );

  const hoverScale = hoverScaleEnabled ? ringHoverScale(isHovered, isPushedOut) : 1;
  const layerOpacity = isFaded ? 0.35 : 1;
  const enterDone = !animate || (expandComplete && progressComplete);

  const groupStyle = {
    cursor: "pointer" as const,
    transformOrigin: "0px 0px",
    filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
  };

  if (enterDone) {
    return (
      <motion.g
        animate={{ scale: hoverScale, opacity: layerOpacity }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={groupStyle}
        transition={{
          scale: { type: "spring", stiffness: 400, damping: 25 },
          opacity: { duration: 0.15 },
        }}
      >
        <path d={bgPath} fill={ringCssVars.ringBackground} />
        {progressPath ? <path d={progressPath} fill={color} /> : null}
      </motion.g>
    );
  }

  if (!expandComplete) {
    return (
      <motion.g
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          ...groupStyle,
          scale: enterScale,
          opacity: layerOpacity,
        }}
      >
        <path d={bgPath} fill={ringCssVars.ringBackground} />
      </motion.g>
    );
  }

  return (
    <motion.g
      animate={{ scale: hoverScale, opacity: layerOpacity }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={groupStyle}
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 25 },
        opacity: { duration: 0.15 },
      }}
    >
      <path d={bgPath} fill={ringCssVars.ringBackground} />
      <RingProgressPath
        animatedProgressPath={animatedProgressPath}
        color={color}
        progressComplete={progressComplete}
        progressPath={progressPath}
      />
    </motion.g>
  );
});

Ring.displayName = "Ring";

export default Ring;
