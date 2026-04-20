import { useState, useEffect, useRef, useCallback } from "react";

const PLANETS = [
  {
    id: 1, name: "Zorbax", color: "#FF6B35", glow: "#FF4500",
    size: 38, orbitRadius: 130, speed: 0.008, startAngle: 0.5,
    emoji: "😱", rings: false, moons: 1,
    gradient: ["#FF6B35", "#FF4500", "#CC2200"],
  },
  {
    id: 2, name: "Crystalia", color: "#00D4FF", glow: "#00AAFF",
    size: 28, orbitRadius: 200, speed: 0.005, startAngle: 2.1,
    emoji: "🤪", rings: true, moons: 0,
    gradient: ["#00D4FF", "#0099CC", "#005577"],
  },
  {
    id: 3, name: "Verdura", color: "#44FF88", glow: "#00CC55",
    size: 44, orbitRadius: 280, speed: 0.003, startAngle: 4.2,
    emoji: "😜", rings: false, moons: 2,
    gradient: ["#44FF88", "#22CC55", "#009933"],
  },
  {
    id: 4, name: "Purplius", color: "#BB44FF", glow: "#9900FF",
    size: 22, orbitRadius: 350, speed: 0.006, startAngle: 1.0,
    emoji: "🙃", rings: true, moons: 0,
    gradient: ["#BB44FF", "#9933CC", "#660099"],
  },
  {
    id: 5, name: "Flamara", color: "#FFD700", glow: "#FFAA00",
    size: 32, orbitRadius: 420, speed: 0.004, startAngle: 3.7,
    emoji: "😤", rings: false, moons: 1,
    gradient: ["#FFD700", "#FFA500", "#CC6600"],
  },
  {
    id: 6, name: "Iceborg", color: "#AADDFF", glow: "#88BBFF",
    size: 26, orbitRadius: 490, speed: 0.002, startAngle: 5.5,
    emoji: "🥴", rings: true, moons: 3,
    gradient: ["#AADDFF", "#7799CC", "#445599"],
  },
];

const STAR_COUNT = 280;
const NEBULA_COLORS = ["#1a0533", "#0d1a3a", "#001a2e", "#1a0a00"];
const FLEE_RADIUS = 90;
const FLEE_SPEED = 18;
const FLEE_DURATION = 1800;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: randomBetween(0, 100),
    y: randomBetween(0, 100),
    size: randomBetween(0.5, 2.8),
    opacity: randomBetween(0.3, 1),
    twinkleDelay: randomBetween(0, 5),
    twinkleDuration: randomBetween(2, 5),
  }));
}

function generateNebulae() {
  return Array.from({ length: 7 }, (_, i) => ({
    id: i,
    x: randomBetween(5, 95),
    y: randomBetween(5, 95),
    rx: randomBetween(80, 220),
    ry: randomBetween(60, 160),
    color: NEBULA_COLORS[i % NEBULA_COLORS.length],
    opacity: randomBetween(0.08, 0.22),
    rotation: randomBetween(0, 360),
  }));
}

const STARS = generateStars();
const NEBULAE = generateNebulae();

