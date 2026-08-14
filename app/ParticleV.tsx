"use client";

import { useEffect, useRef, useState } from "react";

const COUNT = 2000;

function glowTexture(THREE: typeof import("three")) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Sample points along the two strokes of a V, with a little thickness and depth jitter.
function vTargets(count: number) {
  const points: [number, number, number][] = [];
  const strokeWidth = 0.22;
  const left = count >> 1, right = count - left;
  for (let i = 0; i < left; i++) {
    const t = i / (left - 1);
    const x = -2.1 + t * 2.1, y = 2.6 - t * 5.1;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  for (let i = 0; i < right; i++) {
    const t = i / (right - 1);
    const x = t * 2.1, y = -2.5 + t * 5.1;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  return points;
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

export default function ParticleV() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

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
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 8);

      const targets = vTargets(COUNT);
      const positions = new Float32Array(COUNT * 3);
      const starts = new Float32Array(COUNT * 3);
      const targetArr = new Float32Array(COUNT * 3);
      const delays = new Float32Array(COUNT);
      const durations = new Float32Array(COUNT);
      const phases = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        const radius = 5 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1);
        starts[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        starts[i * 3 + 1] = Math.cos(phi) * radius;
        starts[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 2;
        const [tx, ty, tz] = targets[i];
        targetArr[i * 3] = tx; targetArr[i * 3 + 1] = ty; targetArr[i * 3 + 2] = tz;
        positions[i * 3] = starts[i * 3]; positions[i * 3 + 1] = starts[i * 3 + 1]; positions[i * 3 + 2] = starts[i * 3 + 2];
        delays[i] = Math.random() * 1.3;
        durations[i] = 1.7 + Math.random() * 1.1;
        phases[i * 3] = Math.random() * Math.PI * 2;
        phases[i * 3 + 1] = Math.random() * Math.PI * 2;
        phases[i * 3 + 2] = Math.random() * Math.PI * 2;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const glow = glowTexture(THREE);
      const material = new THREE.PointsMaterial({ color: 0xd8ff3e, size: 0.11, map: glow, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const ambientCount = 220;
      const ambientGeometry = new THREE.BufferGeometry();
      const ambientArray = new Float32Array(ambientCount * 3);
      for (let i = 0; i < ambientCount; i++) {
        ambientArray[i * 3] = (Math.random() - 0.5) * 16;
        ambientArray[i * 3 + 1] = (Math.random() - 0.5) * 12;
        ambientArray[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
      }
      ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientArray, 3));
      const ambient = new THREE.Points(ambientGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.2 }));
      scene.add(ambient);

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

      const tick = () => {
        const time = clock.getElapsedTime();
        const age = time - startTime;

        for (let i = 0; i < COUNT; i++) {
          const elapsed = age - delays[i];
          const t = Math.max(0, Math.min(1, elapsed / durations[i]));
          const eased = easeOutCubic(t);
          const ox = i * 3, oy = i * 3 + 1, oz = i * 3 + 2;
          let x = starts[ox] + (targetArr[ox] - starts[ox]) * eased;
          let y = starts[oy] + (targetArr[oy] - starts[oy]) * eased;
          let z = starts[oz] + (targetArr[oz] - starts[oz]) * eased;
          if (t >= 1) {
            x += Math.sin(time * 1.1 + phases[ox]) * 0.028;
            y += Math.sin(time * 0.9 + phases[oy]) * 0.028;
            z += Math.sin(time * 1.3 + phases[oz]) * 0.05;
          }
          positions[ox] = x; positions[oy] = y; positions[oz] = z;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += (mx * 0.16 - points.rotation.y) * 0.02;
        points.rotation.x += (my * 0.08 - points.rotation.x) * 0.02;
        ambient.rotation.y = time * 0.015;
        material.opacity = 0.85 + Math.sin(time * 1.8) * 0.07;
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
        geometry.dispose();
        material.dispose();
        glow.dispose();
        ambientGeometry.dispose();
        (ambient.material as THREE.Material).dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    }).catch(() => {});
    return () => { stopped = true; dispose(); };
  }, []);

  return <div className={`particle-v${active ? "" : " static"}`} ref={host} aria-hidden="true">
    {!active && <span className="particle-v-static">V</span>}
  </div>;
}
