"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroScene from "./HeroScene";
import "./cinematic.css";

type Role = "Student" | "Teacher" | "Family" | "Staff";
const roleCopy: Record<Role, { eyebrow: string; title: string; body: string; prompt: string }> = {
  Student: { eyebrow: "LEARN WITHOUT LOSING THE LEARNING", title: "A tutor that gives you the next step—not the final answer.", body: "VEGA asks questions, adapts the explanation, starts study mode, and keeps the student’s thinking at the center.", prompt: "Help me understand slope without doing it for me." },
  Teacher: { eyebrow: "LESS PLANNING FRICTION", title: "From an objective to tomorrow’s lesson.", body: "Build a learning sequence, differentiation, language supports, and an exit ticket inside one protected workspace.", prompt: "Plan a 45-minute lesson with a check for understanding." },
  Family: { eyebrow: "NO JARGON. NO BARRIER.", title: "School information that feels understandable.", body: "Explain an assignment, translate a notice, find the official portal, and prepare a respectful message for the school.", prompt: "Explain this assignment in clear Spanish and English." },
  Staff: { eyebrow: "POLICY MADE OPERATIONAL", title: "Controls the district can see and shape.", body: "Define roles, retention, approved sources, safety escalation, evaluation metrics, and the boundaries of a measured pilot.", prompt: "Map this use case to safeguards and pilot evidence." },
};

const sources = [
  ["CCSD", "District information", "https://www.ccsd.net/"],
  ["Canvas", "Courses and assignments", "https://canvas.ccsd.net/"],
  ["Campus", "Grades and attendance", "https://campusportal.ccsd.net/"],
  ["SAFE", "Student data privacy", "https://safe.ccsd.net/"],
  ["StuTech", "Device and account help", "https://stutech.ccsd.net/"],
  ["Transport", "Routes and eligibility", "https://transportation.ccsd.net/"],
];

function VegaMark() { return <span className="v-mark" aria-hidden="true">V</span>; }

