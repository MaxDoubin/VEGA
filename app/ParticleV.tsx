"use client";

import { useEffect, useRef, useState } from "react";

const V_COUNT = 1700;
// Measured directly from public/prototype-qr.png: a 900x900 PNG, 20px modules,
// a 40px quiet zone, so the real data grid is exactly 41x41 modules.
const QR_IMAGE_SIZE = 900;
const QR_MODULE_PX = 20;
const QR_MARGIN_PX = 40;
const QR_GRID = 41;
const QR_SUPER = 2;
const QR_WORLD_SIZE = 5;
// Shifted well clear of the left-side title/quote text column -- the V used
// to sit centered-left and cross right through the copy.
const QR_CX = 6.77;
const V_CX = 0.17;

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

function frustumSize(fovDeg: number, aspect: number, distance: number) {
  const height = 2 * Math.tan((fovDeg * Math.PI) / 360) * distance;
  return { width: height * aspect, height };
}

// Scatter a start position across the ENTIRE visible screen at a random depth,
// so particles fly in from every edge instead of a small cluster near center.
function screenStart(fovDeg: number, aspect: number, cameraZ: number): [number, number, number] {
  const depth = -6 + Math.random() * 11;
  const { width, height } = frustumSize(fovDeg, aspect, cameraZ - depth);
  return [(Math.random() - 0.5) * width, (Math.random() - 0.5) * height, depth];
}

// Sample points along the two strokes of a V, centered on the left half of the scene.
function vTargets(count: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const strokeWidth = 0.24;
  const cx = V_CX;
  const left = count >> 1, right = count - left;
  for (let i = 0; i < left; i++) {
    const t = i / (left - 1);
    const x = cx - 2.2 + t * 2.2, y = 2.75 - t * 5.5;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  for (let i = 0; i < right; i++) {
    const t = i / (right - 1);
    const x = cx + t * 2.2, y = -2.65 + t * 5.5;
    const jitter = (Math.random() - 0.5) * strokeWidth;
    points.push([x + jitter * 0.6, y + jitter, (Math.random() - 0.5) * 0.5]);
  }
  return points;
}

// Read the real QR image down to its exact 41x41 module grid (sampling the
// center pixel of each module, no smoothing) so the shape we hand to the
// particles matches the actual scannable code rather than a blurry photo of it.
function readQrModules(image: HTMLImageElement): boolean[][] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = QR_IMAGE_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE);
  const data = ctx.getImageData(0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE).data;
  const modules: boolean[][] = [];
  for (let row = 0; row < QR_GRID; row++) {
    const line: boolean[] = [];
    for (let col = 0; col < QR_GRID; col++) {
      const px = Math.round(QR_MARGIN_PX + col * QR_MODULE_PX + QR_MODULE_PX / 2);
      const py = Math.round(QR_MARGIN_PX + row * QR_MODULE_PX + QR_MODULE_PX / 2);
      const i = (py * QR_IMAGE_SIZE + px) * 4;
      line.push((data[i] + data[i + 1] + data[i + 2]) / 3 < 128);
    }
    modules.push(line);
  }
  return modules;
}

