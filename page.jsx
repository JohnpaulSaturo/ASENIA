"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const initialStudents = [
  { id: "STU-1001", name: "Sample Student", lrn: "000000000000", section: "12-Babbage", qrValue: "STU-1001" },
];

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [role, setRole] = useState("Teacher");
  const [students, setStudents] = useState(initialStudents);
  const [sections, setSections] = useState(["12-Babbage", "12-Gates"]);
  const [attendance, setAttendance] = useState([]);
  const [requests, setRequests] = useState([{ id: "REQ-01", name: "Sample Teacher", teacherId: "T-1001" }]);
  const [sectionName, setSectionName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentLrn, setStudentLrn] = useState("");
  const [studentSection, setStudentSection] = useState("12-Babbage");
  const [qrInput, setQrInput] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [pendingImage, setPendingImage] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("eqr-demo-state");
      if (saved) {
        const data = JSON.parse(saved);
        setStudents(data.students || initialStudents);
        setSections(data.sections || ["12-Babbage", "12-Gates"]);
        setAttendance(data.attendance || []);
        setRequests(data.requests || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("eqr-demo-state", JSON.stringify({ students, sections, attendance, requests }));
    } catch {}
  }, [students, sections, attendance, requests]);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }

  function addSection(e) {
    e.preventDefault();
    const clean = sectionName.trim();
    if (!clean) return notify("Enter a section name first.");
    if (sections.some((s) => s.toLowerCase() === clean.toLowerCase())) return notify("That section already exists.");
    setSections((prev) => [...prev, clean]);
    setSectionName("");
    notify(`Section "${clean}" created.`);
  }

  function addStudent(e) {
    e.preventDefault();
    if (!studentName.trim() || !studentLrn.trim()) return notify("Enter the student's name and LRN.");
    const id = `STU-${Date.now().toString().slice(-6)}`;
    setStudents((prev) => [...prev, { id, name: studentName.trim(), lrn: studentLrn.trim(), section: studentSection, qrValue: id }]);
    setStudentName("");
    setStudentLrn("");
    notify("Student added. Their QR value is their student ID.");
  }

  function registerAttendance(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) return notify("No QR value was detected.");
    const student = students.find((s) => s.id === value || s.qrValue === value || s.lrn === value);
    if (!student) return notify(`QR read "${value}", but no student matches it. Register the student/QR first.`);
    const today = new Date().toLocaleDateString();
    if (attendance.some((a) => a.studentId === student.id && a.date === today)) return notify(`${student.name} is already marked present today.`);
    setAttendance((prev) => [{ id: `${Date.now()}`, studentId: student.id, name: student.name, section: student.section, date: today, time: new Date().toLocaleTimeString(), status: "Present" }, ...prev]);
    setQrInput("");
    notify(`Attendance registered for ${student.name}.`);
  }

  async function readImage(file) {
    if (!file) return;
    setPendingImage(URL.createObjectURL(file));
    setMessage("Reading QR image…");
    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return notify("Could not prepare the image.");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
        URL.revokeObjectURL(imageUrl);
        if (code?.data) {
          setMessage("");
          registerAttendance(code.data);
        } else {
          notify("No QR code found. Try a clearer, well-lit image with the whole QR visible.");
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        notify("Could not open that image file.");
      };
      image.src = imageUrl;
    } catch {
      notify("Could not read this image.");
    }
  }

  function doConfirm() {
    if (!confirm) return;
    const { type, id, label } = confirm;
    if (type === "student") {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setAttendance((prev) => prev.filter((a) => a.studentId !== id));
      notify(`${label} deleted.`);
    } else if (type === "section") {
      setSections((prev) => prev.filter((s) => s !== id));
      setStudents((prev) => prev.map((s) => s.section === id ? { ...s, section: "Unassigned" } : s));
      notify(`Section "${id}" deleted.`);
    } else if (type === "reject") {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      notify("Teacher request rejected.");
    } else if (type === "approve") {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      notify("Teacher request approved (demo only).");
    }
    setConfirm(null);
  }

  const navItems = ["Dashboard", "Scan QR", "Make Section", "Students", "Attendance", "Teacher Requests"];
  const today = new Date().toLocaleDateString();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">QR</div><div><strong>E-QR Attendance</strong><small>Monitoring System</small></div></div>
        <div className="role-switch">
          <label htmlFor="role">Preview as</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Teacher</option><option>Student</option><option>Admin</option>
          </select>
        </div>
        <div className="nav-label">WORKSPACE</div>
        {navItems.filter((item) => role !== "Student" || ["Dashboard", "Scan QR", "Attendance"].includes(item)).map((item) => (
          <button key={item} className={`nav-item ${active === item ? "selected" : ""}`} onClick={() => setActive(item)}>
            <span className="nav-symbol">{({Dashboard:"▦","Scan QR":"▣","Make Section":"⊞",Students:"♙",Attendance:"◷","Teacher Requests":"✓"})[item]}</span>{item}
          </button>
        ))}
        <div className="sidebar-bottom"><div className="status-dot" /> Demo workspace <small>Local browser storage</small></div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div><div className="eyebrow">CARLOS P. GARCIA SENIOR HIGH SCHOOL</div><h1>{active}</h1></div>
          <div className="user-chip"><div className="avatar">{role[0]}</div><div><strong>{role}</strong><small>{role === "Admin" ? "Administrator preview" : `${role} workspace`}</small></div></div>
        </header>
        {message && <div className="toast" role="status"><span>●</span>{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}

        {active === "Dashboard" && <div className="content">
          <div className="welcome-panel"><div><div className="eyebrow light">ATTENDANCE OVERVIEW</div><h2>Good day! 👋</h2><p>Manage QR attendance, students, and class sections in one place.</p><button className="primary-btn" onClick={() => setActive("Scan QR")}>＋ Register attendance</button></div><div className="welcome-art">⌁<span>QR</span>⌁</div></div>
          <div className="stats-grid">
            <Stat label="Registered students" value={students.length} icon="♙" />
            <Stat label="Class sections" value={sections.length} icon="▦" />
            <Stat label="Present today" value={attendance.filter((a) => a.date === today).length} icon="✓" />
            <Stat label="Teacher requests" value={requests.length} icon="♧" />
          </div>
          <div className="panel"><div className="panel-heading"><div><h3>Recent attendance</h3><p>Latest records saved in this browser</p></div><button className="text-btn" onClick={() => setActive("Attendance")}>View all →</button></div><AttendanceTable rows={attendance.slice(0, 5)} /></div>
        </div>}

        {active === "Scan QR" && <div className="content scan-layout">
          <div className="panel scan-panel"><div className="panel-heading"><div><h3>Upload a QR image</h3><p>No camera permission needed for image uploads.</p></div><span className="pill green">Image scanner</span></div>
            <label className="upload-zone"><input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0])} /><div className="upload-icon">↑</div><strong>Choose QR image</strong><span>Click to browse from your phone or computer</span><small>PNG, JPG, WEBP supported</small></label>
            {pendingImage && <div className="preview-row"><img src={pendingImage} alt="Selected QR preview" /><span>Selected image</span></div>}
            <canvas ref={canvasRef} className="hidden-canvas" />
            <div className="divider"><span>OR enter the QR value</span></div>
            <form className="inline-form" onSubmit={(e) => { e.preventDefault(); registerAttendance(qrInput); }}><input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Enter student QR ID (e.g. STU-1001)" /><button className="primary-btn" type="submit">Register</button></form>
            <div className="info-note"><span>ⓘ</span><p>The QR must contain a registered student's ID, LRN, or saved QR value. A successful scan is saved as present for today.</p></div>
          </div>
          <div className="panel"><h3>How it works</h3><div className="step"><span>1</span><div><strong>Select the QR image</strong><p>Upload an image containing the complete QR code.</p></div></div><div className="step"><span>2</span><div><strong>System reads the code</strong><p>The browser decodes the image locally.</p></div></div><div className="step"><span>3</span><div><strong>Attendance is saved</strong><p>The code must match a student in your list.</p></div></div></div>
        </div>}

        {active === "Make Section" && <div className="content">
          <div className="panel form-panel"><div className="panel-heading"><div><h3>Create a class section</h3><p>Organize students by grade and section.</p></div><span className="pill">SECTION MANAGER</span></div>
            <form onSubmit={addSection} className="create-form"><label>Section name<input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="e.g. Grade 12 - Babbage" /></label><button className="primary-btn" type="submit">＋ Make Section</button></form>
          </div>
          <div className="section-grid">{sections.map((section, i) => <div className="section-card" key={section}><div className="section-card-top"><div className="section-icon">▦</div><button className="icon-btn danger-text" aria-label={`Delete ${section}`} onClick={() => setConfirm({type:"section", id:section, label:section})}>⋯</button></div><h3>{section}</h3><p>{students.filter((s) => s.section === section).length} students assigned</p><div className="section-card-bottom"><span className="section-dot" /> Active section <button className="text-btn" onClick={() => { setStudentSection(section); setActive("Students"); }}>Manage students →</button></div></div>)}</div>
          {sections.length === 0 && <div className="empty-state">No sections yet. Create your first section above.</div>}
        </div>}

        {active === "Students" && <div className="content">
          <div className="panel form-panel"><div className="panel-heading"><div><h3>Add a student</h3><p>Students need to be registered before their QR can mark attendance.</p></div></div>
            <form className="student-form" onSubmit={addStudent}><label>Student name<input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Full name" /></label><label>LRN<input value={studentLrn} onChange={(e) => setStudentLrn(e.target.value)} placeholder="Learner Reference Number" /></label><label>Section<select value={studentSection} onChange={(e) => setStudentSection(e.target.value)}>{sections.map((s) => <option key={s}>{s}</option>)}{sections.length === 0 && <option>Unassigned</option>}</select></label><button className="primary-btn" type="submit">＋ Add student</button></form>
          </div>
          <div className="panel"><div className="panel-heading"><div><h3>Registered students</h3><p>{students.length} students in the list</p></div></div>
            <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>LRN</th><th>SECTION</th><th>QR VALUE</th><th>ACTION</th></tr></thead><tbody>{students.map((s) => <tr key={s.id}><td><div className="person"><div className="avatar small">{s.name[0]}</div><div><strong>{s.name}</strong><small>{s.id}</small></div></div></td><td>{s.lrn}</td><td><span className="pill">{s.section}</span></td><td><code>{s.qrValue}</code></td><td><button className="small-danger" onClick={() => setConfirm({type:"student", id:s.id, label:s.name})}>Delete</button></td></tr>)}</tbody></table></div>
          </div>
        </div>}

        {active === "Attendance" && <div className="content"><div className="panel"><div className="panel-heading"><div><h3>Attendance history</h3><p>Today's date: {today}</p></div><button className="primary-btn" onClick={() => setActive("Scan QR")}>＋ Scan QR</button></div><AttendanceTable rows={attendance} /></div></div>}

        {active === "Teacher Requests" && <div className="content"><div className="panel"><div className="panel-heading"><div><h3>Teacher account requests</h3><p>Review requests before approving access.</p></div></div>{requests.length === 0 ? <div className="empty-state">No pending teacher requests.</div> : <div className="request-list">{requests.map((r) => <div className="request-row" key={r.id}><div className="avatar">{r.name[0]}</div><div className="request-info"><strong>{r.name}</strong><small>Teacher ID: {r.teacherId} · Pending approval</small></div><button className="outline-btn" onClick={() => setConfirm({type:"reject", id:r.id, label:r.name})}>Reject</button><button className="primary-btn" onClick={() => setConfirm({type:"approve", id:r.id, label:r.name})}>Approve</button></div>)}</div>}</div></div>}

        <footer>© 2026 E-QR Attendance · Demo prototype <span>Built for school attendance management</span></footer>
      </section>

      {confirm && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className={`modal-icon ${confirm.type === "approve" ? "approve-icon" : ""}`}>{confirm.type === "approve" ? "✓" : "!"}</div><h2 id="confirm-title">{confirm.type === "approve" ? "Approve this request?" : confirm.type === "reject" ? "Reject this request?" : "Are you sure?"}</h2><p>{confirm.type === "student" ? `Do you really want to delete ${confirm.label}? Their attendance history will also be removed.` : confirm.type === "section" ? `Delete the "${confirm.label}" section? Students will become unassigned; their attendance records will remain.` : confirm.type === "reject" ? `Are you sure you want to reject ${confirm.label}'s teacher request?` : `Approve ${confirm.label}'s teacher request?`}</p><div className="modal-actions"><button className="outline-btn" onClick={() => setConfirm(null)}>Cancel</button><button className={confirm.type === "approve" ? "primary-btn" : "danger-btn"} onClick={doConfirm}>{confirm.type === "approve" ? "Yes, approve" : confirm.type === "reject" ? "Yes, reject" : "Yes, delete"}</button></div></div></div>}
    </main>
  );
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong>{value}</strong><small>Current records</small></div>;
}

function AttendanceTable({ rows }) {
  if (!rows.length) return <div className="empty-state"><div className="empty-icon">◷</div><strong>No attendance records yet</strong><p>Upload a registered student's QR image to record attendance.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>SECTION</th><th>DATE</th><th>TIME</th><th>STATUS</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="person"><div className="avatar small">{r.name[0]}</div><strong>{r.name}</strong></div></td><td>{r.section}</td><td>{r.date}</td><td>{r.time}</td><td><span className="pill green">{r.status}</span></td></tr>)}</tbody></table></div>;
}
