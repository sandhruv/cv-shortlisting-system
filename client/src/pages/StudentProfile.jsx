import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera, FaPencilAlt, FaPlus, FaTrash, FaSave, FaTimes,
  FaMapMarkerAlt, FaPhone, FaGlobe, FaUser, FaSignOutAlt,
  FaBriefcase, FaGraduationCap, FaStar, FaCertificate, FaProjectDiagram,
  FaEye, FaToggleOn, FaToggleOff,
} from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";
import ProfileCompletion from "../components/ProfileCompletion";

const EMPTY = { title: "", company: "", location: "", startDate: "", endDate: "", description: "" };
const EMPTY_EDU = { school: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "", cgpa: "" };
const EMPTY_CERT = { name: "", issuer: "", date: "", url: "" };
const EMPTY_PROJ = { name: "", description: "", techStack: "", link: "" };

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><Icon className="text-[#ff6b2b]" /> {title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", rows }) {
  if (rows) {
    return (
      <div>
        <label className="text-xs text-white/40 mb-1 block">{label}</label>
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition resize-none" />
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs text-white/40 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition" />
    </div>
  );
}

function ItemCard({ item, onDelete, fields }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 relative group">
      <button onClick={onDelete} className="absolute top-3 right-3 text-white/20 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"><FaTrash size={12} /></button>
      {fields.map((f) => item[f.key] ? <p key={f.key} className={`text-sm ${f.primary ? "text-white font-medium" : "text-white/50"}`}>{f.prefix}{item[f.key]}</p> : null)}
    </div>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { toasts, add: toast, remove: removeToast } = useToast();
  const photoRef = useRef();
  const coverRef = useRef();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ headline: "", about: "", location: "", phone: "", website: "" });
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isOpenToWork, setIsOpenToWork] = useState(false);
  const [preferredRoles, setPreferredRoles] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/profile/me").then((r) => {
      setProfile(r.data);
      setForm({ headline: r.data.headline || "", about: r.data.about || "", location: r.data.location || "", phone: r.data.phone || "", website: r.data.website || "" });
      setExperiences(r.data.experiences || []);
      setEducation(r.data.education || []);
      setSkills(r.data.skills || []);
      setCertifications(r.data.certifications || []);
      setProjects(r.data.projects || []);
      setIsOpenToWork(r.data.isOpenToWork || false);
      setPreferredRoles(r.data.preferredRoles || "");
      setPreferredLocations(r.data.preferredLocations || "");
    }).catch(() => toast("Failed to load profile", "error")).finally(() => setLoading(false));
  }, []);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const addExperience = () => setExperiences((p) => [...p, { ...EMPTY }]);
  const removeExperience = (i) => setExperiences((p) => p.filter((_, idx) => idx !== i));
  const updateExperience = (i, key, val) => setExperiences((p) => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e));

  const addEducation = () => setEducation((p) => [...p, { ...EMPTY_EDU }]);
  const removeEducation = (i) => setEducation((p) => p.filter((_, idx) => idx !== i));
  const updateEducation = (i, key, val) => setEducation((p) => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e));

  const addCertification = () => setCertifications((p) => [...p, { ...EMPTY_CERT }]);
  const removeCertification = (i) => setCertifications((p) => p.filter((_, idx) => idx !== i));
  const updateCertification = (i, key, val) => setCertifications((p) => p.map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const addProject = () => setProjects((p) => [...p, { ...EMPTY_PROJ }]);
  const removeProject = (i) => setProjects((p) => p.filter((_, idx) => idx !== i));
  const updateProject = (i, key, val) => setProjects((p) => p.map((p2, idx) => idx === i ? { ...p2, [key]: val } : p2));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills((p) => [...p, s]); setSkillInput(""); }
  };
  const removeSkill = (s) => setSkills((p) => p.filter((sk) => sk !== s));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/profile", {
        ...form, experiences, education, skills, certifications, projects,
        isOpenToWork, preferredRoles, preferredLocations,
      });
      setProfile(res.data);
      setEditing(false);
      toast("Profile saved!");
    } catch (err) { toast(err.response?.data?.message || "Failed to save", "error"); }
    setSaving(false);
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await api.post(`/profile/${type === "cover" ? "cover" : "photo"}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile(res.data);
      toast(type === "cover" ? "Cover photo updated!" : "Profile photo updated!");
    } catch (err) { toast("Upload failed", "error"); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] flex items-center justify-center">
      <div className="text-white/50">Loading profile...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] relative overflow-hidden">
      <Toast toasts={toasts} remove={removeToast} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Header */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/student")} className="text-sm text-white/50 hover:text-white transition">Dashboard</button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
            <FaSignOutAlt size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Cover Photo */}
        <div className="relative h-48 rounded-2xl overflow-hidden mb-16 bg-white/5 border border-white/10">
          {profile?.coverPhoto && <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d131f]/80 to-transparent" />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "cover")} />
          <button onClick={() => coverRef.current?.click()} className="absolute top-3 right-3 p-2 bg-black/40 rounded-xl text-white/70 hover:text-white transition"><FaCamera size={14} /></button>

          {/* Profile Photo */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-[#0d131f] overflow-hidden bg-white/10 relative">
              {profile?.photo ? <img src={profile.photo} alt="" className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center text-white/30"><FaUser size={32} /></div>}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, "photo")} />
              <button onClick={() => photoRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition text-white"><FaCamera size={16} /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold text-white">{user.name || "Student"}</h1>
                  {editing ? <Field label="" value={form.headline} onChange={set("headline")} placeholder="e.g. Frontend Developer | React Enthusiast" /> :
                    <p className="text-sm text-white/50 mt-1">{profile?.headline || "Add a headline"}</p>}
                </div>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button onClick={() => setEditing(false)} className="p-2 text-white/40 hover:text-white rounded-xl border border-white/10 transition"><FaTimes size={14} /></button>
                      <button onClick={handleSave} disabled={saving} className="p-2 text-[#0d131f] bg-[#ff6b2b] rounded-xl hover:brightness-110 transition disabled:opacity-50"><FaSave size={14} /></button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} className="p-2 text-white/40 hover:text-white rounded-xl border border-white/10 transition"><FaPencilAlt size={14} /></button>
                  )}
                </div>
              </div>
              {editing ? (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-white/30" size={12} /><Field label="" value={form.location} onChange={set("location")} placeholder="Location" /></div>
                    <div className="flex items-center gap-2"><FaPhone className="text-white/30" size={12} /><Field label="" value={form.phone} onChange={set("phone")} placeholder="Phone" /></div>
                  </div>
                  <div className="flex items-center gap-2"><FaGlobe className="text-white/30" size={12} /><Field label="" value={form.website} onChange={set("website")} placeholder="Website URL" /></div>
                  <Field label="About" value={form.about} onChange={set("about")} placeholder="Tell us about yourself..." rows={4} />
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {profile?.location && <p className="text-white/50 flex items-center gap-2"><FaMapMarkerAlt size={12} /> {profile.location}</p>}
                  {profile?.phone && <p className="text-white/50 flex items-center gap-2"><FaPhone size={12} /> {profile.phone}</p>}
                  {profile?.website && <p className="text-white/50 flex items-center gap-2"><FaGlobe size={12} /> {profile.website}</p>}
                  {profile?.about && <p className="text-white/60 mt-2 whitespace-pre-wrap">{profile.about}</p>}
                  {!profile?.about && !profile?.location && <p className="text-white/30">Click edit to complete your profile</p>}
                </div>
              )}
            </div>

            {/* Open to Work */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isOpenToWork ? "bg-green-500/10" : "bg-white/5"}`}>
                    {isOpenToWork ? <FaToggleOn className="text-green-400" size={20} /> : <FaToggleOff className="text-white/30" size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/80">Open to Work</h3>
                    <p className="text-xs text-white/40">Let recruiters know you're looking</p>
                  </div>
                </div>
                <button onClick={() => setIsOpenToWork(!isOpenToWork)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${isOpenToWork ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}>
                  {isOpenToWork ? "Active" : "Inactive"}
                </button>
              </div>
              {isOpenToWork && editing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <Field label="Preferred Roles" value={preferredRoles} onChange={setPreferredRoles} placeholder="e.g. Frontend Developer" />
                  <Field label="Preferred Locations" value={preferredLocations} onChange={setPreferredLocations} placeholder="e.g. Mumbai, Bangalore" />
                </div>
              )}
            </div>

            {/* Experience */}
            <Section icon={FaBriefcase} title="Experience">
              {editing && <button onClick={addExperience} className="flex items-center gap-1 text-xs text-[#ff6b2b] mb-3 hover:underline"><FaPlus /> Add Experience</button>}
              {experiences.length === 0 && !editing && <p className="text-sm text-white/30">No experience added yet</p>}
              {experiences.map((exp, i) => editing ? (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 relative">
                  <button onClick={() => removeExperience(i)} className="absolute top-3 right-3 text-white/20 hover:text-rose-400"><FaTrash size={12} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Title" value={exp.title} onChange={(v) => updateExperience(i, "title", v)} placeholder="Job Title" />
                    <Field label="Company" value={exp.company} onChange={(v) => updateExperience(i, "company", v)} placeholder="Company" />
                    <Field label="Location" value={exp.location} onChange={(v) => updateExperience(i, "location", v)} placeholder="Location" />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Start" value={exp.startDate} onChange={(v) => updateExperience(i, "startDate", v)} placeholder="MM/YYYY" />
                      <Field label="End" value={exp.endDate} onChange={(v) => updateExperience(i, "endDate", v)} placeholder="MM/YYYY" />
                    </div>
                  </div>
                  <div className="mt-3"><Field label="Description" value={exp.description} onChange={(v) => updateExperience(i, "description", v)} placeholder="What did you do?" rows={2} /></div>
                </div>
              ) : (
                <ItemCard key={i} item={exp} onDelete={() => removeExperience(i)}
                  fields={[{ key: "title", primary: true }, { key: "company", prefix: "at " }, { key: "location" }, { key: "startDate", prefix: "From " }, { key: "description" }]} />
              ))}
            </Section>

            {/* Education */}
            <Section icon={FaGraduationCap} title="Education">
              {editing && <button onClick={addEducation} className="flex items-center gap-1 text-xs text-[#ff6b2b] mb-3 hover:underline"><FaPlus /> Add Education</button>}
              {education.length === 0 && !editing && <p className="text-sm text-white/30">No education added yet</p>}
              {education.map((edu, i) => editing ? (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 relative">
                  <button onClick={() => removeEducation(i)} className="absolute top-3 right-3 text-white/20 hover:text-rose-400"><FaTrash size={12} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="School" value={edu.school} onChange={(v) => updateEducation(i, "school", v)} placeholder="University/School" />
                    <Field label="Degree" value={edu.degree} onChange={(v) => updateEducation(i, "degree", v)} placeholder="Degree" />
                    <Field label="Field of Study" value={edu.fieldOfStudy} onChange={(v) => updateEducation(i, "fieldOfStudy", v)} placeholder="e.g. Computer Science" />
                    <Field label="CGPA" value={edu.cgpa} onChange={(v) => updateEducation(i, "cgpa", v)} placeholder="CGPA" />
                    <Field label="Start Year" value={edu.startYear} onChange={(v) => updateEducation(i, "startYear", v)} placeholder="2022" />
                    <Field label="End Year" value={edu.endYear} onChange={(v) => updateEducation(i, "endYear", v)} placeholder="2026" />
                  </div>
                </div>
              ) : (
                <ItemCard key={i} item={edu} onDelete={() => removeEducation(i)}
                  fields={[{ key: "school", primary: true }, { key: "degree" }, { key: "fieldOfStudy" }, { key: "cgpa", prefix: "CGPA: " }, { key: "startYear", prefix: "Year: " }]} />
              ))}
            </Section>

            {/* Projects */}
            <Section icon={FaProjectDiagram} title="Projects">
              {editing && <button onClick={addProject} className="flex items-center gap-1 text-xs text-[#ff6b2b] mb-3 hover:underline"><FaPlus /> Add Project</button>}
              {projects.length === 0 && !editing && <p className="text-sm text-white/30">No projects added yet</p>}
              {projects.map((proj, i) => editing ? (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 relative">
                  <button onClick={() => removeProject(i)} className="absolute top-3 right-3 text-white/20 hover:text-rose-400"><FaTrash size={12} /></button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Project Name" value={proj.name} onChange={(v) => updateProject(i, "name", v)} placeholder="Project name" />
                    <Field label="Tech Stack" value={proj.techStack} onChange={(v) => updateProject(i, "techStack", v)} placeholder="e.g. React, Node.js" />
                  </div>
                  <div className="mt-3">
                    <Field label="Description" value={proj.description} onChange={(v) => updateProject(i, "description", v)} placeholder="Describe your project" rows={2} />
                  </div>
                  <div className="mt-3"><Field label="Link" value={proj.link} onChange={(v) => updateProject(i, "link", v)} placeholder="https://..." /></div>
                </div>
              ) : (
                <ItemCard key={i} item={proj} onDelete={() => removeProject(i)}
                  fields={[{ key: "name", primary: true }, { key: "techStack" }, { key: "description" }, { key: "link" }]} />
              ))}
            </Section>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <ProfileCompletion onNavigate={() => {}} />

            {/* Skills */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2"><FaStar className="text-[#ff6b2b]" /> Skills</h3>
              {editing && (
                <div className="flex gap-2 mb-3">
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill" className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" />
                  <button onClick={addSkill} className="px-3 py-2 bg-[#ff6b2b] text-[#0d131f] rounded-xl text-xs font-medium hover:brightness-110 transition"><FaPlus /></button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">
                    {s}
                    {editing && <button onClick={() => removeSkill(s)} className="text-white/30 hover:text-rose-400"><FaTimes size={10} /></button>}
                  </span>
                ))}
                {skills.length === 0 && <p className="text-xs text-white/30">No skills added</p>}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2"><FaCertificate className="text-[#ff6b2b]" /> Certifications</h3>
              {editing && <button onClick={addCertification} className="flex items-center gap-1 text-xs text-[#ff6b2b] mb-3 hover:underline"><FaPlus /> Add Certification</button>}
              {certifications.map((cert, i) => editing ? (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 relative">
                  <button onClick={() => removeCertification(i)} className="absolute top-2 right-2 text-white/20 hover:text-rose-400"><FaTrash size={10} /></button>
                  <div className="grid grid-cols-1 gap-2">
                    <Field label="Name" value={cert.name} onChange={(v) => updateCertification(i, "name", v)} placeholder="Certification name" />
                    <Field label="Issuer" value={cert.issuer} onChange={(v) => updateCertification(i, "issuer", v)} placeholder="Issuing organization" />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Date" value={cert.date} onChange={(v) => updateCertification(i, "date", v)} placeholder="MM/YYYY" />
                      <Field label="URL" value={cert.url} onChange={(v) => updateCertification(i, "url", v)} placeholder="Link" />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="text-sm mb-2">
                  <p className="text-white/70 font-medium">{cert.name}</p>
                  {cert.issuer && <p className="text-white/40 text-xs">{cert.issuer}</p>}
                  {cert.date && <p className="text-white/30 text-xs">{cert.date}</p>}
                </div>
              ))}
              {certifications.length === 0 && !editing && <p className="text-xs text-white/30">No certifications</p>}
            </div>

            {/* Profile Views */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2"><FaEye className="text-[#ff6b2b]" /> Profile Views</h3>
              <p className="text-2xl font-bold text-white">{profile?.profileViews?.length || 0}</p>
              <p className="text-xs text-white/40 mt-1">People who viewed your profile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
