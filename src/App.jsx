import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tibwhditawfhrxpmsrtp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYndoZGl0YXdmaHJ4cG1zcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDk4OTksImV4cCI6MjA5NDkyNTg5OX0.k9ago70XNq0GlFdFKDjXKoPb8j1a3CZMgEfrwBvar7I";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TECH_EMAILS = [
  { id: "JPB", email: "jean-paul@bourquinelectricite.ch" },
  { id: "CF",  email: "fatio@bourquinelectricite.ch" },
  { id: "JYB", email: "bourquin@bourquinelectricite.ch" },
];

const CATEGORIES = [
  { id: "heures",    label: "Heures régie",       icon: "⏱" },
  { id: "materiel",  label: "Matériel non prévu",  icon: "🔧" },
  { id: "plans",     label: "Modification plans",  icon: "📐" },
  { id: "cache",     label: "Travaux cachés",      icon: "🔍" },
  { id: "depannage", label: "Dépannage",           icon: "🚨" },
  { id: "autre",     label: "Autre",               icon: "📋" },
];

const SERVICES_MO = [
  { id: "installateur",   label: "Electricien installateur",          unite: "h" },
  { id: "aide2",          label: "Electricien aide 2",                unite: "h" },
  { id: "aide1",          label: "Electricien aide 1",                unite: "h" },
  { id: "conseiller",     label: "Electricien conseiller sécurité",   unite: "h" },
  { id: "programmateur",  label: "Electricien programmateur",         unite: "h" },
  { id: "chef_projet",    label: "Electricien chef de projet",        unite: "h" },
  { id: "chef_chantier",  label: "Electricien chef de chantier",      unite: "h" },
  { id: "it_depanneur",   label: "Electricien service IT & dépanneur",unite: "h" },
  { id: "planificateur",  label: "Electricien planificateur",         unite: "h" },
  { id: "vehicule",       label: "Véhicule, outillage, stock",        unite: "q" },
  { id: "petit_mat_sup",  label: "Petit matériel > 3h",              unite: "q" },
  { id: "petit_mat_inf",  label: "Petit matériel ≤ 3h",              unite: "q" },
];

const FOURNISSEURS = ["EM", "OF", "SP", "STOCK", "Autre"];

const STATUS_COLORS = {
  en_attente: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.4)",   text: "#EF4444", label: "En attente" },
  signe:      { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)",  text: "#10B981", label: "Signé" },
  envoye:     { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.4)",  text: "#3B82F6", label: "Envoyé" },
  facture:    { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.4)",  text: "#8B5CF6", label: "Facturé" },
};

const DEFAULT_MONTEURS = ["LH", "LA", "GP", "EM", "HS", "VR"];
const EMPTY_MO   = () => ({ id: Date.now() + Math.random(), service: "", quantite: "" });
const EMPTY_MAT  = () => ({ id: Date.now() + Math.random(), designation: "", eldas: "", fournisseur: "", fournisseur_custom: "", quantite: "" });

function safeLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:      { fontFamily: "'DM Sans', sans-serif", background: "#0A0C12", minHeight: "100vh", color: "#E8EAF0", maxWidth: 500, margin: "0 auto" },
  header:   { background: "linear-gradient(135deg,#13162A,#0A0C12)", borderBottom: "1px solid #1E2235", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  logoWrap: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "linear-gradient(135deg,#F59E0B,#EF4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  logoTitle:{ fontSize: 14, fontWeight: 800, color: "#E8EAF0" },
  logoSub:  { fontSize: 10, color: "#4B5563", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 1 },
  body:     { padding: "16px 14px" },
  card:     { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 12 },
  section:  { background: "#13162A", border: "1px solid #1E2235", borderRadius: 14, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 11, color: "#F59E0B", letterSpacing: 1, textTransform: "uppercase", fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  kpiGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  kpiCard:  (a) => ({ background: a ? "rgba(239,68,68,0.08)" : "#13162A", border: "1px solid", borderColor: a ? "rgba(239,68,68,0.3)" : "#1E2235", borderRadius: 14, padding: "14px 16px" }),
  kpiVal:   (a) => ({ fontSize: 20, fontWeight: 800, color: a ? "#EF4444" : "#F59E0B", marginTop: 4 }),
  kpiLabel: { fontSize: 10, color: "#4B5563", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 },
  dashSection: { fontSize: 10, color: "#4B5563", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, marginTop: 4 },
  chantierCard:   { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 10 },
  chantierHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  chantierName:   { fontSize: 15, fontWeight: 700, color: "#E8EAF0" },
  chantierMeta:   { fontSize: 11, color: "#4B5563", marginTop: 2 },
  chantierNumero: { fontSize: 11, color: "#F59E0B", fontWeight: 700, marginTop: 2 },
  regieRow:  { borderTop: "1px solid #1E2235", paddingTop: 10, marginTop: 10 },
  regieMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 },
  badge:     (c) => ({ background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  initBadge: { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 },
  typeBadge: { background: "#1E2235", color: "#9CA3AF", borderRadius: 6, padding: "3px 8px", fontSize: 11 },
  statusRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 },
  statusBtn: (a, c) => ({ background: a ? c.bg : "transparent", color: a ? c.text : "#4B5563", border: "1px solid", borderColor: a ? c.border : "#1E2235", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }),
  btnPrimary:   { background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#0A0C12", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%", marginTop: 10 },
  btnSecondary: { background: "transparent", color: "#F59E0B", border: "1px solid #F59E0B", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnGhost:  { background: "transparent", color: "#4B5563", border: "1px solid #1E2235", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnDanger: { background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnAdd:    { background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 8 },
  fab:       { position: "fixed", bottom: 24, right: 20, width: 60, height: 60, background: "linear-gradient(135deg,#F59E0B,#EF4444)", borderRadius: "50%", border: "none", fontSize: 28, cursor: "pointer", color: "#0A0C12", fontWeight: 700, boxShadow: "0 8px 32px rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  label:     { fontSize: 12, color: "#6B7280", marginBottom: 6, display: "block", fontWeight: 600 },
  labelOpt:  { fontSize: 12, color: "#4B5563", marginBottom: 6, display: "block", fontWeight: 500 },
  input:     { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:    { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  fieldGroup:{ marginBottom: 14 },
  catBtn:    (a) => ({ background: a ? "rgba(245,158,11,0.12)" : "#0A0C12", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 10, padding: "10px 10px", color: a ? "#F59E0B" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }),
  monteurBtn:(a) => ({ background: a ? "rgba(245,158,11,0.15)" : "#0A0C12", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "10px 0", color: a ? "#F59E0B" : "#6B7280", fontSize: 13, fontWeight: 800, cursor: "pointer", flex: 1, textAlign: "center", minWidth: 44 }),
  techBtn:   (a) => ({ background: a ? "rgba(59,130,246,0.15)" : "#0A0C12", border: "1px solid", borderColor: a ? "#3B82F6" : "#1E2235", borderRadius: 8, padding: "10px 14px", color: a ? "#3B82F6" : "#6B7280", fontSize: 13, fontWeight: 800, cursor: "pointer" }),
  photoBox:  { border: "2px dashed #1E2235", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: "#0A0C12" },
  toast:     { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "white", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, zIndex: 200 },
  backBtn:   { background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  recapBox:  { background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#E8EAF0", whiteSpace: "pre-wrap", lineHeight: 1.8 },
  alertBanner:{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: "#4B5563" },
  sigCanvas:  { width: "100%", height: 160, background: "#fff", border: "1px solid #1E2235", borderRadius: 10, touchAction: "none", cursor: "crosshair" },
  sigBox:     { background: "#13162A", border: "1px solid #1E2235", borderRadius: 12, padding: 14, marginTop: 12 },
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal:      { background: "#13162A", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 500, margin: "0 auto" },
  rowLine:    { display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 8 },
  deleteSmall:{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 6, padding: "8px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0 },
  errorBox:   { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 14 },
};

// ─── Signature ────────────────────────────────────────────────────────────────
function SignatureCanvas({ onSave, onCancel }) {
  const ref = useRef(); const drawing = useRef(false); const last = useRef(null);
  const pos = (e, c) => { const r = c.getBoundingClientRect(), t = e.touches?.[0] || e; return { x: (t.clientX - r.left) * c.width / r.width, y: (t.clientY - r.top) * c.height / r.height }; };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e, ref.current); };
  const stop  = (e) => { e?.preventDefault(); drawing.current = false; };
  const draw  = (e) => {
    e.preventDefault(); if (!drawing.current) return;
    const c = ref.current, ctx = c.getContext("2d"), p = pos(e, c);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke(); last.current = p;
  };
  return (
    <div style={S.overlay}><div style={S.modal}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 4 }}>Signature client</div>
      <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 14 }}>Signer dans le cadre blanc</div>
      <canvas ref={ref} width={460} height={160} style={S.sigCanvas}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={{ ...S.btnPrimary, marginTop: 0, flex: 2 }} onClick={() => onSave(ref.current.toDataURL("image/png"))}>✓ Valider</button>
        <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => ref.current.getContext("2d").clearRect(0,0,460,160)}>Effacer</button>
        <button style={{ ...S.btnDanger, flex: 1 }} onClick={onCancel}>Annuler</button>
      </div>
    </div></div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [regies, setRegies]     = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [deletedIds, setDeletedIds] = useState(() => safeLS("deletedIds", []));
  const [monteurs, setMonteurs] = useState(() => safeLS("monteurs", DEFAULT_MONTEURS));
  const [loading, setSaving_]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recap, setRecap]       = useState(null);
  const [photo, setPhoto]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showNewChantier, setShowNewChantier] = useState(false);
  const [showAddMonteur, setShowAddMonteur]   = useState(false);
  const [newMonteurVal, setNewMonteurVal]     = useState("");
  const [showSignature, setShowSignature]     = useState(null);
  const [confirmDelete, setConfirmDelete]     = useState(null);
  const [newChantier, setNewChantier] = useState({ nom: "", numero: "", techIds: [], techCustom: "" });
  const [form, setForm] = useState({
    chantier_id: "", chantier_nom: "",
    date: new Date().toISOString().split("T")[0],
    initiales: "",
    demandeur: "",
    categories: [],
    categorie_custom: "",
    emplacement: "",
    lignes_mo:  [EMPTY_MO()],
    lignes_mat: [],
    has_materiel: false,
  });
  const fileRef = useRef();
  const setLoading = setSaving_;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setErrorMsg(null);
    try {
      const [{ data: c, error: ce }, { data: r, error: re }] = await Promise.all([
        supabase.from("chantiers").select("*").order("created_at", { ascending: false }),
        supabase.from("regies").select("*").order("created_at", { ascending: false }),
      ]);
      if (ce || re) throw new Error();
      setChantiers(c || []);
      const ids = safeLS("deletedIds", []);
      setRegies((r || []).filter(x => !ids.includes(x.id)));
    } catch { setErrorMsg("Impossible de charger les données."); }
    setLoading(false);
  };

  const saveDeletedIds = (ids) => { setDeletedIds(ids); try { localStorage.setItem("deletedIds", JSON.stringify(ids)); } catch {} };
  const saveMonteurs   = (list) => { setMonteurs(list); try { localStorage.setItem("monteurs", JSON.stringify(list)); } catch {} };

  const addMonteur = () => {
    const i = newMonteurVal.trim().toUpperCase();
    if (!i || monteurs.includes(i)) return;
    saveMonteurs([...monteurs, i]); setForm(f => ({ ...f, initiales: i }));
    setNewMonteurVal(""); setShowAddMonteur(false);
  };

  const buildTechEmails = (techIds, techCustom) => {
    const emails = techIds.map(id => TECH_EMAILS.find(t => t.id === id)?.email).filter(Boolean);
    if (techCustom.trim()) emails.push(techCustom.includes("@") ? techCustom.trim() : `${techCustom.trim()}@bourquinelectricite.ch`);
    return emails.join(";");
  };

  const addChantier = async () => {
    if (!newChantier.nom.trim()) return;
    const emailTech = buildTechEmails(newChantier.techIds, newChantier.techCustom);
    const { data, error } = await supabase.from("chantiers").insert({
      nom: newChantier.nom.trim(),
      numero: newChantier.numero.trim() || null,
      email_technicien: emailTech || null,
    }).select().single();
    if (error) { alert("Erreur création chantier."); return; }
    setChantiers(prev => [data, ...prev]);
    setForm(f => ({ ...f, chantier_id: data.id, chantier_nom: data.nom }));
    setNewChantier({ nom: "", numero: "", techIds: [], techCustom: "" });
    setShowNewChantier(false);
  };

  const toggleTechId = (id) => setNewChantier(f => ({ ...f, techIds: f.techIds.includes(id) ? f.techIds.filter(x => x !== id) : [...f.techIds, id] }));
  const toggleCat    = (id) => setForm(f => ({ ...f, categories: f.categories.includes(id) ? f.categories.filter(x => x !== id) : [...f.categories, id] }));

  const updateMO  = (id, field, val) => setForm(f => ({ ...f, lignes_mo:  f.lignes_mo.map(l  => l.id === id ? { ...l, [field]: val } : l) }));
  const updateMat = (id, field, val) => setForm(f => ({ ...f, lignes_mat: f.lignes_mat.map(l => l.id === id ? { ...l, [field]: val } : l) }));
  const removeMO  = (id) => setForm(f => ({ ...f, lignes_mo:  f.lignes_mo.filter(l  => l.id !== id) }));
  const removeMat = (id) => setForm(f => ({ ...f, lignes_mat: f.lignes_mat.filter(l => l.id !== id) }));

  const handlePhoto = (e) => { const file = e.target.files[0]; if (!file) return; setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); };

  const uploadFile = async (file, folder, ct) => {
    try {
      let blob = file;
      if (typeof file === "string") {
        const bin = atob(file.split(",")[1]); const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        blob = new Blob([arr], { type: ct });
      }
      const ext = ct === "image/png" ? "png" : (file.name?.split(".").pop() || "jpg");
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("photos-regies").upload(path, blob, { contentType: ct });
      if (error) return null;
      return supabase.storage.from("photos-regies").getPublicUrl(path).data.publicUrl;
    } catch { return null; }
  };

  const handleSignature = async (regieId, dataUrl) => {
    setShowSignature(null);
    const url = await uploadFile(dataUrl, "signatures", "image/png");
    if (!url) { alert("Erreur upload signature."); return; }
    await supabase.from("regies").update({ signature_url: url, status: "signe" }).eq("id", regieId);
    setRegies(prev => prev.map(r => r.id === regieId ? { ...r, signature_url: url, status: "signe" } : r));
  };

  const deleteRegie = async (id) => {
    await supabase.from("regies").delete().eq("id", id);
    const newIds = [...deletedIds, id];
    saveDeletedIds(newIds);
    setRegies(prev => prev.filter(r => r.id !== id));
    setConfirmDelete(null);
  };

  const submitRegie = async () => {
    const moValides  = form.lignes_mo.filter(l => l.service);
    const matValides = form.lignes_mat.filter(l => l.designation.trim());
    if (!form.chantier_id || !form.initiales || form.categories.length === 0 || moValides.length === 0) return;
    setSaving(true); setErrorMsg(null);
    let photo_url = null;
    if (photo) photo_url = await uploadFile(photo, "regies", photo.type || "image/jpeg");
    const cats = form.categories.map(c => c === "autre" ? (form.categorie_custom || "Autre") : CATEGORIES.find(x => x.id === c)?.label).join(", ");
    const { data, error } = await supabase.from("regies").insert({
      chantier_id:   form.chantier_id,
      chantier_nom:  form.chantier_nom,
      categorie:     cats,
      description:   moValides.map(l => { const s = SERVICES_MO.find(x => x.id === l.service); return `${s?.label || l.service} ${l.quantite}${s?.unite || "h"}`; }).join(" / "),
      lignes:        { mo: moValides, mat: matValides },
      demandeur:     form.demandeur || null,
      emplacement:   form.emplacement || null,
      initiales:     form.initiales,
      photo_url,
      date:          form.date,
      status:        "en_attente",
    }).select().single();
    setSaving(false);
    if (error) { setErrorMsg("Erreur enregistrement. Vérifie ta connexion."); return; }
    setRegies(prev => [data, ...prev]);
    setSaved(true);
    setPhoto(null); setPhotoPreview(null);
    setForm(f => ({ ...f, categories: [], categorie_custom: "", initiales: "", demandeur: "", emplacement: "", date: new Date().toISOString().split("T")[0], lignes_mo: [EMPTY_MO()], lignes_mat: [], has_materiel: false }));
    setTimeout(() => setSaved(false), 2500);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("regies").update({ status }).eq("id", id);
    setRegies(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const getChantier = (id) => chantiers.find(c => c.id === id);
  const regiesByChantier = (id) => regies.filter(r => r.chantier_id === id);
  const nonFactures      = (id) => regiesByChantier(id).filter(r => r.status !== "facture");

  const generateRecap = (chantierId) => {
    const items = nonFactures(chantierId);
    const ch = getChantier(chantierId);
    const nom = ch?.nom || "";
    const numero = ch?.numero ? ` (N° affaire: ${ch.numero})` : "";
    const text = `RÉCAPITULATIF PLUS VALUES / RÉGIE\nChantier : ${nom}${numero}\nDate : ${formatDate(new Date().toISOString())}\n\n${
      items.map((r, i) => {
        const mo  = r.lignes?.mo  || [];
        const mat = r.lignes?.mat || [];
        return `${i + 1}. [${r.initiales}] ${r.categorie} — ${formatDate(r.created_at)}${r.demandeur ? `\n   Demandé par : ${r.demandeur}` : ""}${r.emplacement ? `\n   Emplacement : ${r.emplacement}` : ""}\n\n   MAIN D'OEUVRE\n${
          mo.map(l => { const s = SERVICES_MO.find(x => x.id === l.service); return `   • ${s?.label || l.service} : ${l.quantite || "?"} ${s?.unite || "h"}`; }).join("\n")
        }${mat.length > 0 ? `\n\n   MATÉRIEL\n${mat.map(l => `   • ${l.designation}${l.eldas ? ` | ELDAS: ${l.eldas}` : ""}${l.fournisseur ? ` | Fourn.: ${l.fournisseur === "Autre" ? l.fournisseur_custom || "Autre" : l.fournisseur}` : ""}${l.quantite ? ` | Qté: ${l.quantite}` : ""}`).join("\n")}` : ""}${r.photo_url ? `\n\n   📷 Photo : ${r.photo_url}` : ""}${r.signature_url ? "\n\n   ✓ Signature client obtenue" : ""}`;
      }).join("\n\n─────────────────────────────\n\n")
    }\n\n${"═".repeat(40)}\nNombre de régies : ${items.length}\n\nSignature client : ____________________\nDate : ____________________`;
    setRecap({ chantierId, nom: `${nom}${numero}`, text, items, emailTech: ch?.email_technicien || "" });
    setView("recap");
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div><div style={{ color: "#F59E0B", fontWeight: 700 }}>Chargement...</div></div>
    </div>
  );

  // ─── Vue saisie ───────────────────────────────────────────────────────────
  if (view === "saisie") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>←</button>
        <div style={{ textAlign: "center" }}><div style={S.logoTitle}>Nouvelle Régie</div><div style={S.logoSub}>Saisie terrain</div></div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>
        {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

        {/* DATE */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📅 Date</div>
          <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        {/* CHANTIER */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🏗 Chantier *</div>
          {!showNewChantier ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...S.select, flex: 1 }} value={form.chantier_id} onChange={e => {
                const c = chantiers.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, chantier_id: e.target.value, chantier_nom: c?.nom || "" }));
              }}>
                <option value="">Sélectionner...</option>
                {chantiers.map(c => <option key={c.id} value={c.id}>{c.numero ? `[${c.numero}] ` : ""}{c.nom}</option>)}
              </select>
              <button style={S.btnGhost} onClick={() => setShowNewChantier(true)}>+ Nouveau</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={S.label}>Nom du chantier *</label>
                <input style={S.input} placeholder="Ex: Rénovation Villa Dupont" value={newChantier.nom} onChange={e => setNewChantier(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Numéro de l'affaire</label>
                <input style={S.input} placeholder="Ex: 2024-087" value={newChantier.numero} onChange={e => setNewChantier(f => ({ ...f, numero: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Technicien responsable</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {TECH_EMAILS.map(t => (
                    <button key={t.id} style={S.techBtn(newChantier.techIds.includes(t.id))} onClick={() => toggleTechId(t.id)}>{t.id}</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <input style={{ ...S.input, borderRadius: "10px 0 0 10px", flex: 1 }} placeholder="prénom.nom" value={newChantier.techCustom} onChange={e => setNewChantier(f => ({ ...f, techCustom: e.target.value }))} />
                  <div style={{ background: "#1E2235", border: "1px solid #1E2235", borderLeft: "none", borderRadius: "0 10px 10px 0", padding: "12px 10px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>@bourquinelectricite.ch</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnGhost, flex: 1, color: "#10B981", borderColor: "#10B981" }} onClick={addChantier}>Créer</button>
                <button style={S.btnGhost} onClick={() => setShowNewChantier(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        {/* INITIALES */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👷 Monteur *</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {monteurs.map(m => (
              <button key={m} style={S.monteurBtn(form.initiales === m)} onClick={() => setForm(f => ({ ...f, initiales: m }))}>{m}</button>
            ))}
            {!showAddMonteur ? (
              <button style={{ ...S.btnGhost, padding: "10px 14px" }} onClick={() => setShowAddMonteur(true)}>+</button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...S.input, width: 70, padding: "10px" }} placeholder="ZB" maxLength={3} value={newMonteurVal} onChange={e => setNewMonteurVal(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && addMonteur()} autoFocus />
                <button style={{ ...S.btnGhost, color: "#10B981", borderColor: "#10B981" }} onClick={addMonteur}>OK</button>
                <button style={S.btnGhost} onClick={() => { setShowAddMonteur(false); setNewMonteurVal(""); }}>✕</button>
              </div>
            )}
          </div>
          {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).map(m => (
                <button key={m} onClick={() => saveMonteurs(monteurs.filter(x => x !== m))} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>{m} ✕</button>
              ))}
            </div>
          )}
        </div>

        {/* DEMANDEUR */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🙋 Qui a fait la demande ?</div>
          <input style={S.input} placeholder="Nom Prénom (ex: Marc Dupont, architecte)" value={form.demandeur} onChange={e => setForm(f => ({ ...f, demandeur: e.target.value }))} />
        </div>

        {/* CATEGORIES */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🏷 Catégorie(s) * <span style={{ fontSize: 10, color: "#4B5563", fontWeight: 400 }}>Sélection multiple</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={S.catBtn(form.categories.includes(cat.id))} onClick={() => toggleCat(cat.id)}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
          {form.categories.includes("autre") && (
            <input style={{ ...S.input, marginTop: 8 }} placeholder="Précise la catégorie..." value={form.categorie_custom} onChange={e => setForm(f => ({ ...f, categorie_custom: e.target.value }))} />
          )}
        </div>

        {/* EMPLACEMENT */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📍 Emplacement</div>
          <input style={S.input} placeholder="Ex: Cuisine RDC, Local technique cave, Bureau 3e étage..." value={form.emplacement} onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))} />
        </div>

        {/* MAIN D'OEUVRE */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👷 Main d'oeuvre *</div>
          {form.lignes_mo.map((l, idx) => {
            const svc = SERVICES_MO.find(x => x.id === l.service);
            return (
              <div key={l.id} style={S.rowLine}>
                <div style={{ flex: 2 }}>
                  {idx === 0 && <label style={S.labelOpt}>Service</label>}
                  <select style={S.select} value={l.service} onChange={e => updateMO(l.id, "service", e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {SERVICES_MO.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ width: 70 }}>
                  {idx === 0 && <label style={S.labelOpt}>Qté</label>}
                  <input style={S.input} type="number" step="0.5" placeholder="0" value={l.quantite} onChange={e => updateMO(l.id, "quantite", e.target.value)} />
                </div>
                <div style={{ width: 40, paddingTop: idx === 0 ? 26 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, color: "#4B5563", fontWeight: 700 }}>{svc?.unite?.toUpperCase() || "H"}</span>
                </div>
                {form.lignes_mo.length > 1 && (
                  <button style={{ ...S.deleteSmall, marginTop: idx === 0 ? 22 : 0 }} onClick={() => removeMO(l.id)}>✕</button>
                )}
              </div>
            );
          })}
          <button style={S.btnAdd} onClick={() => setForm(f => ({ ...f, lignes_mo: [...f.lignes_mo, EMPTY_MO()] }))}>+ Ajouter un service</button>
        </div>

        {/* MATERIEL */}
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={S.sectionTitle}>📦 Matériel</div>
            <button
              style={{ ...S.techBtn(!form.has_materiel), fontSize: 12, padding: "6px 12px" }}
              onClick={() => setForm(f => ({ ...f, has_materiel: !f.has_materiel, lignes_mat: !f.has_materiel ? [EMPTY_MAT()] : [] }))}
            >
              {form.has_materiel ? "✓ Oui" : "Non"}
            </button>
          </div>
          {form.has_materiel && (
            <>
              {form.lignes_mat.map((l, idx) => (
                <div key={l.id} style={{ background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, textTransform: "uppercase" }}>Ligne {idx + 1}</span>
                    {form.lignes_mat.length > 1 && <button style={S.deleteSmall} onClick={() => removeMat(l.id)}>✕</button>}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={S.labelOpt}>Matériel, appareillage et appareil</label>
                    <input style={S.input} placeholder="Description du matériel..." value={l.designation} onChange={e => updateMat(l.id, "designation", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.labelOpt}>ELDAS n°</label>
                      <input style={S.input} placeholder="Ex: 441.100.01" value={l.eldas} onChange={e => updateMat(l.id, "eldas", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.labelOpt}>Fournisseur</label>
                      <select style={S.select} value={l.fournisseur} onChange={e => updateMat(l.id, "fournisseur", e.target.value)}>
                        <option value="">Choisir...</option>
                        {FOURNISSEURS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ width: 70 }}>
                      <label style={S.labelOpt}>Qté</label>
                      <input style={S.input} type="number" placeholder="0" value={l.quantite} onChange={e => updateMat(l.id, "quantite", e.target.value)} />
                    </div>
                  </div>
                  {l.fournisseur === "Autre" && (
                    <div style={{ marginTop: 8 }}>
                      <label style={S.labelOpt}>Nom du fournisseur</label>
                      <input style={S.input} placeholder="Nom du fournisseur..." value={l.fournisseur_custom} onChange={e => updateMat(l.id, "fournisseur_custom", e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
              <button style={S.btnAdd} onClick={() => setForm(f => ({ ...f, lignes_mat: [...f.lignes_mat, EMPTY_MAT()] }))}>+ Ajouter une ligne matériel</button>
            </>
          )}
        </div>

        {/* PHOTO */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📷 Photo</div>
          <div style={S.photoBox} onClick={() => fileRef.current.click()}>
            {photoPreview
              ? <img src={photoPreview} style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover" }} alt="preview" />
              : <div><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><div style={{ fontSize: 13, color: "#4B5563" }}>Prendre une photo comme preuve</div></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: (!form.chantier_id || !form.initiales || form.categories.length === 0 || !form.lignes_mo.some(l => l.service) || saving) ? 0.4 : 1 }}
          onClick={submitRegie}
          disabled={!form.chantier_id || !form.initiales || form.categories.length === 0 || !form.lignes_mo.some(l => l.service) || saving}
        >
          {saving ? "Enregistrement..." : "✓ Enregistrer la régie"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563", marginTop: 8 }}>
          Obligatoire : chantier, monteur, catégorie, au moins un service MO
        </div>
        <div style={{ height: 40 }} />
      </div>
      {saved && <div style={S.toast}>✓ Régie enregistrée !</div>}
    </div>
  );

  // ─── Vue recap ────────────────────────────────────────────────────────────
  if (view === "recap") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>←</button>
        <div style={{ textAlign: "center" }}><div style={S.logoTitle}>Récapitulatif</div><div style={S.logoSub}>{recap?.nom}</div></div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>
        <div style={{ ...S.card, background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)", marginBottom: 16 }}>
          <div style={S.kpiLabel}>Régies à valider</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{recap?.items.length} régie{recap?.items.length !== 1 ? "s" : ""}</div>
        </div>

        {recap?.items.map(r => (
          <div key={r.id} style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E8EAF0", marginBottom: 6 }}>
              {r.categorie} {r.initiales && <span style={{ ...S.initBadge, marginLeft: 6 }}>{r.initiales}</span>}
            </div>
            {r.demandeur   && <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Demandé par : {r.demandeur}</div>}
            {r.emplacement && <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>📍 {r.emplacement}</div>}
            {(r.lignes?.mo || []).map((l, i) => { const s = SERVICES_MO.find(x => x.id === l.service); return (<div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "3px 0" }}>👷 {s?.label || l.service}{l.quantite ? ` — ${l.quantite} ${s?.unite?.toUpperCase() || "H"}` : ""}</div>); })}
            {(r.lignes?.mat || []).map((l, i) => (<div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "3px 0" }}>📦 {l.designation}{l.eldas ? ` | ${l.eldas}` : ""}{l.fournisseur ? ` | ${l.fournisseur === "Autre" ? l.fournisseur_custom : l.fournisseur}` : ""}{l.quantite ? ` | ${l.quantite}` : ""}</div>))}
            {r.photo_url && <img src={r.photo_url} style={{ width: "100%", borderRadius: 8, maxHeight: 140, objectFit: "cover", margin: "8px 0" }} alt="photo" />}
            {r.signature_url ? (
              <div style={{ ...S.sigBox, background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 6 }}>✓ Signé</div>
                <img src={r.signature_url} style={{ width: "100%", borderRadius: 6, maxHeight: 80, objectFit: "contain", background: "#fff" }} alt="signature" />
              </div>
            ) : (
              <button style={{ ...S.btnSecondary, width: "100%", marginTop: 8 }} onClick={() => setShowSignature(r.id)}>✍️ Faire signer le client</button>
            )}
          </div>
        ))}

        <div style={{ ...S.dashSection, marginTop: 16 }}>Document à envoyer</div>
        <div style={S.recapBox}>{recap?.text}</div>

        <a
          href={`mailto:${recap?.emailTech || ""}?subject=Régies chantier - ${recap?.nom}&body=${encodeURIComponent(recap?.text || "")}`}
          style={{ ...S.btnPrimary, marginTop: 16, display: "block", textAlign: "center", textDecoration: "none" }}
          onClick={() => recap?.items.forEach(r => updateStatus(r.id, "envoye"))}
        >
          ✉️ Envoyer au technicien
        </a>
        <button style={{ ...S.btnPrimary, marginTop: 8, background: "#1E2235", color: "#9CA3AF", border: "none" }} onClick={() => { try { navigator.clipboard.writeText(recap?.text); } catch {} }}>
          📋 Copier le texte
        </button>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button style={{ ...S.btnSecondary, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "envoye")); setView("dashboard"); }}>Marquer envoyé</button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "facture")); setView("dashboard"); }}>✓ Facturé</button>
        </div>
        <div style={{ height: 40 }} />
      </div>
      {showSignature && <SignatureCanvas onSave={(d) => handleSignature(showSignature, d)} onCancel={() => setShowSignature(null)} />}
    </div>
  );

  // ─── Dashboard ────────────────────────────────────────────────────────────
  const totalRegies    = regies.filter(r => r.status !== "facture").length;
  const enAttenteCount = regies.filter(r => r.status === "en_attente").length;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>⚡</div>
          <div><div style={S.logoTitle}>Bourquin Électricité</div><div style={S.logoSub}>Suivi régies</div></div>
        </div>
        <button onClick={loadData} style={S.btnGhost}>↻ Sync</button>
      </div>
      <div style={S.body}>
        {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}
        <div style={S.kpiGrid}>
          <div style={S.kpiCard(false)}><div style={S.kpiLabel}>Régies actives</div><div style={S.kpiVal(false)}>{totalRegies}</div></div>
          <div style={S.kpiCard(enAttenteCount > 0)}><div style={S.kpiLabel}>Sans signature</div><div style={S.kpiVal(enAttenteCount > 0)}>{enAttenteCount}</div></div>
        </div>
        {enAttenteCount > 0 && (
          <div style={S.alertBanner}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{enAttenteCount} régie{enAttenteCount !== 1 ? "s" : ""} sans signature</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Faire signer ou envoyer au technicien</div>
            </div>
          </div>
        )}
        <div style={S.dashSection}>Chantiers</div>
        {chantiers.filter(c => regiesByChantier(c.id).length > 0).length === 0 ? (
          <div style={S.emptyState}><div style={{ fontSize: 44, marginBottom: 12 }}>🏗</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aucun chantier</div><div style={{ fontSize: 13 }}>Appuie sur + pour saisir ta première régie</div></div>
        ) : (
          chantiers.map(chantier => {
            const items = regiesByChantier(chantier.id);
            if (items.length === 0) return null;
            const nf = nonFactures(chantier.id);
            const sansSig = nf.filter(r => r.status === "en_attente").length;
            return (
              <div key={chantier.id} style={S.chantierCard}>
                <div style={S.chantierHeader}>
                  <div>
                    <div style={S.chantierName}>{chantier.nom}</div>
                    {chantier.numero && <div style={S.chantierNumero}>N° affaire : {chantier.numero}</div>}
                    <div style={S.chantierMeta}>{items.length} régie{items.length !== 1 ? "s" : ""} · {nf.length} active{nf.length !== 1 ? "s" : ""}</div>
                  </div>
                  {sansSig > 0 && <span style={S.badge(STATUS_COLORS.en_attente)}>⚠️ {sansSig}</span>}
                </div>
                {nf.map(r => (
                  <div key={r.id} style={S.regieRow}>
                    {r.photo_url && <img src={r.photo_url} style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} alt="photo" />}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#E8EAF0" }}>{r.categorie}</div>
                      <button style={S.deleteSmall} onClick={() => setConfirmDelete(r.id)}>🗑</button>
                    </div>
                    <div style={S.regieMeta}>
                      {r.initiales && <span style={S.initBadge}>{r.initiales}</span>}
                      {r.demandeur && <span style={S.typeBadge}>{r.demandeur}</span>}
                      {r.emplacement && <span style={S.typeBadge}>📍 {r.emplacement}</span>}
                      <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(r.created_at)}</span>
                    </div>
                    {(r.lignes?.mo || []).map((l, i) => { const s = SERVICES_MO.find(x => x.id === l.service); return (<div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "2px 0" }}>👷 {s?.label || l.service}{l.quantite ? ` — ${l.quantite} ${s?.unite?.toUpperCase() || "H"}` : ""}</div>); })}
                    {(r.lignes?.mat || []).filter(l => l.designation).length > 0 && (
                      <div style={{ fontSize: 12, color: "#4B5563", marginTop: 4 }}>📦 {r.lignes.mat.length} ligne{r.lignes.mat.length !== 1 ? "s" : ""} matériel</div>
                    )}
                    {r.signature_url && (
                      <div style={{ ...S.sigBox, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)", marginTop: 8 }}>
                        <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, marginBottom: 4 }}>✓ Signé</div>
                        <img src={r.signature_url} style={{ width: "100%", maxHeight: 60, objectFit: "contain", background: "#fff", borderRadius: 6 }} alt="signature" />
                      </div>
                    )}
                    <div style={S.statusRow}>
                      {Object.entries(STATUS_COLORS).map(([key, val]) => (
                        <button key={key} style={S.statusBtn(r.status === key, val)} onClick={() => updateStatus(r.id, key)}>{val.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {nf.length > 0 && (
                  <button style={{ ...S.btnPrimary, marginTop: 14 }} onClick={() => generateRecap(chantier.id)}>📄 Générer récapitulatif</button>
                )}
              </div>
            );
          })
        )}
        <div style={{ height: 80 }} />
      </div>

      {confirmDelete && (
        <div style={S.overlay}><div style={S.modal}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 8 }}>Supprimer cette régie ?</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Cette action est irréversible.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnDanger, flex: 1, padding: "12px" }} onClick={() => deleteRegie(confirmDelete)}>Oui, supprimer</button>
            <button style={{ ...S.btnGhost, flex: 1, padding: "12px" }} onClick={() => setConfirmDelete(null)}>Annuler</button>
          </div>
        </div></div>
      )}

      <button style={S.fab} onClick={() => setView("saisie")}>+</button>
    </div>
  );
}
