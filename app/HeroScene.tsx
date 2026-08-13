"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;
    let stopped = false;
    let dispose = () => {};

    // The 3D engine is intentionally imported in the browser. Cloudflare Workers
    // prohibit Three.js' module-level initialization during server startup.
    void import("three").then((THREE) => {
      if (stopped || !host.current) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      } catch { return; }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
      camera.position.set(0, 0.1, 8.2);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const universe = new THREE.Group();
      scene.add(universe);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 5), new THREE.MeshPhysicalMaterial({
        color: 0x7557ff, metalness: 0.42, roughness: 0.12, transmission: 0.18,
        thickness: 1.4, clearcoat: 1, emissive: 0x23105f, emissiveIntensity: 1.25,
      }));
      const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 2), new THREE.MeshBasicMaterial({ color: 0x71f6d0, wireframe: true, transparent: true, opacity: 0.34 }));
      const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.52, 2), new THREE.MeshBasicMaterial({ color: 0xb8a8ff, wireframe: true, transparent: true, opacity: 0.2 }));
      universe.add(core, inner, wire);

      const orbital = new THREE.Group();
      const colors = [0x8d75ff, 0x63efc7, 0xff7469];
      [2.05, 2.63, 3.12].forEach((radius, index) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, index === 0 ? 0.021 : 0.012, 10, 192), new THREE.MeshBasicMaterial({ color: colors[index], transparent: true, opacity: 0.5 - index * 0.1 }));
        ring.rotation.set(0.55 + index * 0.38, index * 0.3, 0.35 + index * 0.62);
        orbital.add(ring);
        for (let n = 0; n < 6 + index * 3; n += 1) {
          const angle = n / (6 + index * 3) * Math.PI * 2;
          const node = new THREE.Mesh(new THREE.SphereGeometry(n % 4 === 0 ? 0.07 : 0.035, 12, 12), new THREE.MeshBasicMaterial({ color: colors[(index + n) % colors.length] }));
          node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 2) * 0.22);
          orbital.add(node);
        }
      });
      universe.add(orbital);

      const count = 900;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const angle = i * 2.399963;
        const radius = 3.35 + (i * 47 % 233) / 58;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = ((i * 83 % 401) / 401 - 0.5) * 7.4;
        positions[i * 3 + 2] = Math.sin(angle) * radius * 0.42 - 1.4;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({ color: 0x9b87ff, size: 0.023, transparent: true, opacity: 0.58 });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      scene.add(new THREE.AmbientLight(0x9c8cff, 2.1));
      const key = new THREE.PointLight(0xffffff, 30, 20); key.position.set(2.2, 3.2, 4.6); scene.add(key);
      const mint = new THREE.PointLight(0x5ef2c2, 18, 16); mint.position.set(-3.4, -2.2, 3.2); scene.add(mint);
      const coral = new THREE.PointLight(0xff6c61, 10, 14); coral.position.set(3, -3, 1); scene.add(coral);

      let pointerX = 0, pointerY = 0, scrollProgress = 0, frame = 0;
      const onPointer = (event: PointerEvent) => {
        const bounds = el.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
        pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
      };
      const onScroll = () => { scrollProgress = Math.min(1, window.scrollY / Math.max(document.documentElement.scrollHeight - innerHeight, 1)); };
      el.addEventListener("pointermove", onPointer);
      window.addEventListener("scroll", onScroll, { passive: true });
      const observer = new ResizeObserver(() => {
        const width = el.clientWidth, height = el.clientHeight;
        renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      });
      observer.observe(el);
      const clock = new THREE.Clock();
      const tick = () => {
        const time = clock.getElapsedTime();
        const journey = scrollProgress * Math.PI * 5;
        universe.rotation.y += (pointerX * 0.52 + journey * 0.34 - universe.rotation.y) * 0.035;
        universe.rotation.x += (-pointerY * 0.3 + Math.sin(journey) * 0.24 - universe.rotation.x) * 0.035;
        universe.position.x = Math.sin(journey * 0.62) * 1.3;
        universe.position.y = Math.sin(time * 0.72) * 0.08 + Math.cos(journey * 0.8) * 0.65;
        const scale = 1 + Math.sin(journey * 0.5) * 0.16;
        universe.scale.setScalar(scale);
        core.rotation.set(time * 0.16, time * 0.23, time * 0.07);
        inner.rotation.set(-time * 0.2, time * 0.15, -time * 0.12);
        wire.rotation.set(-time * 0.11, -time * 0.08, time * 0.09);
        orbital.rotation.set(time * 0.025, -time * 0.035, -time * 0.08);
        particles.rotation.y = time * 0.012 + journey * 0.17;
        particles.rotation.x = Math.sin(journey * 0.35) * 0.18;
        renderer.render(scene, camera); frame = requestAnimationFrame(tick);
      };
      tick(); setReady(true);
      dispose = () => {
        cancelAnimationFrame(frame); observer.disconnect(); el.removeEventListener("pointermove", onPointer); window.removeEventListener("scroll", onScroll);
        renderer.dispose(); particleGeometry.dispose(); particleMaterial.dispose(); core.geometry.dispose(); wire.geometry.dispose(); inner.geometry.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    }).catch(() => {});
    return () => { stopped = true; dispose(); };
  }, []);

  return <div className={`hero3d ${ready ? "is-ready" : ""}`} ref={host} aria-hidden="true"><span className="hero-fallback"><i/><i/><i/><b>V</b></span></div>;
}
