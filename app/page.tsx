"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeckScene from "./DeckScene";
import TeamConstellation from "./TeamConstellation";
import ParticleV from "./ParticleV";
import { answer, type Source } from "./lib/demoEngine";
import { renderMarkdown } from "./lib/markdown";
import "./presentation.css";

type Speaker = "SABRINA" | "KALEB" | "REBEKAH" | "MILA" | "MAX";
type Visual = "slop" | "promise" | "environment" | "district" | "privacy" | "team" | "close";
type Slide = { speaker:Speaker; chapter:string; title:React.ReactNode; body:React.ReactNode; script:string; seconds:number; visual:Visual; tone:"ink"|"acid"|"paper"|"photo"|"water"; photo:string; video?:string; credit:string };

const team = [
  {name:"Mila",strength:"PROGRAMMING",experience:"Three years on Nevada's top robotics team and three seasons building number-one VRC programs.",impact:"Gave VEGA structure."},
  {name:"Rebekah",strength:"RESEARCH + FLEXIBILITY",experience:"Robotics since sixth grade and creator of a color-detection science-fair app.",impact:"Made VEGA responsible."},
  {name:"Sabrina",strength:"WRITING + PUBLIC SPEAKING",experience:"Speech and Debate secretary, NCL competitor, and County Championship finalist.",impact:"Gave VEGA a voice."},
  {name:"Kaleb",strength:"DESIGN + COLLABORATION",experience:"Multimedia designer, event organizer, cellist, and NCL team competitor.",impact:"Made VEGA stand out."},
  {name:"Max",strength:"MACHINE LEARNING + WEB",experience:"Cyber Club president, systems builder, all-state musician, and top-one-percent NCL competitor.",impact:"Turned five ideas into one prototype."},
];