export default function Home() {
  const [role, setRole] = useState<Role>("Student");
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const update = () => setProgress(Math.min(100, window.scrollY / Math.max(document.documentElement.scrollHeight - innerHeight, 1) * 100));
    update(); addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);

  return <main className="cinematic-site">
    <div className="v-progress"><i style={{ width: `${progress}%` }} /></div>
    <HeroScene />

    <nav className="v-nav" aria-label="Primary navigation">
      <a href="#top" className="v-brand"><VegaMark /><b>VEGA</b></a>
      <div className={menu ? "v-links open" : "v-links"}><a href="#people" onClick={() => setMenu(false)}>For everyone</a><a href="#privacy" onClick={() => setMenu(false)}>Privacy</a><a href="#prototype" onClick={() => setMenu(false)}>Prototype</a><a href="#sources" onClick={() => setMenu(false)}>Sources</a></div>
      <div className="v-nav-end"><Link href="/prototype">Open VEGA</Link><button onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? "×" : "☰"}</button></div>
    </nav>

    <section id="top" className="v-screen v-hero">
      <div className="v-hero-copy">
        <span className="v-kicker"><i /> A LOCAL AI VISION FOR CCSD</span>
        <h1>Intelligence.<br /><em>On our terms.</em></h1>
        <p>A private, district-shaped AI workspace for every student, educator, family, and staff member in Clark County.</p>
        <div className="v-actions"><Link href="/prototype">Try the working prototype</Link><a href="#privacy">See how it protects people <span>↓</span></a></div>
      </div>
      <div className="v-scroll"><span>SCROLL TO EXPLORE</span><i /></div>
      <div className="v-status"><i /><span><b>VEGA CORE</b><small>Interactive · move your pointer</small></span></div>
    </section>

    <section className="v-statement v-screen">
      <p>AI is already in the classroom.</p>
      <h2>The real decision is<br /><em>whose rules it follows.</em></h2>
    </section>

    <section id="people" className="v-screen v-people">
      <div className="v-section-head"><span>01 / BUILT FOR PEOPLE</span><h2>One system.<br />Four perspectives.</h2></div>
      <div className="v-role-layout">
        <div className="v-role-tabs" role="tablist">{(["Student", "Teacher", "Family", "Staff"] as Role[]).map(item => <button key={item} role="tab" aria-selected={role === item} className={role === item ? "active" : ""} onClick={() => setRole(item)}><span>0{(["Student", "Teacher", "Family", "Staff"] as Role[]).indexOf(item) + 1}</span>{item}</button>)}</div>
        <article key={role} className="v-role-copy"><span>{roleCopy[role].eyebrow}</span><h3>{roleCopy[role].title}</h3><p>{roleCopy[role].body}</p><blockquote>“{roleCopy[role].prompt}”</blockquote><Link href="/prototype">Enter the {role.toLowerCase()} workspace <b>↗</b></Link></article>
      </div>
    </section>

    <section className="v-photo v-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/real/students-collaborating.jpg" alt="Students collaborating around laptops" />
      <div className="v-photo-shade" />
      <div className="v-photo-copy"><span>DESIGNED AROUND THE ROOM</span><h2>Technology should disappear.<br />Learning should not.</h2><p>VEGA is imagined as infrastructure for the people already doing the work—not another destination competing for their attention.</p></div>
    </section>

    <section id="privacy" className="v-screen v-privacy">
      <div className="v-section-head"><span>02 / PRIVATE BY ARCHITECTURE</span><h2>Your data is not<br />the business model.</h2><p>VEGA proposes local inference, district-defined access, and visible source boundaries. The prototype demonstrates the behavior without pretending the district system already exists.</p></div>
      <div className="v-principles"><article><b>01</b><h3>Local first.</h3><p>Keep model traffic inside infrastructure the district can govern whenever the final deployment makes that possible.</p></article><article><b>02</b><h3>Private by default.</h3><p>Block common sensitive-data patterns, minimize retention, and never build advertising profiles from school conversations.</p></article><article><b>03</b><h3>Human accountable.</h3><p>Show sources, admit uncertainty, preserve teacher judgment, and route serious situations to qualified people.</p></article></div>
    </section>

    <section id="prototype" className="v-screen v-product">
      <div className="v-product-copy"><span>03 / THE WORKING PROTOTYPE</span><h2>It does more than<br />look convincing.</h2><p>Four assistant modes. Four audience workspaces. Persistent conversations, search, privacy detection, official citations, feedback, export, dark mode, mobile navigation, and a secure live-model adapter.</p><Link href="/prototype">Launch the full app <b>↗</b></Link></div>
      <div className="v-device" aria-label="VEGA application preview"><div className="v-device-bar"><i /><i /><i /><span>VEGA / PROTECTED WORKSPACE</span></div><div className="v-device-body"><aside><VegaMark /><b>VEGA</b><button>＋ New conversation</button><small>RECENT</small><p>Understanding slope</p><p>Study plan</p><em>● LOCAL DEMO READY</em></aside><div><header><span>Understanding slope</span><b>Student</b></header><nav><i>✦ Tutor</i><i>▤ Plan</i><i>文 Translate</i><i>⌁ Navigate</i></nav><article><VegaMark /><div><b>VEGA</b><p>Let’s keep the thinking yours. Choose two points, calculate the change in y, then the change in x in the same order.</p><span>GROUNDED ANSWER · PRIVACY CHECK ON</span></div></article><footer>Message VEGA as student… <b>↑</b></footer></div></div></div>
    </section>

    <section id="sources" className="v-screen v-sources">
      <div className="v-section-head"><span>04 / OFFICIAL FIRST</span><h2>Answers should come<br />with a way to check them.</h2></div>
      <div className="v-source-list">{sources.map((item, i) => <a href={item[2]} target="_blank" rel="noreferrer" key={item[0]}><span>0{i + 1}</span><h3>{item[0]}</h3><p>{item[1]}</p><b>↗</b></a>)}</div>
    </section>

    <section className="v-screen v-final">
      <VegaMark />
      <span>A STUDENT-BUILT CONCEPT</span>
      <h2>Build the AI<br />we can stand behind.</h2>
      <p>Start small. Test honestly. Publish the evidence. Let the people who teach and learn shape what comes next.</p>
      <Link href="/prototype">Open VEGA <b>↗</b></Link>
      <footer><div className="v-brand"><VegaMark /><b>VEGA</b></div><p>Independent concept · Not an official CCSD product or endorsement.</p><a href="#top">Back to top ↑</a></footer>
    </section>
  </main>;
}
