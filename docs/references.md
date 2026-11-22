# References

No screenshots were supplied. These are the references chosen against the brief
(«тихо, дорого, футуристично», x.ai minimalism, Linear motion, Lusion / Active Theory WebGL),
with what we take from each — and what we deliberately leave out.

## x.ai

**Take:** near-total black, a single oversized headline as the whole composition, tiny UI chrome
(wordmark left, one action right), generous empty space, grey secondary text instead of extra colours.
**Apply:** hero = headline + one sentence + a hairline scroll hint. Header has two elements.
**Leave out:** nothing loud — no gradients in text, no badges.

## Linear (linear.app)

**Take:** motion precision — short travel, long expo-out easing, line-by-line masked reveals,
staggers of ~0.1 s, hairline 1px borders at low alpha, cards that feel like instruments.
**Apply:** `ui/splitText.ts` masked line reveals (`yPercent 110 → 0`, `expo.out`, 1.4–1.6 s);
tariff cards with 1px `rgba(255,255,255,.08)` borders and 16px radius; accent used only as glow.
**Leave out:** product UI screenshots (we have none and must not invent them).

## Lusion (lusion.co)

**Take:** one persistent WebGL scene behind DOM content, particles that re-form into new shapes as you
scroll, cursor as a physical force on the scene, post-processing glow kept subtle.
**Apply:** single canvas, one particle buffer with per-scene targets morphed in the vertex shader
(sphere → grid → clusters → ring → point); cursor repulsion with inertia; desktop-only bloom with
tight mip weights so black stays black.
**Leave out:** heavy physics and large textures — budget is 60 FPS and Lighthouse mobile ≥ 85.

## Active Theory (activetheory.net)

**Take:** cinematic pacing — each scroll section is a "scene" with its own state of the same world;
transitions as dissolves rather than cuts; the ending as a focused moment of light.
**Apply:** scroll-driven segments (`bindSegment`) with per-particle staggered transitions and a scatter
in the middle of each morph; the CTA collapses everything into one point that flashes.
**Leave out:** sound, loaders and intro gates — the page opens straight on the headline.

## Igloo Inc (igloo.inc)

**Take:** particle formations as narrative — structure emerging from chaos, explained by one short line.
**Apply:** the manifesto scene: the sphere dissolves into an ordered plane while «Заявки, клиенты,
деньги. Всё на своих местах.» appears line by line.
**Leave out:** the dense HUD/interface layer — it would break the quiet tone.

## Principles distilled

1. Black (#050507) is the material; light is the accent.
2. One idea per screen.
3. Motion is slow to start, precise to land (`expo.out`), and only on `transform` / `opacity`.
4. Real data only: every number on the page is derived from `src/data/tariffs.ts`.