const slides: Slide[] = [
  {
    speaker:"SABRINA", chapter:"AI SLOP", title:<>Ten seconds.<br/><em>Infinite slop.</em></>,
    body:<><strong>No audience.</strong><strong>No purpose.</strong><strong>The same voice.</strong><p>AI made for everyone starts to sound like no one, and school is not immune.</p></>,
    script:"If you were to pull out your phone right now and scroll on Instagram for ten seconds, it is almost guaranteed that you would come across AI slop. Maybe it is a fake story, a six-fingered person, or that same robotic voice reading a video. It was generated for everyone, which means it was really made for no one. The same problem appears when we use AI for school. We receive generic answers, questionable information, and writing that makes every student sound exactly the same. AI is getting more powerful. But is it actually getting better for us? That question led us to VEGA.",
    seconds:35, visual:"slop", tone:"photo", photo:"/phone-scroll.jpg", credit:"Late-night scrolling · Pexels"
  },
  {
    speaker:"SABRINA", chapter:"MEET VEGA", title:<>Ask VEGA<br/><em>something real.</em></>,
    body:<><p>Our prototype for an AI platform designed specifically for CCSD, built for our students, teachers, and community instead of everyone on Earth.</p><strong className="prototype-proofline">ASK IT SOMETHING. THIS BOX ACTUALLY RUNS.</strong></>,
    script:"VEGA is our prototype for an AI platform designed specifically for CCSD. It is not trying to serve every person on Earth. It is designed to serve our students, our teachers, and our community. Let us show you what that means. Imagine that I missed part of a math lesson. I can ask: can you explain this without just giving me the answer? VEGA guides me through the problem, adjusts the explanation to my level, and shows the trusted sources behind its response. It can help a teacher develop an activity. It can help a student understand an assignment. It can support your writing without replacing your voice. And unlike a general chatbot, VEGA is built around three specific priorities: our environment, our district, and our privacy. Kaleb will start with the environment.",
    seconds:50, visual:"promise", tone:"photo", photo:"/server-rack.jpg", credit:"District server infrastructure · Unsplash"
  },
  {
    speaker:"KALEB", chapter:"BUILT FOR LAS VEGAS", title:<>Our servers run<br/><em>on air, not water.</em></>,
    body:<><p>A smaller local system designed for one district, not a hyperscale facility built for the world.</p><strong>Water is not unlimited here. Our hardware choice should reflect that.</strong><span className="honesty">AIR-COOLED · NO ONSITE EVAPORATIVE WATER USE</span></>,
    script:"We live in a desert, so when we hear that AI can consume water for cooling, we should be concerned. (Advance to the Lake Mead comparison.) These images show how dramatically Lake Mead has changed. Water is not an unlimited resource here. That is why our proposal uses smaller, air-cooled servers located within the district. Fans remove heat from the equipment, so the system would not consume water through evaporative cooling at the site. VEGA will still require electricity. We are not pretending technology has no environmental cost. But, here's the catch: the difference is scale. VEGA would not be a massive data center serving the entire world. It would be a focused system sized for one school district. We designed the infrastructure around the place where it would actually operate. Now Rebekah will show what that infrastructure could make possible.",
    seconds:40, visual:"environment", tone:"water", photo:"/desert-mesa.jpg", credit:"Nevada desert · Unsplash"
  },
  {
    speaker:"REBEKAH", chapter:"CONNECTING CCSD", title:<>One resource,<br/><em>shared across every school.</em></>,
    body:<><p>Approved lessons, activities, and sources available across CCSD.</p><strong>Teachers keep their judgment. VEGA gives every school a trusted starting point.</strong><span className="evidence-line">ONE TRUSTED RESOURCE LAYER · EVERY SCHOOL · EVERY DEVICE</span></>,
    script:"CCSD has hundreds of schools and thousands of educators, but teachers often have to solve the same problems separately. One teacher creates a lesson from scratch while another teacher across the district may have already created exactly what they need. VEGA could provide a district-controlled space where educators find approved resources, adapt them for their students, and share their own work. (Follow the connections on the district animation.) It would not tell every teacher to teach in exactly the same way. It would give them a better starting point. That saves time, encourages collaboration, and gives students at different schools access to more consistent support. A shared system also lets CCSD establish shared protections. Mila will explain why that matters.",
    seconds:40, visual:"district", tone:"ink", photo:"/network-panel.jpg", credit:"District network infrastructure · Unsplash"
  },
  {
    speaker:"MILA", chapter:"PRIVACY YOU CAN SEE", title:<>Your question<br/><em>never leaves the district.</em></>,
    body:<><strong>DISTRICT-CONTROLLED INFRASTRUCTURE</strong><strong>NOT COMMERCIAL TRAINING DATA</strong><strong>SOURCES SHOWN BESIDE ANSWERS</strong><p>Important answers remain visible, sourced, and checkable.</p><span className="evidence-line">VISIBLE PRIVACY CHECK · VISIBLE SOURCES · VISIBLE LIMITS</span></>,
    script:"When you enter information into an online AI platform, your request may leave the district and travel through systems controlled by an outside company. With VEGA, the goal is different. (Follow the privacy animation from the student to the district server.) The request travels to district-controlled infrastructure and stops there. Student conversations would not be sold to advertisers or used to train a commercial model. CCSD would control access and establish protections designed for its own students. We also designed the prototype to show sources beside its answers. (Point to the source panel.) VEGA could still make mistakes. Every AI can. The difference is that students and teachers can see where an answer came from and check it for themselves. We are not asking anyone to blindly trust AI. We are designing AI that can be questioned.",
    seconds:40, visual:"privacy", tone:"photo", photo:"/circuit-board.jpg", credit:"Local processing hardware · Unsplash"
  },
  {
    speaker:"MAX", chapter:"OUR DRIVING QUESTION", title:<>We each brought<br/><em>something different.</em></>,
    body:<><span className="driving-question">How can our team use our individual strengths and experiences to create future opportunities?</span><strong className="direct-answer">Together, we turned five individual experiences into one opportunity none of us could have created separately.</strong></>,
    script:"Our driving question was: how can our team use our individual strengths and experiences to create future opportunities? This project is our answer. (Reveal each team member.) Mila used her programming experience to help give the idea structure. Rebekah researched how VEGA could responsibly support students and teachers. Sabrina turned our research into a message people could understand. Kaleb created the visual identity and helped make VEGA stand out. I used my experience with machine learning and web design to combine all those ideas into the functional prototype you see today. Our strengths were different, but that was not a weakness. That was the reason the project worked. Together, we turned five individual experiences into one opportunity that none of us could have created separately.",
    seconds:40, visual:"team", tone:"photo", photo:"/students-classroom.jpg", credit:"Valley High School · The Nevada Independent"
  },
  {
    speaker:"MAX", chapter:"OUR FUTURE", title:<>Built for our schools.<br/><em>Built by us.</em></>,
    body:<><p>Test VEGA with real students and teachers, on district-controlled hardware, with clear protections for student data.</p><strong>DOES IT HELP STUDENTS LEARN?</strong><strong>DOES IT SAVE TEACHERS TIME?</strong><strong>CAN OUR COMMUNITY TRUST IT?</strong><p className="questions-line">We're happy to answer your questions.</p></>,
    script:"VEGA is only a prototype. But the idea behind it is much bigger. AI is already in our schools. The question is not whether students will use it. The question is who it is built for, who controls it, and what we want it to do. We believe the next step is to test VEGA with real students and teachers, on district-controlled hardware, with trusted educational sources, and with clear protections for student data. Then we ask the questions that actually matter: does it help students learn? Does it save teachers time? Can our community trust it? Because the future of education should not just happen to us. We should have a role in building it. Five students started with one question and five different strengths. We ended with something none of us could have built alone. This is VEGA. Built for our schools. Built for our community. Built by students who believe we should help shape what comes next. Feel free to scan our QR code to test our demo, and we are happy to answer any questions. Thank you.",
    seconds:40, visual:"close", tone:"photo", photo:"/vegas-skyline.jpg", video:"/vegas-loop.mp4", credit:"Las Vegas Strip"
  },
];

