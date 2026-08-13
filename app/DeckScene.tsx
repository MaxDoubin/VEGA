"use client";

import { useEffect, useRef } from "react";

export default function DeckScene({slide}:{slide:number}){
  const host=useRef<HTMLDivElement>(null);const slideRef=useRef(slide);
  useEffect(()=>{slideRef.current=slide},[slide]);
  useEffect(()=>{
    const el=host.current;if(!el||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const probe=document.createElement("canvas");if(!probe.getContext("webgl2")&&!probe.getContext("webgl"))return;
    let stopped=false;let dispose=()=>{};
    void import("three").then(THREE=>{
      if(stopped||!host.current)return;let renderer:THREE.WebGLRenderer;
      try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"})}catch{return}
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);el.appendChild(renderer.domElement);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.z=11;const rig=new THREE.Group();scene.add(rig);
      const mats=[0xd8ff3e,0xff623e,0x8e74ff,0xffffff].map(c=>new THREE.MeshPhysicalMaterial({color:c,metalness:.45,roughness:.15,transmission:.22,thickness:1,clearcoat:1,transparent:true,opacity:.82}));
      for(let i=0;i<13;i++){const h=1.1+(i%5)*.52,mesh=new THREE.Mesh(new THREE.BoxGeometry(.18,h,.18),mats[i%4]),a=i/13*Math.PI*2,r=1.4+(i%3)*.55;mesh.position.set(Math.cos(a)*r,Math.sin(a)*r*.65,(i%4-2)*.24);mesh.rotation.z=a+.6;rig.add(mesh)}
      const frame=new THREE.Mesh(new THREE.TorusKnotGeometry(2.25,.035,180,10,2,5),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.13}));rig.add(frame);
      const dustGeo=new THREE.BufferGeometry(),p=new Float32Array(750*3);for(let i=0;i<750;i++){p[i*3]=(Math.random()-.5)*15;p[i*3+1]=(Math.random()-.5)*9;p[i*3+2]=(Math.random()-.5)*8}dustGeo.setAttribute("position",new THREE.BufferAttribute(p,3));const dustMat=new THREE.PointsMaterial({color:0xffffff,size:.018,transparent:true,opacity:.35}),dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);
      scene.add(new THREE.AmbientLight(0xffffff,2.2));const light=new THREE.PointLight(0x8e74ff,55,30);light.position.set(3,4,7);scene.add(light);
      let mx=0,my=0,raf=0;const pointer=(e:PointerEvent)=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5};addEventListener("pointermove",pointer);
      const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix()},ro=new ResizeObserver(resize);ro.observe(el);resize();const clock=new THREE.Clock();
      const tick=()=>{const t=clock.getElapsedTime(),n=slideRef.current;rig.rotation.y+=(n*.63+mx*.35-rig.rotation.y)*.035;rig.rotation.x+=(-.25+my*.2+Math.sin(t*.23)*.08-rig.rotation.x)*.03;rig.rotation.z=t*.025;rig.position.x+=((n%2?3.15:2.3)-rig.position.x)*.03;rig.position.y+=(Math.sin(t*.55)*.14+(n%3-1)*.35-rig.position.y)*.03;const s=.82+(n%4)*.08;rig.scale.lerp(new THREE.Vector3(s,s,s),.03);frame.rotation.x=t*.08;frame.rotation.y=-t*.12;dust.rotation.y=t*.015+n*.08;renderer.render(scene,camera);raf=requestAnimationFrame(tick)};tick();
      dispose=()=>{cancelAnimationFrame(raf);removeEventListener("pointermove",pointer);ro.disconnect();renderer.dispose();dustGeo.dispose();dustMat.dispose();mats.forEach(m=>m.dispose());if(el.contains(renderer.domElement))el.removeChild(renderer.domElement)};
    }).catch(()=>{});return()=>{stopped=true;dispose()};
  },[]);
  return <div className="deck-scene" ref={host} aria-hidden="true"/>;
}