export default function GalaxyApp() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    angles: Object.fromEntries(PLANETS.map(p => [p.id, p.startAngle])),
    planetPos: {},
    fleeing: {},
    mouse: { x: -9999, y: -9999 },
    animFrame: null,
  });
  const [tooltip, setTooltip] = useState(null);
  const [fleeEmoji, setFleeEmoji] = useState(null);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const s = stateRef.current;

    // Background
    ctx.clearRect(0, 0, W, H);
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, "#0a0015");
    bgGrad.addColorStop(0.4, "#050010");
    bgGrad.addColorStop(1, "#000008");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Nebulae
    NEBULAE.forEach(n => {
      ctx.save();
      ctx.translate(n.x / 100 * W, n.y / 100 * H);
      ctx.rotate((n.rotation * Math.PI) / 180);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
      const hex = n.color;
      g.addColorStop(0, hex + "55");
      g.addColorStop(1, hex + "00");
      ctx.globalAlpha = n.opacity;
      ctx.beginPath();
      ctx.ellipse(0, 0, n.rx, n.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Stars
    const now = Date.now() / 1000;
    STARS.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin((now + star.twinkleDelay) / star.twinkleDuration * Math.PI * 2);
      ctx.globalAlpha = star.opacity * (0.6 + 0.4 * twinkle);
      ctx.beginPath();
      ctx.arc(star.x / 100 * W, star.y / 100 * H, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${200 + star.id % 80}, 60%, 90%)`;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Sun
    const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    sunGlow.addColorStop(0, "#FFFDE0");
    sunGlow.addColorStop(0.2, "#FFE066");
    sunGlow.addColorStop(0.5, "#FF8800");
    sunGlow.addColorStop(0.8, "#FF440044");
    sunGlow.addColorStop(1, "#FF000000");
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fillStyle = sunGlow;
    ctx.fill();
    // Sun core
    const core = ctx.createRadialGradient(cx - 8, cy - 8, 0, cx, cy, 36);
    core.addColorStop(0, "#FFFFFF");
    core.addColorStop(0.4, "#FFE88A");
    core.addColorStop(1, "#FFAA00");
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
    // Sun corona pulse
    ctx.save();
    const coronaScale = 1 + 0.04 * Math.sin(now * 2);
    ctx.translate(cx, cy);
    ctx.scale(coronaScale, coronaScale);
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,220,80,0.3)";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Orbit paths
    PLANETS.forEach(p => {
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, p.orbitRadius, p.orbitRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${p.color}22`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Planets
    PLANETS.forEach(p => {
      const flee = s.fleeing[p.id];
      let px, py;

      if (flee) {
        const elapsed = Date.now() - flee.startTime;
        const t = Math.min(elapsed / FLEE_DURATION, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - t, 3);
        px = flee.startX + flee.vx * eased * FLEE_SPEED * 8;
        py = flee.startY + flee.vy * eased * FLEE_SPEED * 8;
        // Wobble
        px += Math.sin(elapsed / 80) * 18 * (1 - eased);
        py += Math.cos(elapsed / 60) * 12 * (1 - eased);
        if (t >= 1) {
          delete s.fleeing[p.id];
        }
      } else {
        s.angles[p.id] += p.speed;
        const angle = s.angles[p.id];
        px = cx + p.orbitRadius * Math.cos(angle);
        py = cy + p.orbitRadius * 0.35 * Math.sin(angle);
      }

      s.planetPos[p.id] = { x: px, y: py };

      ctx.save();

      // Planet glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
      glow.addColorStop(0, p.glow + "66");
      glow.addColorStop(1, p.glow + "00");
      ctx.beginPath();
      ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Rings (before planet)
      if (p.rings) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 6);
        ctx.scale(1, 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.9, p.size * 1.9, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color + "88";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
      }

      // Planet body
      const grad = ctx.createRadialGradient(px - p.size * 0.3, py - p.size * 0.3, 0, px, py, p.size);
      grad.addColorStop(0, p.gradient[0]);
      grad.addColorStop(0.5, p.gradient[1]);
      grad.addColorStop(1, p.gradient[2]);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Surface swirls
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 3; i++) {
        const sx = px + (i - 1) * p.size * 0.5;
        const sy = py + (i % 2 === 0 ? -1 : 1) * p.size * 0.3;
        ctx.beginPath();
        ctx.ellipse(sx, sy, p.size * 0.4, p.size * 0.15, Math.PI / 4 + i, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Moon(s)
      if (p.moons > 0) {
        for (let m = 0; m < p.moons; m++) {
          const moonAngle = now * (1.5 + m * 0.7) + m * 2.1;
          const moonDist = p.size + 14 + m * 10;
          const mx = px + moonDist * Math.cos(moonAngle);
          const my = py + moonDist * 0.5 * Math.sin(moonAngle);
          ctx.beginPath();
          ctx.arc(mx, my, 4 + m, 0, Math.PI * 2);
          ctx.fillStyle = "#cccccc";
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    });

    s.animFrame = requestAnimationFrame(drawScene);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    stateRef.current.animFrame = requestAnimationFrame(drawScene);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, [drawScene]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = stateRef.current;
    s.mouse = { x: mx, y: my };

    let hovered = null;
    PLANETS.forEach(p => {
      const pos = s.planetPos[p.id];
      if (!pos) return;
      const dx = mx - pos.x;
      const dy = my - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < FLEE_RADIUS && !s.fleeing[p.id]) {
        // Flee!
        const angle = Math.atan2(pos.y - my, pos.x - mx);
        s.fleeing[p.id] = {
          startX: pos.x,
          startY: pos.y,
          vx: Math.cos(angle) + (Math.random() - 0.5) * 0.8,
          vy: Math.sin(angle) + (Math.random() - 0.5) * 0.8,
          startTime: Date.now(),
        };
        setFleeEmoji({ id: p.id, emoji: p.emoji, x: pos.x, y: pos.y, name: p.name });
        setTimeout(() => setFleeEmoji(null), 900);
      }
      if (dist < p.size + 10) {
        hovered = p;
      }
    });
    setTooltip(hovered ? { ...hovered, x: mx, y: my } : null);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "#000008", position: "relative", cursor: "crosshair",
      fontFamily: "'Orbitron', 'Courier New', monospace",
    }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes floatEmoji {
          0% { opacity: 1; transform: translateY(0) scale(1.5); }
          100% { opacity: 0; transform: translateY(-80px) scale(2.5); }
        }
        @keyframes pulseTitle {
          0%, 100% { text-shadow: 0 0 20px #8844FF, 0 0 40px #4422AA; }
          50% { text-shadow: 0 0 40px #BB66FF, 0 0 80px #6633CC; }
        }
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Title */}
      <div style={{
        position: "absolute", top: 28, left: 0, right: 0,
        textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{
          fontSize: "clamp(18px, 3vw, 36px)",
          fontWeight: 900,
          color: "#E0CCFF",
          letterSpacing: "0.25em",
          animation: "pulseTitle 3s ease-in-out infinite",
          textTransform: "uppercase",
        }}>
          ✦ Cosmic Chaos ✦
        </div>
        <div style={{
          fontSize: "clamp(10px, 1.2vw, 14px)",
          color: "#886699",
          letterSpacing: "0.4em",
          marginTop: 6,
        }}>
          MOVE NEAR A PLANET TO SCARE IT AWAY
        </div>
      </div>

      {/* Planet legend */}
      <div style={{
        position: "absolute", bottom: 24, left: 24,
        display: "flex", flexDirection: "column", gap: 6,
        pointerEvents: "none",
      }}>
        {PLANETS.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            color: p.color, fontSize: 11, letterSpacing: "0.12em",
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 6px ${p.glow}`,
            }} />
            {p.name.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x + 20,
          top: tooltip.y - 40,
          background: "rgba(0,0,0,0.85)",
          border: `1px solid ${tooltip.color}`,
          borderRadius: 8,
          padding: "8px 14px",
          color: tooltip.color,
          fontSize: 13,
          letterSpacing: "0.1em",
          pointerEvents: "none",
          boxShadow: `0 0 16px ${tooltip.glow}55`,
          whiteSpace: "nowrap",
        }}>
          <div style={{ fontWeight: 700 }}>{tooltip.name}</div>
          <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>
            {tooltip.rings ? "⭕ Ringed · " : ""}{tooltip.moons > 0 ? `🌙 ${tooltip.moons} moon${tooltip.moons > 1 ? "s" : ""}` : "No moons"}
          </div>
        </div>
      )}

      {/* Flee emoji popup */}
      {fleeEmoji && (
        <div style={{
          position: "absolute",
          left: fleeEmoji.x - 20,
          top: fleeEmoji.y - 20,
          fontSize: 38,
          pointerEvents: "none",
          animation: "floatEmoji 0.9s ease-out forwards",
          zIndex: 10,
        }}>
          {fleeEmoji.emoji}
        </div>
      )}

      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
      }} />
    </div>
  );
}