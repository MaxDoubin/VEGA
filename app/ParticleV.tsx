"use client";

import { useEffect, useRef, useState } from "react";

const V_COUNT = 1500;
const QR_COUNT = 2800;

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Sample points along the two strokes of a V, centered on the left half of the scene.
function vTargets(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const strokeWidth = 0.24;
  const cx = -3.1;
  const left = count >> 1, right = count - left;
  for (let i = 0; i < left; i++) {
    const t = i / (left - 1);
    const x = cx - 2.1 + t * 2.1, y = 2.7 - t * 5.3;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  for (let i = 0; i < right; i++) {
    const t = i / (right - 1);
    const x = cx + t * 2.1, y = -2.6 + t * 5.3;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  return points;
}

// Sample the dark pixels of the real QR code image, positioned on the right half of the scene.
function qrTargets(image: HTMLImageElement, count: number): [number, number, number][] {
  const size = 150;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const dark: [number, number][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (lum < 130) dark.push([x, y]);
    }
  }
  if (!dark.length) return [];
  const cx = 3.0, scale = 4.6 / size;
  const points: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const [px, py] = dark[Math.floor((i / count) * dark.length) % dark.length];
    const jitter = (Math.random() - 0.5) * scale * 0.9;
    const x = cx + (px - size / 2) * scale + jitter;
    const y = -(py - size / 2) * scale + jitter;
    points.push([x, y, (Math.random() - 0.5) * 0.35]);
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
    void import("three").then(async THREE => {
      if (stopped || !host.current) return;
      const qrImage = await loadImage("/prototype-qr.png").catch(() => null);
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
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
      camera.position.set(0, 0, 11.5);

      const vPoints = vTargets(V_COUNT);
      const qrPoints = qrImage ? qrTargets(qrImage, QR_COUNT) : [];
      const targets = [...vPoints, ...qrPoints];
      const count = targets.length;
      const positions = new Float32Array(count * 3);
      const starts = new Float32Array(count * 3);
      const targetArr = new Float32Array(count * 3);
      const delays = new Float32Array(count);
      const durations = new Float32Array(count);
      const phases = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const vColor = new THREE.Color(0xd8ff3e), qrColor = new THREE.Color(0x8ff0ff);
      for (let i = 0; i < count; i++) {
        const radius = 7 + Math.random() * 6;
        const theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1);
        starts[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        starts[i * 3 + 1] = Math.cos(phi) * radius;
        starts[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 2;
        const [tx, ty, tz] = targets[i];
        targetArr[i * 3] = tx; targetArr[i * 3 + 1] = ty; targetArr[i * 3 + 2] = tz;
        positions[i * 3] = starts[i * 3]; positions[i * 3 + 1] = starts[i * 3 + 1]; positions[i * 3 + 2] = starts[i * 3 + 2];
        delays[i] = Math.random() * 1.5;
        durations[i] = 1.8 + Math.random() * 1.3;
        phases[i * 3] = Math.random() * Math.PI * 2;
        phases[i * 3 + 1] = Math.random() * Math.PI * 2;
        phases[i * 3 + 2] = Math.random() * Math.PI * 2;
        const c = i < vPoints.length ? vColor : qrColor;
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const glow = glowTexture(THREE);
      const material = new THREE.PointsMaterial({ size: 0.1, map: glow, vertexColors: true, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const ambientCount = 320;
      const ambientGeometry = new THREE.BufferGeometry();
      const ambientArray = new Float32Array(ambientCount * 3);
      for (let i = 0; i < ambientCount; i++) {
        ambientArray[i * 3] = (Math.random() - 0.5) * 24;
        ambientArray[i * 3 + 1] = (Math.random() - 0.5) * 15;
        ambientArray[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3;
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

        for (let i = 0; i < count; i++) {
          const elapsed = age - delays[i];
          const t = Math.max(0, Math.min(1, elapsed / durations[i]));
          const eased = easeOutCubic(t);
          const ox = i * 3, oy = i * 3 + 1, oz = i * 3 + 2;
          let x = starts[ox] + (targetArr[ox] - starts[ox]) * eased;
          let y = starts[oy] + (targetArr[oy] - starts[oy]) * eased;
          let z = starts[oz] + (targetArr[oz] - starts[oz]) * eased;
          if (t >= 1) {
            x += Math.sin(time * 1.1 + phases[ox]) * 0.026;
            y += Math.sin(time * 0.9 + phases[oy]) * 0.026;
            z += Math.sin(time * 1.3 + phases[oz]) * 0.045;
          }
          positions[ox] = x; positions[oy] = y; positions[oz] = z;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += (mx * 0.12 - points.rotation.y) * 0.02;
        points.rotation.x += (my * 0.06 - points.rotation.x) * 0.02;
        ambient.rotation.y = time * 0.012;
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