const duration = slides.reduce((sum,slide)=>sum+slide.seconds,0);

function VegaMark({large=false}:{large?:boolean}){return <span className={`vega-mark${large?" large":""}`} aria-label="VEGA"><img src="/vega-logo.png" alt=""/><strong>VEGA</strong></span>}
function AppGlyph(){return <span className="app-glyph" aria-hidden="true"><i/><i/></span>}

function TimedCaption({steps,pace=2200}:{steps:string[];pace?:number}){
  const [step,setStep]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setStep(value=>(value+1)%steps.length),pace);return()=>window.clearInterval(id)},[pace,steps.length]);
  return <div className="timed-caption" key={`${step}-${steps[step]}`}><i>{String(step+1).padStart(2,"0")}</i><span><small>WHAT IS HAPPENING</small><b>{steps[step]}</b></span><em>{String(steps.length).padStart(2,"0")}</em></div>
}

function TeamShowcase(){
  const [focus,setFocus]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setFocus(value=>(value+1)%team.length),3400);return()=>window.clearInterval(id)},[]);
  const person=team[focus];
  return <div className="team-showcase">
    <TeamConstellation team={team} focus={focus}/>
    <article key={person.name} className="team-bio-card"><div><span>NOW SPOTLIGHTING</span><b>{person.name}</b></div><strong>{person.strength}</strong><p>{person.experience}</p><small>{person.impact}</small><em>{String(focus+1).padStart(2,"0")} / 05</em></article>
  </div>
}

function useStepCycle(count:number,pace:number){
  const [step,setStep]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setStep(value=>(value+1)%count),pace);return()=>window.clearInterval(id)},[count,pace]);
  return step;
}

function DistrictDemo(){
  const steps=["A teacher searches the shared library","VEGA finds an approved CCSD resource","The teacher adapts it for this class","The improved activity returns to the district"];
  const flowLabels=["FIND","ADAPT","SHARE"];
  const flowStep=useStepCycle(flowLabels.length,1500);
  return <div className="visual-stack">
    <div className="evidence-row">
      <figure className="evidence-photo"><img src="/team-classroom.jpg" alt="CCSD students working on laptops together in a classroom"/><figcaption>CCSD classroom · The Nevada Independent</figcaption></figure>
      <div className="district-demo"><header><AppGlyph/><b>VEGA RESOURCE EXCHANGE</b><span>CCSD NETWORK</span></header><div className="district-search"><span>⌕</span><p>slope exit ticket for Algebra I</p><i>SEARCH</i></div><div className="district-result"><small>APPROVED RESOURCE</small><b>Graphing Linear Relationships</b><p>Exit ticket · 5 questions · Accessible format</p><div><span>South CTA</span><span>CCSD REVIEWED</span></div></div><div className="district-flow">{flowLabels.flatMap((label,i)=>[i>0&&<i key={`arrow${i}`} className={i-1===flowStep?"pulse":i-1<flowStep?"done":""}>→</i>,<span key={label} className={i===flowStep?"active":i<flowStep?"done":""}>{label}</span>])}</div><footer><b>327 SCHOOLS</b><span>ONE TRUSTED STARTING POINT</span></footer></div>
    </div>
    <TimedCaption steps={steps} pace={2100}/>
  </div>
}

