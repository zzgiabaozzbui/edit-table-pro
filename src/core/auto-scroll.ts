/**
 * Speed (px per frame) for edge auto-scroll during drags.
 * Positive = scroll down, negative = scroll up, 0 = no scrolling.
 * Accelerates linearly as the pointer gets closer to the edge.
 */
export function computeEdgeScrollSpeed(
  clientY: number,
  viewportTop: number,
  viewportBottom: number,
  edge = 40,
  maxSpeed = 14,
): number {
  const fromTop = clientY - viewportTop;
  const fromBottom = viewportBottom - clientY;
  if (fromTop >= 0 && fromTop < edge)
    return -Math.round(maxSpeed * (1 - fromTop / edge));
  if (fromBottom >= 0 && fromBottom < edge)
    return Math.round(maxSpeed * (1 - fromBottom / edge));
  return 0;
}
