"use client";

import { useEffect, useRef } from "react";

type Target={x:number;y:number;z:number;rx:number;ry:number;rz:number;s:number};

function targetFor(slide:number,index:number,time:number,total:number):Target{
  const u=index/Math.max(total-1,1),a=u*Math.PI*2;
  if(slide===0){const arm=index%2?1:-1,r=.55+u*3.25;return{x:Math.cos(a*2.15)*r,y:(u-.5)*5.4,z:Math.sin(a*2.15)*r*.65,rx:a,ry:a*.5,rz:a+arm*.4,s:.7+u*.8}}
  if(slide===1){const col=index%4,row=Math.floor(index/4);return{x:(col-1.5)*1.05+Math.sin(time*.8+index)*.09,y:(row-1.5)*.9+Math.cos(time*.7+index)*.08,z:Math.sin(index*2.1+time*.45)*.65,rx:index*.22,ry:index*.34,rz:Math.sin(time*.6+index)*.12,s:.5+(index%3)*.12}}
  if(slide===2){const phi=Math.acos(1-2*(index+.5)/total),theta=Math.PI*(1+Math.sqrt(5))*index,r=2.65;return{x:Math.sin(phi)*Math.cos(theta)*r,y:Math.cos(phi)*r,z:Math.sin(phi)*Math.sin(theta)*r,rx:phi,ry:theta,rz:time*.15+a,s:.7}}
  if(slide===3){const lane=index%4,row=Math.floor(index/4),x=(u-.5)*7;return{x,y:(lane-1.5)*.72+Math.sin(x*1.25+time*1.6)*.28,z:(row-3)*.28+Math.cos(x+time)*.18,rx:0,ry:0,rz:Math.sin(x+time)*.25,s:.45+(lane%2)*.18}}
  if(slide===4){const ring=index<7?0:1,count=ring?total-7:7,j=ring?index-7:index,ang=j/count*Math.PI*2,r=ring?3.25:1.45;return{x:Math.cos(ang)*r,y:Math.sin(ang)*r*.72,z:ring?Math.sin(ang*2)*.35:0,rx:0,ry:0,rz:ang,s:ring?.62:.86}}
  if(slide===5){const lane=index%4,depth=Math.floor(index/4),z=3.6-depth*1.05;return{x:(lane-1.5)*1.25,y:Math.sin(index*.8)*.38,z,rx:0,ry:0,rz:0,s:.55+(depth%2)*.12}}
  if(slide===6){const group=index%5,j=Math.floor(index/5),ang=group/5*Math.PI*2-Math.PI/2,cx=Math.cos(ang)*2.55,cy=Math.sin(ang)*2.1;return{x:cx+Math.cos(a*3)*j*.13,y:cy+Math.sin(a*3)*j*.13,z:Math.sin(index)*.45,rx:ang,ry:a,rz:ang+Math.PI/2,s:.5+j*.07}}
  const left=index<Math.ceil(total/2),j=left?index:index-Math.ceil(total/2),count=Math.ceil(total/2)-1,progress=j/count;return{x:(left?-1:1)*(2.6-2.6*progress),y:2.7-5.3*progress,z:Math.sin(j*.8+time*.5)*.22,rx:0,ry:0,rz:left?-.47:.47,s:.58+progress*.38};
}