function PrivacyDemo(){
  const steps=["The prompt stays inside the district boundary","VEGA checks for private information","The local model builds a guided response","Sources and limits appear beside the answer"];
  const reqStep=useStepCycle(3,1500);
  return <div className="visual-stack">
    <div className="evidence-row">
      <figure className="evidence-photo"><img src="/laptop-code.jpg" alt="A laptop running local code, representing on-device processing"/><figcaption>Local processing · Unsplash</figcaption></figure>
      <div className="privacy-demo"><header><AppGlyph/><b>VEGA PRIVACY TRACE</b><span><i/> PROTECTED</span></header><section><div className={`privacy-device${reqStep===0?" active":reqStep>0?" done":""}`}><small>STUDENT DEVICE</small><b>Explain this assignment</b></div><i className={reqStep===0?"pulse":reqStep>0?"done":""}>→</i><div className={`privacy-core${reqStep===1?" active":reqStep>1?" done":""}`}><span>LOCAL</span><b>CCSD</b><small>PRIVACY CHECK</small></div><i className={reqStep===1?"pulse":reqStep>1?"done":""}>→</i><div className={`privacy-answer${reqStep===2?" active":""}`}><small>GROUNDED ANSWER</small><b>Guidance + sources</b></div></section><div className="privacy-bar"><span>NO AD NETWORK</span><span>NO COMMERCIAL TRAINING</span><span>NO THIRD-PARTY SALE</span></div><footer><b>REQUEST PATH</b><span>DEVICE → DISTRICT SERVER → STUDENT</span></footer></div>
    </div>
    <TimedCaption steps={steps} pace={2200}/>
  </div>
}

function EnvironmentEvidence(){return <div className="environment-evidence">
  <div className="lake-compare">
    <figure><img src="/lake-mead-2000.jpg" alt="Satellite image of Lake Mead in July 2000, nearly full"/><figcaption>JULY 2000</figcaption></figure>
    <figure><img src="/lake-mead-2022.jpg" alt="Satellite image of Lake Mead in July 2022, dramatically lower"/><figcaption>JULY 2022</figcaption></figure>
    <span>THE STAKES ARE LOCAL · NASA LANDSAT</span>
  </div>
  <div className="air-cooled-strip"><b>0</b><div><strong>Air cooled, not evaporated.</strong><p>Fans carry heat away from district hardware, so no onsite water is lost to evaporation.</p></div></div>
</div>}

const slopPosts = [
  {image:"/slop-catarrest.jpg",tag:"BREAKING",headline:"Muscular cat arrested at mansion",meta:"9.1M views · no source"},
  {image:"/slop-strawberry.jpg",tag:"MUST WATCH",headline:"Strawberry and tomato “so excited”",meta:"same voice · same caption"},
  {image:"/slop-dino.jpg",tag:"FOR KIDS",headline:"Dinosaur screams at crying toddler",meta:"autoplays next · zero context"},
  {image:"/slop-cat-astro.jpg",tag:"VIRAL",headline:"Cat becomes NASA's newest recruit",meta:"4.7M views · fully fabricated"},
  {image:"/slop-fantasy.jpg",tag:"DISCOVER",headline:"Scientists find planet with talking rivers",meta:"zero scientists, zero planet"},
  {image:"/slop-earthhug.jpg",tag:"INSPIRING",headline:"Woman saves planet with one hug",meta:"same stock caption, every feed"},
  {image:"/slop-dog-astro.jpg",tag:"BREAKING",headline:"Good boy promoted to mission commander",meta:"12M views, not NASA"},
];

function SlopBook(){
  const [index,setIndex]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setIndex(value=>(value+1)%slopPosts.length),5000);return()=>window.clearInterval(id)},[]);
  const left=slopPosts[index];
  const right=slopPosts[(index+1)%slopPosts.length];
  return <div className="slop-book" aria-label="A flipping feed of AI slop examples, five seconds each">
    <div className="slop-book-row">
      <article key={`l-${left.headline}`}><img src={left.image} alt=""/><i/><div><span>{left.tag}</span><b>{left.headline}</b><small>{left.meta}</small></div></article>
      <article key={`r-${right.headline}`}><img src={right.image} alt=""/><i/><div><span>{right.tag}</span><b>{right.headline}</b><small>{right.meta}</small></div></article>
    </div>
    <div className="slop-book-dots">{slopPosts.map((item,i)=><i key={item.headline} className={i===index||i===(index+1)%slopPosts.length?"active":""}/>)}</div>
    <strong>THE FEED NEVER RUNS OUT.<br/><em>THE IDEAS ALREADY DID.</em></strong>
  </div>
}