// Supersample the module grid 2x per axis and drop one uniformly-sized square
// per "on" cell. Because every cell (inside a module or across a module
// boundary) is the same size and spacing, dark cells tile together into
// solid, gap-free squares -- the same geometry a real QR reader expects.
function qrTargets(modules: boolean[][]): [number, number, number][] {
  const cell = QR_WORLD_SIZE / QR_GRID / QR_SUPER;
  const half = QR_WORLD_SIZE / 2;
  const points: [number, number, number][] = [];
  for (let row = 0; row < QR_GRID * QR_SUPER; row++) {
    const moduleRow = Math.floor(row / QR_SUPER);
    for (let col = 0; col < QR_GRID * QR_SUPER; col++) {
      if (!modules[moduleRow][Math.floor(col / QR_SUPER)]) continue;
      const x = QR_CX - half + (col + 0.5) * cell;
      const y = half - (row + 0.5) * cell;
      points.push([x, y, 0]);
    }
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
      const fov = 46;
      const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
      camera.position.set(0, 0, 12);

      const resize = () => {
        const width = el.clientWidth, height = el.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(el);
      resize();

      // ---- V: a soft glowing swarm, stays lively and drifting forever ----
      const vTarget = vTargets(V_COUNT);
      const vCount = vTarget.length;
      const vPositions = new Float32Array(vCount * 3);
      const vStarts = new Float32Array(vCount * 3);
      const vTargetArr = new Float32Array(vCount * 3);
      const vDelays = new Float32Array(vCount);
      const vDurations = new Float32Array(vCount);
      const vPhases = new Float32Array(vCount * 3);
      for (let i = 0; i < vCount; i++) {
        const [sx, sy, sz] = screenStart(fov, camera.aspect, camera.position.z);
        vStarts[i * 3] = sx; vStarts[i * 3 + 1] = sy; vStarts[i * 3 + 2] = sz;
        const [tx, ty, tz] = vTarget[i];
        vTargetArr[i * 3] = tx; vTargetArr[i * 3 + 1] = ty; vTargetArr[i * 3 + 2] = tz;
        vPositions[i * 3] = sx; vPositions[i * 3 + 1] = sy; vPositions[i * 3 + 2] = sz;
        vDelays[i] = Math.random() * 1.4;
        vDurations[i] = 1.9 + Math.random() * 1.3;
        vPhases[i * 3] = Math.random() * Math.PI * 2;
        vPhases[i * 3 + 1] = Math.random() * Math.PI * 2;
        vPhases[i * 3 + 2] = Math.random() * Math.PI * 2;
      }
      const vGeometry = new THREE.BufferGeometry();
      vGeometry.setAttribute("position", new THREE.BufferAttribute(vPositions, 3));
      const glow = glowTexture(THREE);
      const vMaterial = new THREE.PointsMaterial({ size: 0.105, map: glow, color: 0xd8ff3e, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
      const vPoints = new THREE.Points(vGeometry, vMaterial);
      scene.add(vPoints);

      // ---- QR: precise squares that fly in bright, then lock to a crisp dark grid ----
      const qrModules = qrImage ? readQrModules(qrImage) : null;
      const qrTarget = qrModules ? qrTargets(qrModules) : [];
      const qrCount = qrTarget.length;
      const qrPositions = new Float32Array(qrCount * 3);
      const qrStarts = new Float32Array(qrCount * 3);
      const qrTargetArr = new Float32Array(qrCount * 3);
      const qrDelays = new Float32Array(qrCount);
      const qrDurations = new Float32Array(qrCount);
      const qrColors = new Float32Array(qrCount * 3);
      let qrMaxSettle = 0;
      for (let i = 0; i < qrCount; i++) {
        const [sx, sy, sz] = screenStart(fov, camera.aspect, camera.position.z);
        qrStarts[i * 3] = sx; qrStarts[i * 3 + 1] = sy; qrStarts[i * 3 + 2] = sz;
        const [tx, ty, tz] = qrTarget[i];
        qrTargetArr[i * 3] = tx; qrTargetArr[i * 3 + 1] = ty; qrTargetArr[i * 3 + 2] = tz;
        qrPositions[i * 3] = sx; qrPositions[i * 3 + 1] = sy; qrPositions[i * 3 + 2] = sz;
        qrDelays[i] = Math.random() * 1.1;
        qrDurations[i] = 1.6 + Math.random() * 1.2;
        qrMaxSettle = Math.max(qrMaxSettle, qrDelays[i] + qrDurations[i]);
      }
      const qrGeometry = new THREE.BufferGeometry();
      qrGeometry.setAttribute("position", new THREE.BufferAttribute(qrPositions, 3));
      qrGeometry.setAttribute("color", new THREE.BufferAttribute(qrColors, 3));
      const qrCell = QR_WORLD_SIZE / QR_GRID / QR_SUPER;
      const qrMaterial = new THREE.PointsMaterial({ size: qrCell * 1.24, vertexColors: true, sizeAttenuation: true });
      const qrPoints = new THREE.Points(qrGeometry, qrMaterial);
      scene.add(qrPoints);
      const qrBright = new THREE.Color(0x8ff0ff), qrDark = new THREE.Color(0x0a0b0d), qrTmp = new THREE.Color();

      // A light backing plate (with a real quiet zone) so the settled dark
      // squares read as an actual scannable QR code, not glowing dots on black.
      const plateSize = QR_WORLD_SIZE + 1.0;
      const plateGeometry = new THREE.PlaneGeometry(plateSize, plateSize);
      const plateMaterial = new THREE.MeshBasicMaterial({ color: 0xf3f4ee, transparent: true, opacity: 0 });
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(QR_CX, 0, -0.05);
      scene.add(plate);
      const haloTexture = glowTexture(THREE);
      const haloMaterial = new THREE.SpriteMaterial({ map: haloTexture, color: 0x8ff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const halo = new THREE.Sprite(haloMaterial);
      halo.scale.set(plateSize * 1.7, plateSize * 1.7, 1);
      halo.position.set(QR_CX, 0, -0.12);
      scene.add(halo);

      const ambientCount = 420;
      const ambientGeometry = new THREE.BufferGeometry();
      const ambientArray = new Float32Array(ambientCount * 3);
      const { width: ambientW, height: ambientH } = frustumSize(fov, camera.aspect || 1, camera.position.z + 5);
      for (let i = 0; i < ambientCount; i++) {
        ambientArray[i * 3] = (Math.random() - 0.5) * Math.max(ambientW, 20);
        ambientArray[i * 3 + 1] = (Math.random() - 0.5) * Math.max(ambientH, 12);
        ambientArray[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3;
      }
      ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientArray, 3));
      const ambient = new THREE.Points(ambientGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.2 }));
      scene.add(ambient);

      let mx = 0, my = 0, raf = 0;
      const pointer = (event: PointerEvent) => { mx = event.clientX / innerWidth - 0.5; my = event.clientY / innerHeight - 0.5; };
      addEventListener("pointermove", pointer);

      const clock = new THREE.Clock();
      const startTime = clock.getElapsedTime();

      const tick = () => {
        const time = clock.getElapsedTime();
        const age = time - startTime;

        for (let i = 0; i < vCount; i++) {
          const elapsed = age - vDelays[i];
          const t = Math.max(0, Math.min(1, elapsed / vDurations[i]));
          const eased = easeOutCubic(t);
          const ox = i * 3, oy = i * 3 + 1, oz = i * 3 + 2;
          let x = vStarts[ox] + (vTargetArr[ox] - vStarts[ox]) * eased;
          let y = vStarts[oy] + (vTargetArr[oy] - vStarts[oy]) * eased;
          let z = vStarts[oz] + (vTargetArr[oz] - vStarts[oz]) * eased;
          if (t >= 1) {
            x += Math.sin(time * 1.1 + vPhases[ox]) * 0.026;
            y += Math.sin(time * 0.9 + vPhases[oy]) * 0.026;
            z += Math.sin(time * 1.3 + vPhases[oz]) * 0.045;
          }
          vPositions[ox] = x; vPositions[oy] = y; vPositions[oz] = z;
        }
        vGeometry.attributes.position.needsUpdate = true;

        for (let i = 0; i < qrCount; i++) {
          const elapsed = age - qrDelays[i];
          const t = Math.max(0, Math.min(1, elapsed / qrDurations[i]));
          const eased = easeOutCubic(t);
          const ox = i * 3, oy = i * 3 + 1, oz = i * 3 + 2;
          qrPositions[ox] = qrStarts[ox] + (qrTargetArr[ox] - qrStarts[ox]) * eased;
          qrPositions[oy] = qrStarts[oy] + (qrTargetArr[oy] - qrStarts[oy]) * eased;
          qrPositions[oz] = qrStarts[oz] + (qrTargetArr[oz] - qrStarts[oz]) * eased;
          qrTmp.copy(qrBright).lerp(qrDark, eased);
          qrColors[ox] = qrTmp.r; qrColors[oy] = qrTmp.g; qrColors[oz] = qrTmp.b;
        }
        if (qrCount) {
          qrGeometry.attributes.position.needsUpdate = true;
          qrGeometry.attributes.color.needsUpdate = true;
          const plateIn = Math.max(0, Math.min(1, (age - qrMaxSettle * 0.55) / (qrMaxSettle * 0.45 + 0.3)));
          const plateEased = easeOutCubic(plateIn);
          plateMaterial.opacity = plateEased * 0.97;
          haloMaterial.opacity = plateEased * 0.3;
        }

        vPoints.rotation.y += (mx * 0.12 - vPoints.rotation.y) * 0.02;
        vPoints.rotation.x += (my * 0.06 - vPoints.rotation.x) * 0.02;
        ambient.rotation.y = time * 0.012;
        vMaterial.opacity = 0.85 + Math.sin(time * 1.8) * 0.07;
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
        vGeometry.dispose();
        vMaterial.dispose();
        glow.dispose();
        qrGeometry.dispose();
        qrMaterial.dispose();
        plateGeometry.dispose();
        plateMaterial.dispose();
        haloTexture.dispose();
        haloMaterial.dispose();
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