export default function DeckScene({slide}:{slide:number}){
  const host=useRef<HTMLDivElement>(null),slideRef=useRef(slide);
  useEffect(()=>{slideRef.current=slide},[slide]);
  useEffect(()=>{
    const el=host.current;if(!el||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const probe=document.createElement("canvas");if(!probe.getContext("webgl2")&&!probe.getContext("webgl"))return;
    let stopped=false,dispose=()=>{};
    void import("three").then(THREE=>{
      if(stopped||!host.current)return;let renderer:THREE.WebGLRenderer;
      try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"})}catch{return}
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,100);camera.position.set(0,0,12);
      const world=new THREE.Group(),forms=new THREE.Group(),orbit=new THREE.Group();world.add(forms,orbit);scene.add(world);
      const palette=[0xd8ff3e,0x6bdcff,0x8e74ff,0xffffff],materials=palette.map(color=>new THREE.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.06,metalness:.55,roughness:.24,transmission:.12,thickness:.8,clearcoat:1,transparent:true,opacity:.66}));
      const geometries=[new THREE.BoxGeometry(.2,1.05,.2),new THREE.OctahedronGeometry(.28,0),new THREE.CapsuleGeometry(.1,.72,5,8)],meshes:THREE.Mesh[]=[];
      for(let i=0;i<16;i++){const mesh=new THREE.Mesh(geometries[i%geometries.length],materials[i%materials.length]);mesh.position.set(0,0,0);mesh.scale.setScalar(.01);forms.add(mesh);meshes.push(mesh)}
      const linePositions=new Float32Array((meshes.length-1)*2*3),lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute("position",new THREE.BufferAttribute(linePositions,3));const lines=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:0x8e74ff,transparent:true,opacity:.1}));forms.add(lines);
      const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.85,3),new THREE.MeshPhysicalMaterial({color:0xffffff,emissive:0x8e74ff,emissiveIntensity:.3,metalness:.48,roughness:.05,transmission:.55,thickness:2,clearcoat:1,transparent:true,opacity:.72,wireframe:true}));forms.add(core);
      const ringMaterial=new THREE.MeshBasicMaterial({color:0xd8ff3e,transparent:true,opacity:.11,side:THREE.DoubleSide}),rings:THREE.Mesh[]=[];for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.65+i*.62,.012,6,140),ringMaterial);ring.rotation.set(Math.PI/2+i*.08,i*.31,i*.22);orbit.add(ring);rings.push(ring)}
      const tunnel=new THREE.Mesh(new THREE.TorusKnotGeometry(2.75,.018,180,7,2,5),new THREE.MeshBasicMaterial({color:0x6bdcff,wireframe:true,transparent:true,opacity:.045}));orbit.add(tunnel);
      const dustGeometry=new THREE.BufferGeometry(),dustArray=new Float32Array(240*3);for(let i=0;i<240;i++){dustArray[i*3]=(Math.random()-.5)*18;dustArray[i*3+1]=(Math.random()-.5)*11;dustArray[i*3+2]=(Math.random()-.5)*10}dustGeometry.setAttribute("position",new THREE.BufferAttribute(dustArray,3));const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xffffff,size:.014,transparent:true,opacity:.12}));scene.add(dust);
      scene.add(new THREE.HemisphereLight(0xffffff,0x1a1235,2.3));const key=new THREE.PointLight(0x8e74ff,42,30),rim=new THREE.PointLight(0xd8ff3e,30,25);key.position.set(4,5,7);rim.position.set(-5,-2,4);scene.add(key,rim);
      let mx=0,my=0,raf=0,shown=slideRef.current,transition=1;const pointer=(event:PointerEvent)=>{mx=event.clientX/innerWidth-.5;my=event.clientY/innerHeight-.5};addEventListener("pointermove",pointer);
      const resize=()=>{const width=el.clientWidth,height=el.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix()},observer=new ResizeObserver(resize);observer.observe(el);resize();const clock=new THREE.Clock(),scaleTarget=new THREE.Vector3(),positionTarget=new THREE.Vector3();
      const tick=()=>{const time=clock.getElapsedTime(),nextSlide=slideRef.current;if(nextSlide!==shown){shown=nextSlide;transition=0}transition=Math.min(1,transition+.018);
        meshes.forEach((mesh,index)=>{const target=targetFor(shown,index,time,meshes.length);positionTarget.set(target.x,target.y,target.z);mesh.position.lerp(positionTarget,.042);mesh.rotation.x+=(target.rx+time*.025-mesh.rotation.x)*.035;mesh.rotation.y+=(target.ry+time*.035-mesh.rotation.y)*.035;mesh.rotation.z+=(target.rz-mesh.rotation.z)*.035;scaleTarget.setScalar(target.s*(.97+Math.sin(time*.7+index)*.03));mesh.scale.lerp(scaleTarget,.042)});
        for(let i=0;i<meshes.length-1;i++){const offset=i*6,a=meshes[i].position,b=meshes[(i+1+(shown===4?5:0))%meshes.length].position;linePositions[offset]=a.x;linePositions[offset+1]=a.y;linePositions[offset+2]=a.z;linePositions[offset+3]=b.x;linePositions[offset+4]=b.y;linePositions[offset+5]=b.z}lineGeometry.attributes.position.needsUpdate=true;
        const coreScale=shown===1?.48:shown===3?.35:shown===5?.7:shown===7?1.35:1;core.scale.setScalar(coreScale*(1+Math.sin(time*2)*.06));core.rotation.set(-time*.16+shown*.08,time*.24+shown*.12,time*.06);core.material.opacity=.25+(shown===2||shown===7?.52:.24);
        rings.forEach((ring,index)=>{ring.rotation.x+=.00025*(index+1);ring.rotation.y+=.0004*(index%2?-1:1);const scale=shown===3?1.08+index*.04:shown===5?.8+index*.06:1;ring.scale.lerp(scaleTarget.setScalar(scale),.03)});ringMaterial.opacity=.03+[.08,.025,.1,.12,.08,.06,.08,.13][shown];tunnel.rotation.set(time*.012+shown*.035,-time*.018+shown*.05,time*.01);tunnel.scale.lerp(scaleTarget.setScalar(shown===3?1.08:shown===7?1.18:.86),.03);
        world.position.x+=((shown%2?2.7:2.35)+mx*.24-world.position.x)*.03;world.position.y+=(((shown%3)-1)*.14-my*.16-world.position.y)*.03;world.rotation.y+=(mx*.09+Math.sin(time*.12)*.025-world.rotation.y)*.025;world.rotation.x+=(my*.06-world.rotation.x)*.025;const burst=1+Math.sin(Math.min(transition,1)*Math.PI)*.035;world.scale.lerp(scaleTarget.setScalar(burst),.06);
        dust.rotation.y=time*.012+shown*.1;dust.position.x=-mx*.4;camera.position.x+=(mx*.32-camera.position.x)*.03;camera.position.y+=(-my*.22-camera.position.y)*.03;camera.position.z+=(11.7+[.2,.8,0,.6,.1,.9,0,-.35][shown]-camera.position.z)*.035;camera.lookAt(0,0,0);renderer.render(scene,camera);raf=requestAnimationFrame(tick)};tick();
      dispose=()=>{cancelAnimationFrame(raf);removeEventListener("pointermove",pointer);observer.disconnect();renderer.dispose();lineGeometry.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());dustGeometry.dispose();(dust.material as THREE.Material).dispose();(lines.material as THREE.Material).dispose();core.geometry.dispose();(core.material as THREE.Material).dispose();rings.forEach(r=>r.geometry.dispose());ringMaterial.dispose();tunnel.geometry.dispose();(tunnel.material as THREE.Material).dispose();if(el.contains(renderer.domElement))el.removeChild(renderer.domElement)};
    }).catch(()=>{});return()=>{stopped=true;dispose()};
  },[]);
  return <div className="deck-scene" ref={host} aria-hidden="true"/>;
}