function SlopeGraph({revealed}:{revealed:boolean}){
  // Equal pixels-per-unit on both axes -- a slope of 2 should look like a
  // slope of 2, not be stretched or squashed by mismatched grid cells.
  const pad=30,h=210,xMax=6,yMax=9;
  const scale=(h-pad*2)/yMax;
  const w=pad*2+xMax*scale;
  const toX=(x:number)=>pad+x*scale;
  const toY=(y:number)=>h-pad-y*scale;
  const a={x:1,y:2},b={x:4,y:8};
  return <svg className={`slope-graph${revealed?" revealed":""}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Graph of a line through the points 1, 2 and 4, 8 with a slope of 2">
    <g className="grid">{Array.from({length:xMax+1}).map((_,i)=><line key={`v${i}`} x1={toX(i)} x2={toX(i)} y1={toY(0)} y2={toY(yMax)}/>)}{Array.from({length:4}).map((_,i)=>{const y=i*3;return <line key={`h${i}`} x1={toX(0)} x2={toX(xMax)} y1={toY(y)} y2={toY(y)}/>})}</g>
    <line className="axis" x1={toX(0)} x2={toX(xMax)} y1={toY(0)} y2={toY(0)}/>
    <line className="axis" x1={toX(0)} x2={toX(0)} y1={toY(0)} y2={toY(yMax)}/>
    <line className="run-dash" x1={toX(a.x)} x2={toX(b.x)} y1={toY(a.y)} y2={toY(a.y)}/>
    <line className="rise-dash" x1={toX(b.x)} x2={toX(b.x)} y1={toY(a.y)} y2={toY(b.y)}/>
    <line className="fit" x1={toX(.3)} x2={toX(4.5)} y1={toY(.6)} y2={toY(9)}/>
    <circle cx={toX(a.x)} cy={toY(a.y)} r={4.5}/>
    <circle cx={toX(b.x)} cy={toY(b.y)} r={4.5}/>
    <text x={(toX(a.x)+toX(b.x))/2} y={toY(a.y)+16} textAnchor="middle">run 3</text>
    <text x={toX(b.x)+9} y={(toY(a.y)+toY(b.y))/2} dominantBaseline="middle">rise 6</text>
    <text className="eqn" x={toX(0)} y={16}>y = 2x</text>
  </svg>
}

function TypedText({text,onDone}:{text:string;onDone?:()=>void}){
  const [count,setCount]=useState(0);
  const doneRef=useRef(onDone);
  doneRef.current=onDone;
  useEffect(()=>{
    setCount(0);
    const perTick=Math.max(1,Math.round(text.length/58));
    const id=window.setInterval(()=>{
      setCount(value=>{
        const next=Math.min(text.length,value+perTick);
        if(next>=text.length){window.clearInterval(id);window.setTimeout(()=>doneRef.current?.(),320)}
        return next;
      });
    },26);
    return()=>window.clearInterval(id);
  },[text]);
  return <>{text.slice(0,count)}<i className="type-caret"/></>;
}

type DemoMsg = { id:number; who:"user"|"vega"; text:string; sources?:Source[] };
type DemoStage = "idle"|"intro-q"|"intro-thinking"|"intro-a"|"intro-graph"|"ready";
const demoStarters = ["Tutor me on slope","Help me improve a thesis","Where are my grades?"];
const introQuestion = "Can you explain this without just giving me the answer?";
const introAnswer = "Let's keep the thinking yours. Slope measures how much y changes for each 1-unit change in x. On the graph, x moves from 1 to 4 while y moves from 2 to 8, so that's a run of 3 and a rise of 6. Divide rise by run and tell me what you get.";

function LiveDemo(){
  const [stage,setStage]=useState<DemoStage>("idle");
  const [messages,setMessages]=useState<DemoMsg[]>([]);
  const [typingId,setTypingId]=useState<number|null>(null);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [engine,setEngine]=useState<"checking"|"live"|"demo">("checking");
  const endRef=useRef<HTMLDivElement>(null);
  const idRef=useRef(0);

  useEffect(()=>{fetch("/api/chat").then(r=>r.json()).then(data=>setEngine(data.connected?"live":"demo")).catch(()=>setEngine("demo"))},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth",block:"end"})},[messages,busy,stage]);

  // Stage the built-in example so it plays out like a real exchange: type the
  // question, pause to "think," type the answer, then draw the graph.
  useEffect(()=>{
    if(stage==="idle"){
      const id=window.setTimeout(()=>{
        const questionId=idRef.current+=1;
        setMessages([{id:questionId,who:"user",text:introQuestion}]);
        setTypingId(questionId);
        setStage("intro-q");
      },600);
      return()=>window.clearTimeout(id);
    }
    if(stage==="intro-thinking"){
      const id=window.setTimeout(()=>{
        const answerId=idRef.current+=1;
        setMessages(list=>[...list,{id:answerId,who:"vega",text:introAnswer}]);
        setTypingId(answerId);
        setStage("intro-a");
      },900);
      return()=>window.clearTimeout(id);
    }
    if(stage==="intro-graph"){
      const id=window.setTimeout(()=>setStage("ready"),1300);
      return()=>window.clearTimeout(id);
    }
  },[stage]);

  const handleTyped=useCallback((messageId:number)=>{
    setTypingId(null);
    if(messageId===1)setStage("intro-thinking");
    else if(messageId===2)setStage("intro-graph");
  },[]);

  const ask=useCallback(async(event?:FormEvent,preset?:string)=>{
    event?.preventDefault();
    if(stage!=="ready")return;
    const text=(preset??input).trim();
    if(!text||busy)return;
    const userId=idRef.current+=1;
    const userMsg:DemoMsg={id:userId,who:"user",text};
    const history=[...messages,userMsg];
    setMessages(history);setInput("");setBusy(true);
    const local=answer(text,"Student","Tutor");
    let replyText=local.text,liveEngine:"live"|"demo"="demo";
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:"Student",mode:"Tutor",messages:history.map(m=>({who:m.who,text:m.text}))})});
      if(!response.ok)throw new Error("fallback");
      const data=await response.json() as {text?:string};
      if(!data.text)throw new Error("fallback");
      replyText=data.text;liveEngine="live";
    }catch{
      liveEngine="demo";
    }
    const replyId=idRef.current+=1;
    setMessages(list=>[...list,{id:replyId,who:"vega",text:replyText,sources:local.sources}]);
    setTypingId(replyId);
    setEngine(liveEngine);
    setBusy(false);
  },[busy,input,messages,stage]);

  const graphRevealed=stage==="intro-graph"||stage==="ready";
  const thinking=stage==="intro-thinking"||busy;
  const locked=stage!=="ready";

  return <div className="live-demo" onClick={event=>event.stopPropagation()}>
    <header><span className="demo-brand"><AppGlyph/><b>VEGA</b></span><span className={engine==="live"?"is-live":""}><i/>{engine==="checking"?"CHECKING ENGINE":engine==="live"?"LIVE MODEL CONNECTED":"LOCAL DEMO ENGINE"}</span></header>
    <div className="live-demo-body">
      <div className={`live-demo-graph${graphRevealed?" revealed":""}`}><SlopeGraph revealed={graphRevealed}/><small>Premade example · slope = rise ÷ run = 2</small></div>
      <div className="live-demo-chat">
        <div className="live-demo-messages">
          {messages.map(message=>{
            const isTyping=typingId===message.id;
            return <article key={message.id} className={message.who}>
              <i>{message.who==="vega"?"V":"Y"}</i>
              <div>{isTyping?<p><TypedText text={message.text} onDone={()=>handleTyped(message.id)}/></p>:<div className="md">{renderMarkdown(message.text)}</div>}{!isTyping&&message.sources&&<div className="live-demo-sources">{message.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()}>{source.name} ↗</a>)}</div>}</div>
            </article>
          })}
          {thinking&&<article className="vega thinking"><i>V</i><div className="thinking-dots"><span/><span/><span/></div></article>}
          <div ref={endRef}/>
        </div>
        <div className="live-demo-suggest">{demoStarters.map(starter=><button key={starter} type="button" onClick={()=>ask(undefined,starter)} disabled={busy||locked}>{starter}</button>)}</div>
        <form onSubmit={ask}><input value={input} onChange={event=>setInput(event.target.value)} placeholder={locked?"VEGA is answering the first question…":"Ask VEGA a real question…"} aria-label="Ask VEGA a question" disabled={busy||locked}/><button disabled={!input.trim()||busy||locked}>Ask →</button></form>
      </div>
    </div>
  </div>
}

function Visual({type}:{type:Visual}){
  if(type==="slop")return <div className="visual-stack"><SlopBook/><TimedCaption steps={["The feed rewards speed","The same patterns repeat","Your voice disappears"]} pace={1900}/></div>;
  if(type==="promise")return <LiveDemo/>;
  if(type==="environment")return <div className="visual-stack"><EnvironmentEvidence/><TimedCaption steps={["The local environment defines the requirement","Fans carry heat away from the hardware","No onsite water evaporates"]} pace={2200}/></div>;
  if(type==="district")return <DistrictDemo/>;
  if(type==="privacy")return <PrivacyDemo/>;
  if(type==="team")return <TeamShowcase/>;
  return <div className="closing-visual"><ParticleV startDelay={1.1}/><div className="qr-caption"><b>SCAN TO TRY VEGA</b><span>vega.doubinemail.workers.dev/prototype</span></div></div>;
}

export default function Home(){
  const [active,setActive]=useState(0);const [notes,setNotes]=useState(false);const [playing,setPlaying]=useState(false);const [started,setStarted]=useState(false);const [intro,setIntro]=useState<"ready"|"playing"|"hold"|"done">("ready");const [remaining,setRemaining]=useState(duration);const [closingTransition,setClosingTransition]=useState<"idle"|"playing">("idle");const [bridged,setBridged]=useState(false);const touchStart=useRef(0);const introVideo=useRef<HTMLVideoElement>(null);const slide=slides[active];const elapsed=duration-remaining;
  const timeline=useMemo(()=>Math.max(0,Math.min(100,elapsed/duration*100)),[elapsed]);
  const go=useCallback((next:number)=>{const target=Math.max(0,Math.min(slides.length-1,next));if(target===active)return;if(active===slides.length-2&&target===slides.length-1){setActive(target);setClosingTransition("playing");setBridged(true);return}document.documentElement.dataset.slideDirection=target>active?"forward":"back";const doc=document as Document&{startViewTransition?:(update:()=>void)=>void};if(doc.startViewTransition)doc.startViewTransition(()=>setActive(target));else setActive(target)},[active]);
  const endClosingTransition=useCallback(()=>{setClosingTransition("idle")},[]);
  const startPresentation=useCallback(()=>{setActive(0);setRemaining(duration);setNotes(false);setPlaying(false);setStarted(false);setIntro("playing");document.documentElement.requestFullscreen?.().catch(()=>{})},[]);
  const finishIntro=useCallback(()=>{setIntro("done");window.setTimeout(()=>{setStarted(true);setPlaying(true)},650)},[]);
  useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setRemaining(value=>{if(value<=1){setPlaying(false);return 0}return value-1}),1000);return()=>window.clearInterval(id)},[playing]);

  // Gradual slow-down into the final beat of the cinematic opening, instead of a hard cut.
  useEffect(()=>{
    if(intro!=="playing")return;
    const video=introVideo.current;if(!video)return;
    const SLOWDOWN_WINDOW=2.4,MIN_RATE=0.45;
    let raf=0;
    const onMeta=()=>{if(video.duration)video.parentElement?.style.setProperty("--intro-duration",`${video.duration}s`)};
    video.addEventListener("loadedmetadata",onMeta);
    const setRate=(rate:number)=>{if(Math.abs(video.playbackRate-rate)>0.015)video.playbackRate=rate};
    const tick=()=>{
      if(video.duration&&!Number.isNaN(video.duration)){
        const remainingTime=video.duration-video.currentTime;
        if(remainingTime<=SLOWDOWN_WINDOW){
          const t=Math.max(0,remainingTime/SLOWDOWN_WINDOW);
          // Smoothstep instead of t*t: eases the rate down gently at both ends of the
          // window, instead of accelerating the slowdown itself right at the very end
          // (which read as choppy -- each rate change forces the decoder to re-pace).
          const eased=t*t*(3-2*t);
          setRate(MIN_RATE+(1-MIN_RATE)*eased);
        }else{
          setRate(1);
        }
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);video.removeEventListener("loadedmetadata",onMeta);video.playbackRate=1};
  },[intro]);

  useEffect(()=>{const key=(event:KeyboardEvent)=>{const target=event.target as HTMLElement|null;if(target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable))return;if(intro==="ready"&&event.key==="Enter"){event.preventDefault();startPresentation();return}if(intro==="hold"&&["Enter"," ","ArrowRight","ArrowDown","PageDown"].includes(event.key)){event.preventDefault();finishIntro();return}if(!started)return;if(["ArrowRight","ArrowDown","PageDown"," "].includes(event.key)){event.preventDefault();go(active+1)}if(["ArrowLeft","ArrowUp","PageUp"].includes(event.key))go(active-1);if(event.key.toLowerCase()==="n")setNotes(value=>!value);if(event.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.();if(event.key.toLowerCase()==="r"){setRemaining(duration);setActive(0);setPlaying(false);setStarted(false);setIntro("ready")}};addEventListener("keydown",key);return()=>removeEventListener("keydown",key)},[active,finishIntro,go,intro,started,startPresentation]);
  return <main className={`deck tone-${slide.tone}${closingTransition==="playing"?" bridging":""}${bridged?" bridged":""}`} onTouchStart={event=>touchStart.current=event.touches[0].clientX} onTouchEnd={event=>{const distance=event.changedTouches[0].clientX-touchStart.current;if(Math.abs(distance)>55)go(active+(distance<0?1:-1))}}>
    <DeckScene slide={active+1}/><div className="deck-noise"/>
    <header className="deck-topbar"><span className="deck-wordmark">VEGA <i>CCSD LOCAL AI</i></span><div className="single-mode"><b>{started?"LIVE":"READY"}</b><span>5 MINUTE PRESENTATION</span></div><div className="deck-actions"><Link href="/prototype">EXPLORE FULL PROTOTYPE ↗</Link><button onClick={()=>document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen">⛶</button></div></header>
    <section key={active} className={`deck-slide slide-${active+1}`} onClick={event=>{const target=event.target as HTMLElement;if(!target.closest("a,button,input,.speaker-note,.live-demo"))go(active+1)}}>
      <div className="slide-photo">{slide.video?<video src={slide.video} autoPlay muted loop playsInline poster={slide.photo}/>:<img src={slide.photo} alt=""/>}<i/><small>{slide.credit}</small></div>
      <div className="slide-copy"><div className="slide-meta"><span>{String(active+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span><b>{slide.speaker}</b></div><h1>{slide.title}</h1><div className="slide-body">{slide.body}</div></div>
      <div className="slide-graphic"><Visual type={slide.visual}/></div>
      {notes&&<aside className="speaker-note"><div><span>{slide.speaker}</span><b>FULL SCRIPT</b></div><p>{slide.script}</p></aside>}
    </section>
    <footer className="deck-controls"><div className="time"><button onClick={()=>setPlaying(value=>!value)} aria-label={playing?"Pause timer":"Start timer"}>{playing?"Ⅱ":"▶"}</button><b>{String(Math.floor(remaining/60)).padStart(2,"0")}:{String(remaining%60).padStart(2,"0")}</b><span>{playing?"LIVE":"READY"}</span></div><div className="slide-dots">{slides.map((item,i)=><button key={item.chapter} className={i===active?"active":i<active?"past":""} onClick={()=>go(i)} aria-label={`Go to slide ${i+1}`}><i/><span>{item.speaker}</span></button>)}</div><div className="nav-buttons"><button onClick={()=>setNotes(value=>!value)} className={notes?"active":""}>N · SCRIPT</button><button onClick={()=>go(active-1)} disabled={active===0}>←</button><b>{String(active+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</b><button onClick={()=>go(active+1)} disabled={active===slides.length-1}>→</button></div><i className="timeline"><span style={{width:`${timeline}%`}}/></i></footer>
    {closingTransition==="playing"&&<div className="closing-transition"><video src="/datacenter-transition.mp4" autoPlay muted playsInline onEnded={endClosingTransition} onError={endClosingTransition}/></div>}
    {intro==="ready"&&<div className="launch-screen" onClick={event=>event.stopPropagation()}><div className="launch-card"><span className="launch-kicker">PRESENTER VIEW</span><VegaMark large/><h2>Ready<br/><em>when you are.</em></h2><p>Click start for the cinematic opening. It ends on the title card, then hands off to slide one.</p><button onClick={startPresentation}><span>START PRESENTATION</span><i>→</i></button><small>PRESS ENTER TO START · ARROWS OR SPACE TO ADVANCE · N FOR SCRIPT</small></div></div>}
    {(intro==="playing"||intro==="hold"||(!started&&intro==="done"))&&<div className={`cinematic-intro ${intro==="hold"?"holding":""} ${intro==="done"?"finishing":""}`} onClick={event=>{event.stopPropagation();if(intro==="hold")finishIntro()}}><video ref={introVideo} src="/vega-intro.mp4" poster="/vega-intro-poster.jpg" autoPlay muted playsInline onEnded={()=>setIntro("hold")} onError={()=>setIntro("hold")}/><div className="cinematic-shade"/><div className="cinematic-scan"/><div className="cinematic-blackout"/><div className="cinematic-title"><span>CCSD LOCAL INTELLIGENCE</span><div className="cinematic-name"><b>V</b><strong>VEGA</strong></div><p>DESIGNED HERE <i/> BUILT FOR HERE</p><div className="cinematic-team"><span>SABRINA</span><span>KALEB</span><span>REBEKAH</span><span>MILA</span><span>MAX</span></div></div><div className="cinematic-progress"><span/><small>{intro==="hold"?"PRESS SPACE TO BEGIN":"INITIALIZING PRESENTATION"}</small></div><button onClick={event=>{event.stopPropagation();if(intro==="hold")finishIntro();else setIntro("hold")}}>{intro==="hold"?"BEGIN PRESENTATION":"SKIP TO TITLE"}</button></div>}
  </main>;
}
