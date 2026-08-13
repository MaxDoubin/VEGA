"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
export default function HeroScene(){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=host.current;if(!el||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"})}catch{return}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.z=7.4;
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);
  const group=new THREE.Group();scene.add(group);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,3),new THREE.MeshPhysicalMaterial({color:0x7354f5,metalness:.5,roughness:.14,transmission:.15,clearcoat:1,emissive:0x241260,emissiveIntensity:.9}));group.add(core);
  const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,2),new THREE.MeshBasicMaterial({color:0xa996ff,wireframe:true,transparent:true,opacity:.22}));group.add(wire);
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(2.15,.018,10,160),new THREE.MeshBasicMaterial({color:0x795cf2,transparent:true,opacity:.52}));ring1.rotation.x=1.15;group.add(ring1);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.75,.011,8,180),new THREE.MeshBasicMaterial({color:0xff6c61,transparent:true,opacity:.35}));ring2.rotation.set(.45,.2,1.05);group.add(ring2);
  const nodes=new THREE.Group();for(let i=0;i<13;i++){const a=i/13*Math.PI*2,r=i%2?2.15:2.75,n=new THREE.Mesh(new THREE.SphereGeometry(i%3?.045:.075,12,12),new THREE.MeshBasicMaterial({color:i%3?0x5ef2c2:0xff6c61}));n.position.set(Math.cos(a)*r,Math.sin(a)*r*.56,Math.sin(a)*.65);nodes.add(n)}group.add(nodes);
  const count=700,pos=new Float32Array(count*3);for(let i=0;i<count;i++){const r=3.2+Math.random()*3.7,a=Math.random()*Math.PI*2;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=(Math.random()-.5)*6;pos[i*3+2]=(Math.random()-.5)*5}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));const particles=new THREE.Points(geo,new THREE.PointsMaterial({color:0x8c75ff,size:.022,transparent:true,opacity:.55}));scene.add(particles);
  scene.add(new THREE.AmbientLight(0x9c8cff,2.2));const light=new THREE.PointLight(0xffffff,28,20);light.position.set(2,3,4);scene.add(light);const mint=new THREE.PointLight(0x5ef2c2,16,15);mint.position.set(-3,-2,3);scene.add(mint);
  let mx=0,my=0,frame=0;const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5};el.addEventListener("pointermove",move);
  const observer=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()});observer.observe(el);
  const clock=new THREE.Clock(),tick=()=>{const t=clock.getElapsedTime();group.rotation.y+=(mx*.45-group.rotation.y)*.035;group.rotation.x+=(-my*.28-group.rotation.x)*.035;core.rotation.set(t*.17,t*.23,0);wire.rotation.x=-t*.12;wire.rotation.z=t*.09;ring1.rotation.z=t*.08;ring2.rotation.y=t*.055;nodes.rotation.z=-t*.11;particles.rotation.y=t*.012;renderer.render(scene,camera);frame=requestAnimationFrame(tick)};tick();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener("pointermove",move);renderer.dispose();geo.dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement)}
 },[]);
 return <div className="hero3d" ref={host} aria-hidden="true"/>;
}
