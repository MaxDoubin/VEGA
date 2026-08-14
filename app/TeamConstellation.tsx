"use client";

import { useEffect, useRef, useState } from "react";

type Member = { name: string; strength: string };

const ORBITS = [
  { radius: 2.35, speed: 0.26, phase: 0.0, tilt: 0.18, height: 0.55 },
  { radius: 2.85, speed: -0.19, phase: 1.3, tilt: -0.32, height: 0.75 },
  { radius: 2.05, speed: 0.31, phase: 2.6, tilt: 0.42, height: 0.4 },
  { radius: 3.15, speed: -0.15, phase: 3.9, tilt: -0.12, height: 0.9 },
  { radius: 2.6, speed: 0.22, phase: 5.1, tilt: 0.55, height: 0.62 },
];

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

      const glow = glowTexture(THREE);
      const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xd8ff3e, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      coreGlow.scale.setScalar(2.6);
      scene.add(coreGlow);
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 2),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xd8ff3e, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.15, transmission: 0.3, clearcoat: 1, transparent: true, opacity: 0.95 })
      );
      scene.add(core);

      const nodeMaterial = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0x6bdcff, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.2, transparent: true, opacity: 0.95 });
      const nodes: THREE.Mesh[] = [];
      const nodeGlows: THREE.Sprite[] = [];
      const nodeGeometry = new THREE.IcosahedronGeometry(0.16, 1);
      for (let i = 0; i < ORBITS.length; i++) {
        const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial());
        scene.add(mesh);
        nodes.push(mesh);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x6bdcff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
        sprite.scale.setScalar(0.85);
        scene.add(sprite);
        nodeGlows.push(sprite);
      }

      const beamPositions = new Float32Array(ORBITS.length * 2 * 3);
      const beamGeometry = new THREE.BufferGeometry();
      beamGeometry.setAttribute("position", new THREE.BufferAttribute(beamPositions, 3));
      const beams = new THREE.LineSegments(beamGeometry, new THREE.LineBasicMaterial({ color: 0xd8ff3e, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending }));
      scene.add(beams);

      const dustCount = 180;
      const dustGeometry = new THREE.BufferGeometry();
      const dustArray = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustArray[i * 3] = (Math.random() - 0.5) * 14;
        dustArray[i * 3 + 1] = (Math.random() - 0.5) * 9;
        dustArray[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustArray, 3));
      const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.14 }));
      scene.add(dust);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1235, 2.4));
      const key = new THREE.PointLight(0xd8ff3e, 30, 22);
      key.position.set(3, 4, 6);
      const rim = new THREE.PointLight(0x6bdcff, 26, 20);
      rim.position.set(-4, -2, 4);
      scene.add(key, rim);

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
      const focusScale = new Float32Array(ORBITS.length).fill(1);
      const labelScreen: { sx: number; sy: number; z: number; eased: number; isFocused: boolean }[] =
        ORBITS.map(() => ({ sx: 0, sy: 0, z: 0, eased: 0, isFocused: false }));

      const tick = () => {
        const time = clock.getElapsedTime();
        const age = time - startTime;
        const focused = focusRef.current;

        core.rotation.x = time * 0.18;
        core.rotation.y = time * 0.26;
        const corePulse = 1 + Math.sin(time * 1.6) * 0.08;
        core.scale.setScalar(corePulse);
        coreGlow.scale.setScalar(2.6 + Math.sin(time * 1.6) * 0.2);

        ORBITS.forEach((orbit, index) => {
          const reveal = Math.max(0, Math.min(1, (age - index * 0.18) / 1.1));
          const eased = reveal * reveal * (3 - 2 * reveal);
          const angle = orbit.phase + time * orbit.speed;
          const x = Math.cos(angle) * orbit.radius;
          const z = Math.sin(angle) * orbit.radius;
          const y = Math.sin(angle * orbit.tilt * 4 + orbit.phase) * orbit.height;
          const node = nodes[index], sprite = nodeGlows[index];
          node.position.set(x, y, z);
          sprite.position.set(x, y, z);
          node.rotation.x += 0.01;
          node.rotation.y += 0.014;
          const isFocused = index === focused;
          focusScale[index] += ((isFocused ? 2.5 : 1) - focusScale[index]) * 0.06;
          const focusMul = focusScale[index];
          const material = node.material as THREE.MeshPhysicalMaterial;
          material.emissiveIntensity += ((isFocused ? 1.8 : 0.7) - material.emissiveIntensity) * 0.06;
          const scale = (0.001 + eased * (1 + Math.sin(time * 2 + index) * 0.08)) * focusMul;
          node.scale.setScalar(scale);
          sprite.scale.setScalar((0.75 + Math.sin(time * 2.2 + index * 2) * 0.12) * eased * focusMul);
          (sprite.material as THREE.SpriteMaterial).opacity = (isFocused ? 0.85 : 0.5) * eased;

          const offset = index * 6;
          beamPositions[offset] = 0; beamPositions[offset + 1] = 0; beamPositions[offset + 2] = 0;
          beamPositions[offset + 3] = x; beamPositions[offset + 4] = y; beamPositions[offset + 5] = z;

          pos.set(x, y, z).project(camera);
          labelScreen[index].sx = (pos.x * 0.5 + 0.5) * el.clientWidth;
          labelScreen[index].sy = (-pos.y * 0.5 + 0.5) * el.clientHeight;
          labelScreen[index].z = pos.z;
          labelScreen[index].eased = eased;
          labelScreen[index].isFocused = isFocused;
        });
        beamGeometry.attributes.position.needsUpdate = true;

        // Nudge labels apart when their projected positions land too close together,
        // pushing along whatever direction actually separates them (run this a few
        // times so three-way clusters settle instead of only resolving one pair).
        const MIN_LABEL_DIST = 78;
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
        (beams.material as THREE.LineBasicMaterial).opacity = 0.16 + Math.sin(time * 1.4) * 0.06;

        scene.rotation.y += (mx * 0.18 - scene.rotation.y) * 0.02;
        scene.rotation.x += (my * 0.1 - scene.rotation.x) * 0.02;
        dust.rotation.y = time * 0.02;
        camera.position.x += (Math.cos(time * 0.06) * 0.6 - camera.position.x) * 0.03;
        camera.position.y += (0.6 + Math.sin(time * 0.05) * 0.3 - camera.position.y) * 0.03;
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
        nodeGeometry.dispose();
        nodes.forEach(n => (n.material as THREE.Material).dispose());
        nodeGlows.forEach(s => (s.material as THREE.SpriteMaterial).map?.dispose());
        beamGeometry.dispose();
        (beams.material as THREE.Material).dispose();
        dustGeometry.dispose();
        (dust.material as THREE.Material).dispose();
        core.geometry.dispose();
        (core.material as THREE.Material).dispose();
        (coreGlow.material as THREE.SpriteMaterial).dispose();
        glow.dispose();
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
