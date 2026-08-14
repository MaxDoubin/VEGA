"use client";

import { useEffect, useRef, useState } from "react";

type Member = { name: string; strength: string };

// A hand-authored zigzag arc (a real constellation shape, not a physics
// simulation) -- connected star to star with thin lines, left to right.
const STAR_LAYOUT: [number, number, number][] = [
  [-2.0, 1.05, 0.1],
  [-0.95, 1.85, -0.25],
  [0.3, 0.9, 0.3],
  [1.55, 1.7, -0.15],
  [2.35, 0.5, 0.2],
];
// Deliberately below the arc, not averaged into it -- so VEGA reads as its
// own bright anchor point rather than sitting on top of a team member's star.
const CORE_POS: [number, number, number] = [0.35, -0.45, 0.7];

function glowTexture(THREE: typeof import("three")) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// A crisp four-point star flare (hot core + thin cross spikes), for a real
// twinkling-star look instead of a faceted gem or a flat glowing blob.
function starTexture(THREE: typeof import("three")) {
  const size = 128, c = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const core = ctx.createRadialGradient(c, c, 0, c, c, size * 0.16);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.55, "rgba(255,255,255,.9)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(c, c);
  for (const angle of [0, Math.PI / 2]) {
    ctx.rotate(angle === 0 ? 0 : angle);
    const spike = ctx.createLinearGradient(-c, 0, c, 0);
    spike.addColorStop(0, "rgba(255,255,255,0)");
    spike.addColorStop(0.5, "rgba(255,255,255,.75)");
    spike.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spike;
    ctx.fillRect(-c, -size * 0.018, size, size * 0.036);
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function TeamConstellation({ team, focus = 0 }: { team: Member[]; focus?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(false);
  const focusRef = useRef(focus);
  useEffect(() => { focusRef.current = focus; }, [focus]);

  useEffect(() => {
    const el = host.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;
    let stopped = false, dispose = () => {};
    void import("three").then(THREE => {
      if (stopped || !host.current) return;
      let renderer: THREE.WebGLRenderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" }); }
      catch { return; }
      setActive(true);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.6, 9.5);

      // The canvas spans the full slide, but the left ~40% is reserved for
      // the title/quote text -- so the whole rig (core + stars + lines) is
      // offset rightward as one rigid group, clear of both the copy and the
      // photo's busiest area. The camera stays centered on world origin so
      // this offset actually reads as a shift on screen.
      const SCENE_X = 3.3;
      const rig = new THREE.Group();
      rig.position.set(SCENE_X, 0.15, 0);
      scene.add(rig);

      const glow = glowTexture(THREE);
      const star = starTexture(THREE);

      // A soft, large accent-tinted glow sitting behind the whole formation,
      // like a faint nebula, so the cluster reads as one composed scene.
      const nebula = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x6bdcff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      nebula.scale.set(9, 6.5, 1);
      nebula.position.set(...CORE_POS);
      nebula.position.z -= 1.4;
      rig.add(nebula);

      const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xd8ff3e, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      coreGlow.scale.setScalar(2.9);
      coreGlow.position.set(...CORE_POS);
      rig.add(coreGlow);
      const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: star, color: 0xe8ffb0, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.scale.setScalar(1.1);
      core.position.set(...CORE_POS);
      rig.add(core);

      const starColor = new THREE.Color(0xfff2d8), starFocusColor = new THREE.Color(0xd8ff3e);
      const haloColor = new THREE.Color(0xffe6b0), haloFocusColor = new THREE.Color(0xd8ff3e);
      const nodeCores: THREE.Sprite[] = [];
      const nodeGlows: THREE.Sprite[] = [];
      const wobblePhase = STAR_LAYOUT.map(() => Math.random() * Math.PI * 2);
      const twinklePhase = STAR_LAYOUT.map(() => Math.random() * Math.PI * 2);
      for (let i = 0; i < STAR_LAYOUT.length; i++) {
        const nodeCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: star, color: starColor.clone(), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
        nodeCore.scale.setScalar(0.6);
        rig.add(nodeCore);
        nodeCores.push(nodeCore);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: haloColor.clone(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
        sprite.scale.setScalar(0.9);
        rig.add(sprite);
        nodeGlows.push(sprite);
      }

      // Connect the stars star-to-star (a real constellation line), not a
      // hub-and-spoke wheel back to a center point.
      const linkPositions = new Float32Array((STAR_LAYOUT.length - 1) * 2 * 3);
      const linkGeometry = new THREE.BufferGeometry();
      linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
      const links = new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }));
      rig.add(links);

      const dustCount = 300;
      const dustGeometry = new THREE.BufferGeometry();
      const dustArray = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustArray[i * 3] = (Math.random() - 0.5) * 24;
        dustArray[i * 3 + 1] = (Math.random() - 0.5) * 14;
        dustArray[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustArray, 3));
      const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.014, transparent: true, opacity: 0.22 }));
      scene.add(dust);

      let mx = 0, my = 0, raf = 0;
      const pointer = (event: PointerEvent) => { mx = event.clientX / innerWidth - 0.5; my = event.clientY / innerHeight - 0.5; };
      addEventListener("pointermove", pointer);
      const resize = () => {
        const width = el.clientWidth, height = el.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      resize();

      const clock = new THREE.Clock();
      const startTime = clock.getElapsedTime();
      const pos = new THREE.Vector3();
      const focusScale = new Float32Array(STAR_LAYOUT.length).fill(1);
      const labelScreen: { sx: number; sy: number; z: number; eased: number; isFocused: boolean }[] =
        STAR_LAYOUT.map(() => ({ sx: 0, sy: 0, z: 0, eased: 0, isFocused: false }));

      const tick = () => {
        const time = clock.getElapsedTime();
        const age = time - startTime;
        const focused = focusRef.current;

        const corePulse = 1 + Math.sin(time * 1.4) * 0.1;
        core.scale.setScalar(1.1 * corePulse);
        coreGlow.scale.setScalar(2.9 + Math.sin(time * 1.4) * 0.25);
        nebula.material.opacity = 0.13 + Math.sin(time * 0.5) * 0.03;
        rig.rotation.y += (mx * 0.12 - rig.rotation.y) * 0.02;
        rig.rotation.x += (my * 0.06 - rig.rotation.x) * 0.02;
        rig.updateMatrixWorld();

        STAR_LAYOUT.forEach((base, index) => {
          const reveal = Math.max(0, Math.min(1, (age - index * 0.18) / 1.1));
          const eased = reveal * reveal * (3 - 2 * reveal);
          // A slow, small, per-star drift -- alive without ever reading as
          // orbiting or bouncing.
          const x = base[0] + Math.sin(time * 0.24 + wobblePhase[index]) * 0.07;
          const y = base[1] + Math.cos(time * 0.2 + wobblePhase[index] * 1.7) * 0.05;
          const z = base[2] + Math.sin(time * 0.28 + wobblePhase[index] * 2.3) * 0.06;
          const orbCore = nodeCores[index], sprite = nodeGlows[index];
          orbCore.position.set(x, y, z);
          sprite.position.set(x, y, z);
          const isFocused = index === focused;
          focusScale[index] += ((isFocused ? 2.3 : 1) - focusScale[index]) * 0.06;
          const focusMul = focusScale[index];
          const twinkle = 0.82 + Math.sin(time * 2.6 + twinklePhase[index]) * 0.18;
          const coreMaterial = orbCore.material as THREE.SpriteMaterial;
          coreMaterial.color.copy(starColor).lerp(starFocusColor, isFocused ? 0.85 : 0);
          coreMaterial.opacity = (isFocused ? 1 : 0.8) * twinkle * eased;
          const scale = (0.001 + eased * 0.6) * focusMul;
          orbCore.scale.setScalar(scale);
          const haloMaterial = sprite.material as THREE.SpriteMaterial;
          haloMaterial.color.copy(haloColor).lerp(haloFocusColor, isFocused ? 0.85 : 0);
          sprite.scale.setScalar(0.9 * eased * focusMul);
          haloMaterial.opacity = (isFocused ? 0.85 : 0.4) * eased * twinkle;

          if (index < STAR_LAYOUT.length - 1) {
            const next = STAR_LAYOUT[index + 1];
            const offset = index * 6;
            linkPositions[offset] = x; linkPositions[offset + 1] = y; linkPositions[offset + 2] = z;
            linkPositions[offset + 3] = next[0]; linkPositions[offset + 4] = next[1]; linkPositions[offset + 5] = next[2];
          }

          rig.localToWorld(pos.set(x, y, z)).project(camera);
          labelScreen[index].sx = (pos.x * 0.5 + 0.5) * el.clientWidth;
          labelScreen[index].sy = (-pos.y * 0.5 + 0.5) * el.clientHeight;
          labelScreen[index].z = pos.z;
          labelScreen[index].eased = eased;
          labelScreen[index].isFocused = isFocused;
        });
        linkGeometry.attributes.position.needsUpdate = true;

        // Nudge labels apart when their projected positions land too close together,
        // pushing along whatever direction actually separates them (run this a few
        // times so three-way clusters settle instead of only resolving one pair).
        const MIN_LABEL_DIST = 96;
        for (let pass = 0; pass < 3; pass++) {
          for (let i = 0; i < labelScreen.length; i++) {
            for (let j = i + 1; j < labelScreen.length; j++) {
              const a = labelScreen[i], b = labelScreen[j];
              const dx = a.sx - b.sx, dy = a.sy - b.sy;
              let dist = Math.hypot(dx, dy);
              if (dist >= MIN_LABEL_DIST) continue;
              let nx: number, ny: number;
              if (dist > 0.5) { nx = dx / dist; ny = dy / dist; }
              else { nx = 0; ny = 1; dist = 0; }
              const push = (MIN_LABEL_DIST - dist) / 2;
              if (a.isFocused) { b.sx -= nx * push * 2; b.sy -= ny * push * 2; }
              else if (b.isFocused) { a.sx += nx * push * 2; a.sy += ny * push * 2; }
              else { a.sx += nx * push; a.sy += ny * push; b.sx -= nx * push; b.sy -= ny * push; }
            }
          }
        }
        labelScreen.forEach((lp, index) => {
          const label = labelRefs.current[index];
          if (!label) return;
          label.style.transform = `translate(-50%,-50%) translate(${lp.sx}px, ${lp.sy}px) scale(${0.9 + focusScale[index] * 0.1})`;
          label.style.opacity = String(lp.eased * (lp.z < 1 ? 1 : 0));
          label.classList.toggle("focused", lp.isFocused);
        });
        (links.material as THREE.LineBasicMaterial).opacity = 0.22 + Math.sin(time * 1.1) * 0.06;

        dust.rotation.y = time * 0.012;
        camera.position.x += (Math.cos(time * 0.05) * 0.4 - camera.position.x) * 0.03;
        camera.position.y += (0.6 + Math.sin(time * 0.045) * 0.2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      dispose = () => {
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", pointer);
        observer.disconnect();
        renderer.dispose();
        star.dispose();
        glow.dispose();
        nodeCores.forEach(s => (s.material as THREE.Material).dispose());
        nodeGlows.forEach(s => (s.material as THREE.Material).dispose());
        linkGeometry.dispose();
        (links.material as THREE.Material).dispose();
        dustGeometry.dispose();
        (dust.material as THREE.Material).dispose();
        (core.material as THREE.Material).dispose();
        (coreGlow.material as THREE.Material).dispose();
        (nebula.material as THREE.Material).dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    }).catch(() => {});
    return () => { stopped = true; dispose(); };
  }, []);

  return <div className={`team-constellation${active ? "" : " static"}`}>
    <div className="constellation-canvas" ref={host} aria-hidden="true" />
    {team.map((member, index) => (
      <div className="constellation-label" key={member.name} ref={node => { labelRefs.current[index] = node; }}>
        <b>{member.name}</b><span>{member.strength}</span>
      </div>
    ))}
  </div>;
}
