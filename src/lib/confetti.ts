"use client";

/** One-shot confetti burst for the confirmation screen. */
export function confettiOnce() {
  if (typeof document === "undefined") return;
  const colors = ["#9fe870", "#163300", "#38c8ff", "#ffc091", "#ffd11a"];
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  c.width = innerWidth;
  c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  if (!ctx) { c.remove(); return; }
  const N = 120;
  const parts = Array.from({ length: N }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.3,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 4,
    r: 4 + Math.random() * 6,
    col: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * 6,
  }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.vy += 0.5; p.x += p.vx; p.y += p.vy; p.rot += 0.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); ctx.restore();
    });
    f++;
    if (f < 110) requestAnimationFrame(tick); else c.remove();
  })();
}
