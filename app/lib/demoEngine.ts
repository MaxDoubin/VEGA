// Shared local-demo answer engine used by both the presentation's live demo
// (app/page.tsx) and the full prototype (app/prototype/page.tsx), so the two
// stay consistent instead of drifting into separate copies.

export type Role = "Student" | "Teacher" | "Family" | "Staff";
export type Mode = "Tutor" | "Plan" | "Translate" | "Navigate";
export type Source = { name: string; url: string; note: string };
export type EngineReply = { text: string; sources?: Source[]; warning?: string };

export const sources = {
  home: { name: "CCSD Home", url: "https://www.ccsd.net/", note: "District services and information" },
  grades: { name: "Infinite Campus", url: "https://campusportal.ccsd.net/", note: "Grades, attendance, and schedules" },
  canvas: { name: "Canvas", url: "https://canvas.ccsd.net/", note: "Courses, modules, and assignments" },
  canvasHelp: { name: "Canvas Help", url: "https://canvashelp.ccsd.net/", note: "Official Canvas support" },
  privacy: { name: "CCSD Student Data Privacy", url: "https://safe.ccsd.net/", note: "Reviewed apps and privacy guidance" },
  policy: { name: "Acceptable Use + AI", url: "https://www.ccsd.net/legal/acceptable-use-policy", note: "District technology expectations" },
  tech: { name: "CCSD StuTech", url: "https://stutech.ccsd.net/", note: "Device and account support" },
  transport: { name: "CCSD Transportation", url: "https://transportation.ccsd.net/", note: "Routes and eligibility" },
  clever: { name: "Clever", url: "https://clever.ccsd.net/", note: "Approved learning-app launchpad" },
};

export const welcomeText = (role: Role, mode: Mode) =>
  `${role} workspace ready in ${mode} mode. I use a local demonstration engine and fictional data. Choose a starter below or ask your own question. Do not include names, IDs, grades, or other private information.`;

const pii = /\b(?:\d{3}-\d{2}-\d{4}|\d{7,10}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|password|student id|home address|iep|medical record|date of birth|social security)\b/i;

export const promptSets: Record<Mode, Record<Role, string[]>> = {
  Tutor: {
    Student: ["Tutor me on slope", "Start a cell biology quiz", "Help me improve a thesis"],
    Teacher: ["Create guided questions for slope", "Differentiate a reading task", "Make a retrieval quiz"],
    Family: ["Explain an assignment simply", "Help me ask a learning question", "How can I support study time?"],
    Staff: ["Design a tutoring safeguard", "Draft academic-integrity guidance", "List pilot learning metrics"],
  },
  Plan: {
    Student: ["Plan my study week", "Break down a big project", "Make a 25-minute focus plan"],
    Teacher: ["Plan a 45-minute lesson", "Create an exit ticket", "Adapt a lesson for multilingual learners"],
    Family: ["Make a homework routine", "Plan questions for a teacher", "Create a school-week checklist"],
    Staff: ["Draft a 30-day pilot plan", "Create an evaluation scorecard", "Plan a staff training session"],
  },
  Translate: {
    Student: ["Explain directions in Spanish", "Simplify this school notice", "Make this easier to read"],
    Teacher: ["Draft a bilingual family update", "Simplify these directions", "Create a plain-language version"],
    Family: ["Translate a school message", "Explain Canvas in Spanish", "Help me reply to a teacher"],
    Staff: ["Create a multilingual notice", "Audit this for plain language", "Draft accessibility guidance"],
  },
  Navigate: {
    Student: ["Where are my grades?", "How do I open Canvas?", "I need device help"],
    Teacher: ["Find Canvas support", "Show approved technology guidance", "Find district policy"],
    Family: ["Where is attendance?", "Find transportation information", "How do I contact CCSD?"],
    Staff: ["Show privacy sources", "Find acceptable-use guidance", "List trusted CCSD portals"],
  },
};

