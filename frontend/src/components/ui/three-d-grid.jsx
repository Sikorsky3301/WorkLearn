// A grid plane laid flat in perspective — a floor receding toward a horizon,
// used as the backdrop behind the hero headline.
//
// It's two repeating-linear-gradients on a single div, tipped with `rotateX`
// inside a `perspective` container. No canvas, no WebGL, no JS: a backdrop
// should not cost a frame budget or a bundle, and the browser rasterises this
// once. It is also completely static, so there is nothing for
// `prefers-reduced-motion` to switch off.
//
// The two masks are what keep it from reading as wallpaper:
//   - the container fades the left and right edges out, so the plane doesn't
//     collide with the section's own edges;
//   - the plane fades along its own depth: opaque across the near field,
//     gone before the horizon. The far fade is not optional — converging
//     hairlines alias into moiré at the vanishing point.
//
// Note how little of the plane's own height ends up as screen height. A point
// `h` up the plane lands at `h·cos(tilt)·P / (P + h·sin(tilt))` above the near
// edge, which tends to `P / tan(tilt)` — the horizon — no matter how tall the
// plane is. So the plane is many times the container's height (most of it
// compressed into the last few pixels before the horizon) and the mask's
// opaque band has to start at the near edge, where the cells are actually
// large enough to see. Fading in from the near edge instead, as an earlier
// version did, hides the only part of the grid that reads.
//
// Hairlines stay at a literal 1px rather than rem — a 1px rule is a 1px rule
// at any type scale, and scaling it just makes it blurry.
import { cn } from '../../lib/cn'

const SIDE_FADE = 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)'
// Just enough transparency at the very near edge to soften the seam where the
// plane meets the bottom of its container — then opaque through the near
// field, out well before the vanishing point.
const DEPTH_FADE = 'linear-gradient(to top, transparent 0%, #000 3%, #000 34%, transparent 82%)'

/**
 * Absolutely positioned by default — give it a `relative` parent and put the
 * content after it in the DOM so the content paints on top.
 *
 * @param {string}  [className]   Positioning/sizing overrides for the container.
 * @param {string}  [cell]        Grid square size. In rem so it scales with the page.
 * @param {string}  [color]       Line colour. Keep the alpha low; this sits under text.
 * @param {number}  [tilt]        Degrees the plane is tipped away from the viewer.
 * @param {string}  [perspective] Viewing distance — smaller converges harder.
 */
export const ThreeDGrid = ({
  className,
  cell = '4rem',
  color = 'rgba(49, 46, 129, 0.22)',
  tilt = 60,
  perspective = '32rem',
}) => (
  <div
    aria-hidden="true"
    className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    style={{
      perspective,
      maskImage: SIDE_FADE,
      WebkitMaskImage: SIDE_FADE,
    }}
  >
    {/* Wider than the container and overhanging it, so the plane's own edges
        are always off-screen and only the grid itself is ever visible. The
        height is depth, not screen height — see the note above. */}
    <div
      className="absolute bottom-0 left-[-50%] right-[-50%] h-[500%]"
      style={{
        transformOrigin: '50% 100%',
        transform: `rotateX(${tilt}deg)`,
        backgroundImage: `repeating-linear-gradient(to right, ${color} 0 1px, transparent 1px ${cell}),
                          repeating-linear-gradient(to bottom, ${color} 0 1px, transparent 1px ${cell})`,
        maskImage: DEPTH_FADE,
        WebkitMaskImage: DEPTH_FADE,
      }}
    />
  </div>
)
