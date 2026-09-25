/**
 * A hatched fill: fine light lines cut across a solid hue.
 *
 * <p>⚠️ This way round, not the other. The first version drew bold stripes of
 * the series colour over a pale wash of it, which reads as two tones fighting
 * and makes the mark look lighter than the value it stands for. Ruling a solid
 * fill keeps the hue at full strength — the colour still says which series it
 * is, and the texture sits on top of it.
 *
 * <p>White rather than a darker step of the hue, because the series sit in the
 * mid-tones in both modes, so one translucent white works against all of them
 * without a per-colour ramp.
 *
 * <p>A gradient rather than an SVG `<pattern>`, because it takes a CSS custom
 * property directly and so follows a token without a definition per hue.
 *
 * <p>Shared by the revenue chart and the brand split — the two places with
 * hatched marks — so the texture cannot drift between them.
 *
 * @param color  any CSS colour, including a `var(--token)`.
 * @param line   how thick one rule is, in px.
 * @param pitch  centre-to-centre spacing between rules, in px. Scale both with
 *               the mark: a 10px legend swatch needs a finer hatch than a 28px
 *               bar, or it fills in and reads as a flat lighter colour.
 */
export function hatch(color: string, { line = 1.5, pitch = 7 }: { line?: number; pitch?: number } = {}): string {
  return [
    `repeating-linear-gradient(45deg, ${HATCH_INK} 0 ${line}px, transparent ${line}px ${pitch}px)`,
    `linear-gradient(${color}, ${color})`,
  ].join(", ");
}

/**
 * The colour of the rules themselves.
 *
 * <p>Exported because the gauge cannot use {@link hatch} — an SVG fill takes a
 * `<pattern>`, not a CSS gradient — so it draws its own rules and has to be
 * given the same ink. One constant, so the two cannot drift apart.
 *
 * <p>20%, down from 30%. At the heavier weight the texture was competing with
 * the hue for attention: on a small mark the white was reading as a lighter
 * shade of the series rather than as a pattern over it, which is the failure
 * this hatch was drawn the current way round to avoid.
 */
export const HATCH_INK = "rgb(255 255 255 / 20%)";