export function answer(query: string, role: Role, mode: Mode): EngineReply {
  const q = query.toLowerCase();
  if (pii.test(query)) return { text: "I paused before processing that message because it appears to contain private information. Remove names, student IDs, contact details, passwords, grades, medical details, or education records. Then ask again with fictional details.", warning: "Privacy safeguard activated", sources: [sources.privacy, sources.policy] };
  if (/grade|attendance|schedule|campus/.test(q)) return { text: "Open Infinite Campus for current grades, attendance, schedules, assignments, and notices. VEGA cannot see a student record. For privacy, open the official portal directly and never paste the record into this demo.", sources: [sources.grades, sources.privacy] };
  if (/canvas|assignment|module|course/.test(q) && mode === "Navigate") return { text: "Canvas is CCSD's course workspace. Students usually launch it through Clever. If a class is missing, check All Courses, confirm the term, and ask the teacher whether the course is published.", sources: [sources.canvas, sources.canvasHelp, sources.clever] };
  if (/bus|transport|route/.test(q)) return { text: "Use the official CCSD Transportation page for route and eligibility information. Keep addresses out of this prototype; enter them only in the authorized district tool.", sources: [sources.transport] };
  if (/device|password|account|chromebook|tech/.test(q)) return { text: "CCSD StuTech provides official help for devices, passwords, Google, Canvas, and Microsoft 365. Start there, then contact your school if the issue involves an account permission.", sources: [sources.tech] };
  if (/privacy|data|safe|policy|ai rule|acceptable/.test(q)) return { text: "CCSD's published guidance centers educational purpose, protection of personally identifiable information, critical review of AI output, and academic integrity. VEGA's proposed local design follows those boundaries, but any real pilot would still need district security, legal, accessibility, and instructional review.", sources: [sources.policy, sources.privacy] };
  if (mode === "Translate" || /spanish|translate|bilingual/.test(q)) return { text: "Versión clara en español: Puedo explicar el mensaje escolar paso a paso y conservar el significado original. Antes de pegar texto, quite nombres, números de identificación, calificaciones y cualquier información privada. También puedo mostrar una versión en inglés para comparar.", sources: [sources.home] };
  if (mode === "Plan") {
    if (role === "Teacher") return { text: "45-minute learning plan\n\n1. Launch · 5 min: one visual question that reveals prior knowledge.\n2. Model · 8 min: teacher think-aloud with one worked example.\n3. Practice · 20 min: pairs solve, explain, and compare strategies.\n4. Check · 7 min: individual hinge question and targeted reteach.\n5. Exit · 5 min: one transfer problem plus confidence rating.\n\nAdd language frames, a worked-example scaffold, and an extension that asks students to justify a second method.", sources: [sources.canvas] };
    return { text: "Here's a practical plan: define one finish line, split it into three 25-minute blocks, put the hardest block first, and end each block with a one-sentence recap. After block two, take a real break. What deadline and subject should I use to personalize the sequence?" };
  }
  if (/slope|linear|y\s*=|graph/.test(q)) return { text: "Let's keep the thinking yours. Slope measures how much y changes for each 1-unit change in x. Choose two points, calculate change in y, calculate change in x in the same order, then divide. Tell me your two points and I'll check each step instead of jumping to the answer." };
  if (/quiz|test me|study/.test(q)) return { text: "Study mode is on. I'll ask one question at a time, give a hint before revealing anything, and adapt the next question to your answer. First question: explain the topic in one sentence as if you were teaching a sixth grader." };
  if (/essay|paragraph|thesis|write/.test(q)) return { text: "Start with a claim that directly answers the prompt. Under it, write two evidence bullets and one 'so what?' sentence for each. I can challenge your reasoning, suggest structure, and give feedback. The final voice and wording stay yours." };
  const lead = role === "Teacher" ? "I can turn that into a measurable objective, learning sequence, differentiation, and check for understanding." : role === "Family" ? "I can explain that in plain language and help prepare a respectful school message." : role === "Staff" ? "I can map that request to policy, controls, owners, and pilot evidence." : "I can coach this step by step while keeping the work yours.";
  return { text: `${lead} Tell me the subject, goal, deadline, and what you have already tried. Use fictional details only.` };
}
