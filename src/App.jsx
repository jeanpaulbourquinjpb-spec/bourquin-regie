import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tibwhditawfhrxpmsrtp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYndoZGl0YXdmaHJ4cG1zcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDk4OTksImV4cCI6MjA5NDkyNTg5OX0.k9ago70XNq0GlFdFKDjXKoPb8j1a3CZMgEfrwBvar7I";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = [
  { id: "heures", label: "Heures régie", icon: "⏱" },
  { id: "materiel", label: "Matériel non prévu", icon: "🔧" },
  { id: "plans", label: "Modification plans", icon: "📐" },
  { id: "cache", label: "Travaux cachés", icon: "🔍" },
  { id: "autre", label: "Autre", icon: "📋" },
];

const TYPE_TRAVAIL = [
  { id: "mo", label: "Main d'oeuvre" },
  { id: "mat", label: "Matériel" },
  { id: "mo_mat", label: "MO + Matériel" },
];

const STATUS_COLORS = {
  en_attente: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#EF4444", label: "En attente" },
  signe:      { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10B981", label: "Signé" },
  envoye:     { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#3B82F6", label: "Envoyé" },
  facture:    { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#8B5CF6", label: "Facturé" },
};

const DEFAULT_MONTEURS = ["JP", "AL", "MR", "FB", "PL"];

const EMPTY_LIGNE = () => ({ id: Date.now(), description: "", type_travail: "", quantite: "", unite: "h", commentaire: "" });

function safeLocalStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: "#0A0C12", minHeight: "100vh", color: "#E8EAF0", maxWidth: 500, margin: "0 auto" },
  header: { background: "linear-gradient(135deg, #13162A 0%, #0A0C12 100%)", borderBottom: "1px solid #1E2235", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  logoWrap: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "linear-gradient(135deg, #F59E0B, #EF4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  logoTitle: { fontSize: 14, fontWeight: 800, color: "#E8EAF0" },
  logoSub: { fontSize: 10, color: "#4B5563", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 1 },
  body: { padding: "16px 14px" },
  card: { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 12 },
  kpiGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  kpiCard: (alert) => ({ background: alert ? "rgba(239,68,68,0.08)" : "#13162A", border: "1px solid", borderColor: alert ? "rgba(239,68,68,0.3)" : "#1E2235", borderRadius: 14, padding: "14px 16px" }),
  kpiVal: (alert) => ({ fontSize: 20, fontWeight: 800, color: alert ? "#EF4444" : "#F59E0B", letterSpacing: -0.5, marginTop: 4 }),
  kpiLabel: { fontSize: 10, color: "#4B5563", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 },
  sectionTitle: { fontSize: 10, color: "#4B5563", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, marginTop: 4 },
  chantierCard: { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 10 },
  chantierHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  chantierName: { fontSize: 15, fontWeight: 700, color: "#E8EAF0" },
  chantierMeta: { fontSize: 11, color: "#4B5563", marginTop: 2 },
  chantierNumero: { fontSize: 11, color: "#F59E0B", fontWeight: 700, marginTop: 2 },
  regieRow: { borderTop: "1px solid #1E2235", paddingTop: 10, marginTop: 10 },
  regieDesc: { fontSize: 13, fontWeight: 600, color: "#E8EAF0", marginBottom: 4 },
  regieMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 },
  badge: (color) => ({ background: color.bg, border: `1px solid ${color.border}`, color: color.text, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  initialesBadge: { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 },
  typeBadge: { background: "#1E2235", color: "#9CA3AF", borderRadius: 6, padding: "3px 8px", fontSize: 11 },
  statusRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 },
  statusBtn: (active, color) => ({ background: active ? color.bg : "transparent", color: active ? color.text : "#4B5563", border: "1px solid", borderColor: active ? color.border : "#1E2235", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }),
  btnPrimary: { background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "#0A0C12", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%", marginTop: 10 },
  btnSecondary: { background: "transparent", color: "#F59E0B", border: "1px solid #F59E0B", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#4B5563", border: "1px solid #1E2235", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnDanger: { background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnAddLigne: { background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 8 },
  fab: { position: "fixed", bottom: 24, right: 20, width: 60, height: 60, background: "linear-gradient(135deg, #F59E0B, #EF4444)", borderRadius: "50%", border: "none", fontSize: 28, cursor: "pointer", color: "#0A0C12", fontWeight: 700, boxShadow: "0 8px 32px rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 6, display: "block", fontWeight: 600 },
  labelOpt: { fontSize: 12, color: "#4B5563", marginBottom: 6, display: "block", fontWeight: 500 },
  input: { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 15, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 15, outline: "none", boxSizing: "border-box" },
  fieldGroup: { marginBottom: 16 },
  catGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  catBtn: (active) => ({ background: active ? "rgba(245,158,11,0.12)" : "#0A0C12", border: "1px solid", borderColor: active ? "#F59E0B" : "#1E2235", borderRadius: 10, padding: "12px 10px", color: active ? "#F59E0B" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }),
  typeBtn: (active) => ({ background: active ? "rgba(59,130,246,0.12)" : "#0A0C12", border: "1px solid", borderColor: active ? "#3B82F6" : "#1E2235", borderRadius: 10, padding: "10px 8px", color: active ? "#3B82F6" : "#6B7280", fontSize: 11, fontWeight: 700, cursor: "pointer", flex: 1, textAlign: "center" }),
  monteurBtn: (active) => ({ background: active ? "rgba(245,158,11,0.15)" : "#0A0C12", border: "1px solid", borderColor: active ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "10px 0", color: active ? "#F59E0B" : "#6B7280", fontSize: 13, fontWeight: 800, cursor: "pointer", flex: 1, textAlign: "center", minWidth: 44 }),
  photoBox: { border: "2px dashed #1E2235", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: "#0A0C12" },
  toast: { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "white", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, zIndex: 200 },
  backBtn: { background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  recapBox: { background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#E8EAF0", whiteSpace: "pre-wrap", lineHeight: 1.8 },
  alertBanner: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: "#4B5563" },
  signatureCanvas: { width: "100%", height: 160, background: "#fff", border: "1px solid #1E2235", borderRadius: 10, touchAction: "none", cursor: "crosshair" },
  signatureBox: { background: "#13162A", border: "1px solid #1E2235", borderRadius: 12, padding: 14, marginTop: 12 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal: { background: "#13162A", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 500, margin: "0 auto" },
  ligneCard: { background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 12, padding: 12, marginBottom: 8, position: "relative" },
  ligneNum: { fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 14 },
  deleteBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
};

// ── Signature ─────────────────────────────────────────────────────────────────
function SignatureCanvas({ onSave, onCancel }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: (touch.clientX - rect.left) * (canvas.width / rect.width), y: (touch.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const stopDraw  = (e) => { e?.preventDefault(); drawing.current = false; };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke();
    lastPos.current = pos;
  };
  const clear = () => canvasRef.current.getContext("2d").clearRect(0, 0, 460, 160);
  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 4 }}>Signature client</div>
        <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 14 }}>Signer dans le cadre blanc</div>
        <canvas ref={canvasRef} width={460} height={160} style={S.signatureCanvas}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...S.btnPrimary, marginTop: 0, flex: 2 }} onClick={() => onSave(canvasRef.current.toDataURL("image/png"))}>✓ Valider</button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={clear}>Effacer</button>
          <button style={{ ...S.btnDanger, flex: 1 }} onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ── Composant ligne de régie ──────────────────────────────────────────────────
function LigneForm({ ligne, index, onChange, onRemove, canRemove }) {
  return (
    <div style={S.ligneCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={S.ligneNum}>Ligne {index + 1}</div>
        {canRemove && <button style={S.deleteBtn} onClick={() => onRemove(ligne.id)}>✕ Supprimer</button>}
      </div>

      <div style={{ ...S.fieldGroup, marginBottom: 10 }}>
        <label style={S.label}>Description *</label>
        <input style={S.input} placeholder="Ex: Pose 3 prises supplémentaires..." value={ligne.description} onChange={e => onChange(ligne.id, "description", e.target.value)} />
      </div>

      <div style={{ ...S.fieldGroup, marginBottom: 10 }}>
        <label style={S.labelOpt}>Type de travail</label>
        <div style={{ display: "flex", gap: 6 }}>
          {TYPE_TRAVAIL.map(t => (
            <button key={t.id} style={S.typeBtn(ligne.type_travail === t.id)} onClick={() => onChange(ligne.id, "type_travail", ligne.type_travail === t.id ? "" : t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={S.labelOpt}>Quantité</label>
          <input style={S.input} type="number" step="0.5" placeholder="0" value={ligne.quantite} onChange={e => onChange(ligne.id, "quantite", e.target.value)} />
        </div>
        <div style={{ width: 90 }}>
          <label style={S.labelOpt}>Unité</label>
          <select style={S.select} value={ligne.unite} onChange={e => onChange(ligne.id, "unite", e.target.value)}>
            <option value="h">Heures</option>
            <option value="u">Unités</option>
            <option value="m">Mètres</option>
            <option value="m²">m²</option>
            <option value="forf.">Forfait</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 0 }}>
        <label style={S.labelOpt}>Commentaire</label>
        <input style={S.input} placeholder="Précision supplémentaire..." value={ligne.commentaire} onChange={e => onChange(ligne.id, "commentaire", e.target.value)} />
      </div>
    </div>
  );
}

// ── App principale ────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [regies, setRegies] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [monteurs, setMonteurs] = useState(() => safeLocalStorage("monteurs", DEFAULT_MONTEURS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recap, setRecap] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showNewChantier, setShowNewChantier] = useState(false);
  const [showAddMonteur, setShowAddMonteur] = useState(false);
  const [newMonteurInitiales, setNewMonteurInitiales] = useState("");
  const [showSignature, setShowSignature] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newChantier, setNewChantier] = useState({ nom: "", numero: "", email_technicien: "", email_client: "" });
  const [form, setForm] = useState({
    chantier_id: "", chantier_nom: "", categorie: "",
    initiales: "", date: new Date().toISOString().split("T")[0],
    lignes: [EMPTY_LIGNE()],
  });
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setErrorMsg(null);
    try {
      const [{ data: c, error: ce }, { data: r, error: re }] = await Promise.all([
        supabase.from("chantiers").select("*").order("created_at", { ascending: false }),
        supabase.from("regies").select("*").order("created_at", { ascending: false }),
      ]);
      if (ce || re) throw new Error();
      setChantiers(c || []); setRegies(r || []);
    } catch { setErrorMsg("Impossible de charger les données. Vérifie ta connexion."); }
    setLoading(false);
  };

  const saveMonteurs = (list) => { setMonteurs(list); try { localStorage.setItem("monteurs", JSON.stringify(list)); } catch {} };
  const addMonteur = () => {
    const i = newMonteurInitiales.trim().toUpperCase();
    if (!i || monteurs.includes(i)) return;
    saveMonteurs([...monteurs, i]);
    setForm(f => ({ ...f, initiales: i }));
    setNewMonteurInitiales(""); setShowAddMonteur(false);
  };
  const removeMonteur = (m) => { if (!DEFAULT_MONTEURS.includes(m)) saveMonteurs(monteurs.filter(x => x !== m)); };

  const addChantier = async () => {
    if (!newChantier.nom.trim()) return;
    const { data, error } = await supabase.from("chantiers").insert({
      nom: newChantier.nom.trim(),
      numero: newChantier.numero.trim() || null,
      email_technicien: newChantier.email_technicien.trim() || null,
      email_client: newChantier.email_client.trim() || null,
    }).select().single();
    if (error) { alert("Erreur lors de la création du chantier."); return; }
    setChantiers(prev => [data, ...prev]);
    setForm(f => ({ ...f, chantier_id: data.id, chantier_nom: data.nom }));
    setNewChantier({ nom: "", numero: "", email_technicien: "", email_client: "" });
    setShowNewChantier(false);
  };

  const updateLigne = (id, field, value) => {
    setForm(f => ({ ...f, lignes: f.lignes.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };
  const addLigne = () => setForm(f => ({ ...f, lignes: [...f.lignes, EMPTY_LIGNE()] }));
  const removeLigne = (id) => setForm(f => ({ ...f, lignes: f.lignes.filter(l => l.id !== id) }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file); setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file, folder, contentType) => {
    try {
      let blob = file;
      if (typeof file === "string") {
        const binary = atob(file.split(",")[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        blob = new Blob([array], { type: contentType });
      }
      const ext = contentType === "image/png" ? "png" : (file.name?.split(".").pop() || "jpg");
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("photos-regies").upload(path, blob, { contentType });
      if (error) return null;
      const { data } = supabase.storage.from("photos-regies").getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  };

  const handleSignature = async (regieId, dataUrl) => {
    setShowSignature(null);
    const url = await uploadFile(dataUrl, "signatures", "image/png");
    if (!url) { alert("Erreur lors de l'upload de la signature."); return; }
    const { error } = await supabase.from("regies").update({ signature_url: url, status: "signe" }).eq("id", regieId);
    if (!error) setRegies(prev => prev.map(r => r.id === regieId ? { ...r, signature_url: url, status: "signe" } : r));
  };

  const deleteRegie = async (id) => {
    const { error } = await supabase.from("regies").delete().eq("id", id);
    if (!error) { setRegies(prev => prev.filter(r => r.id !== id)); setConfirmDelete(null); }
    else alert("Erreur lors de la suppression.");
  };

  const submitRegie = async () => {
    const lignesValides = form.lignes.filter(l => l.description.trim());
    if (!form.chantier_id || !form.categorie || !form.initiales || lignesValides.length === 0) return;
    setSaving(true); setErrorMsg(null);
    let photo_url = null;
    if (photo) photo_url = await uploadFile(photo, "regies", photo.type || "image/jpeg");
    const description = lignesValides.map(l => l.description).join(" / ");
    const { data, error } = await supabase.from("regies").insert({
      chantier_id: form.chantier_id,
      chantier_nom: form.chantier_nom,
      categorie: form.categorie,
      description,
      lignes: lignesValides,
      quantite: lignesValides.reduce((s, l) => s + (parseFloat(l.quantite) || 0), 0) || null,
      unite: "h",
      initiales: form.initiales,
      photo_url,
      date: form.date,
      status: "en_attente",
    }).select().single();
    setSaving(false);
    if (error) { setErrorMsg("Erreur lors de l'enregistrement. Vérifie ta connexion."); return; }
    setRegies(prev => [data, ...prev]);
    setSaved(true);
    setPhoto(null); setPhotoPreview(null);
    setForm(f => ({ ...f, categorie: "", initiales: "", date: new Date().toISOString().split("T")[0], lignes: [EMPTY_LIGNE()] }));
    setTimeout(() => setSaved(false), 2500);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("regies").update({ status }).eq("id", id);
    if (!error) setRegies(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const getChantier = (id) => chantiers.find(c => c.id === id);
  const regiesByChantier = (id) => regies.filter(r => r.chantier_id === id);
  const nonFactures = (id) => regiesByChantier(id).filter(r => r.status !== "facture");

  const generateRecap = (chantierId) => {
    const items = nonFactures(chantierId);
    const ch = getChantier(chantierId);
    const nom = ch?.nom || "";
    const numero = ch?.numero ? ` (N° ${ch.numero})` : "";
    const text = `RÉCAPITULATIF PLUS VALUES / RÉGIE\nChantier : ${nom}${numero}\nDate : ${formatDate(new Date().toISOString())}\n\n${
      items.map((r, i) => {
        const cat = CATEGORIES.find(c => c.id === r.categorie);
        const lignes = r.lignes || [{ description: r.description, type_travail: r.type_travail, quantite: r.quantite, unite: r.unite, commentaire: r.commentaire }];
        return `${i + 1}. ${cat?.label || r.categorie} [${r.initiales}] — ${formatDate(r.created_at)}\n${
          lignes.map(l => {
            const type = TYPE_TRAVAIL.find(t => t.id === l.type_travail);
            return `   • ${l.description}${l.quantite ? ` — ${l.quantite} ${l.unite}` : ""}${type ? ` (${type.label})` : ""}${l.commentaire ? `\n     ${l.commentaire}` : ""}`;
          }).join("\n")
        }${r.signature_url ? "\n   ✓ Signature client obtenue" : ""}`;
      }).join("\n\n")
    }\n\n${"─".repeat(40)}\nNombre de régies : ${items.length}\n\nSignature client : ____________________\nDate : ____________________`;
    setRecap({ chantierId, nom: `${nom}${numero}`, text, items, emailTechnicien: ch?.email_technicien || "" });
    setView("recap");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
        <div style={{ color: "#F59E0B", fontWeight: 700 }}>Chargement...</div>
      </div>
    </div>
  );

  // ── Vue saisie ────────────────────────────────────────────────────────────
  if (view === "saisie") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={S.logoTitle}>Nouvelle Régie</div>
          <div style={S.logoSub}>Saisie terrain</div>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>
        {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

        {/* Chantier */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Chantier *</label>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={S.input} placeholder="Nom du chantier *" value={newChantier.nom} onChange={e => setNewChantier(f => ({ ...f, nom: e.target.value }))} />
              <input style={S.input} placeholder="Numéro (ex: 2024-087)" value={newChantier.numero} onChange={e => setNewChantier(f => ({ ...f, numero: e.target.value }))} />
              <input style={S.input} placeholder="Email technicien responsable" type="email" value={newChantier.email_technicien} onChange={e => setNewChantier(f => ({ ...f, email_technicien: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnGhost, flex: 1, color: "#10B981", borderColor: "#10B981" }} onClick={addChantier}>Créer</button>
                <button style={S.btnGhost} onClick={() => setShowNewChantier(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        {/* Initiales */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Initiales du monteur *</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {monteurs.map(m => (
              <button key={m} style={S.monteurBtn(form.initiales === m)} onClick={() => setForm(f => ({ ...f, initiales: m }))}>{m}</button>
            ))}
            {!showAddMonteur ? (
              <button style={{ ...S.btnGhost, padding: "10px 14px" }} onClick={() => setShowAddMonteur(true)}>+</button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...S.input, width: 70, padding: "10px" }} placeholder="ZB" maxLength={3} value={newMonteurInitiales} onChange={e => setNewMonteurInitiales(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && addMonteur()} autoFocus />
                <button style={{ ...S.btnGhost, color: "#10B981", borderColor: "#10B981" }} onClick={addMonteur}>OK</button>
                <button style={S.btnGhost} onClick={() => { setShowAddMonteur(false); setNewMonteurInitiales(""); }}>✕</button>
              </div>
            )}
          </div>
          {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).map(m => (
                <button key={m} onClick={() => removeMonteur(m)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>{m} ✕</button>
              ))}
            </div>
          )}
        </div>

        {/* Catégorie */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Catégorie *</label>
          <div style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={S.catBtn(form.categorie === cat.id)} onClick={() => setForm(f => ({ ...f, categorie: cat.id }))}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lignes */}
        <div style={S.fieldGroup}>
          <label style={S.label}>Lignes de régie *</label>
          {form.lignes.map((ligne, index) => (
            <LigneForm key={ligne.id} ligne={ligne} index={index} onChange={updateLigne} onRemove={removeLigne} canRemove={form.lignes.length > 1} />
          ))}
          <button style={S.btnAddLigne} onClick={addLigne}>+ Ajouter une ligne</button>
        </div>

        {/* Photo */}
        <div style={S.fieldGroup}>
          <label style={S.labelOpt}>Photo (optionnel)</label>
          <div style={S.photoBox} onClick={() => fileRef.current.click()}>
            {photoPreview
              ? <img src={photoPreview} style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover" }} alt="preview" />
              : <div><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><div style={{ fontSize: 13, color: "#4B5563" }}>Prendre une photo comme preuve</div></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        {/* Date */}
        <div style={S.fieldGroup}>
          <label style={S.labelOpt}>Date</label>
          <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: (!form.chantier_id || !form.categorie || !form.initiales || !form.lignes.some(l => l.description.trim()) || saving) ? 0.4 : 1 }}
          onClick={submitRegie}
          disabled={!form.chantier_id || !form.categorie || !form.initiales || !form.lignes.some(l => l.description.trim()) || saving}
        >
          {saving ? "Enregistrement..." : "✓ Enregistrer la régie"}
        </button>

        {(!form.initiales || !form.categorie || !form.chantier_id) && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563", marginTop: 8 }}>
            Obligatoire : chantier, initiales, catégorie + au moins une ligne décrite
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
      {saved && <div style={S.toast}>✓ Régie enregistrée !</div>}
    </div>
  );

  // ── Vue recap ─────────────────────────────────────────────────────────────
  if (view === "recap") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={S.logoTitle}>Récapitulatif</div>
          <div style={S.logoSub}>{recap?.nom}</div>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>
        <div style={{ ...S.card, background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)", marginBottom: 16 }}>
          <div style={S.kpiLabel}>Régies à valider</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{recap?.items.length} régie{recap?.items.length !== 1 ? "s" : ""}</div>
        </div>

        {recap?.items.map(r => (
          <div key={r.id} style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8EAF0", marginBottom: 6 }}>
              {CATEGORIES.find(c => c.id === r.categorie)?.icon} {CATEGORIES.find(c => c.id === r.categorie)?.label}
              {r.initiales && <span style={{ ...S.initialesBadge, marginLeft: 8 }}>{r.initiales}</span>}
            </div>
            {(r.lignes || []).map((l, i) => (
              <div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "4px 0", borderBottom: i < (r.lignes?.length - 1) ? "1px solid #1E2235" : "none" }}>
                • {l.description}{l.quantite ? ` — ${l.quantite} ${l.unite}` : ""}{l.commentaire ? ` (${l.commentaire})` : ""}
              </div>
            ))}
            {r.photo_url && <img src={r.photo_url} style={{ width: "100%", borderRadius: 8, maxHeight: 140, objectFit: "cover", margin: "8px 0" }} alt="photo" />}
            {r.signature_url ? (
              <div style={{ ...S.signatureBox, background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 6 }}>✓ Signé</div>
                <img src={r.signature_url} style={{ width: "100%", borderRadius: 6, maxHeight: 80, objectFit: "contain", background: "#fff" }} alt="signature" />
              </div>
            ) : (
              <button style={{ ...S.btnSecondary, width: "100%", marginTop: 8 }} onClick={() => setShowSignature(r.id)}>✍️ Faire signer le client</button>
            )}
          </div>
        ))}

        <div style={{ ...S.sectionTitle, marginTop: 16 }}>Document à envoyer au technicien</div>
        <div style={S.recapBox}>{recap?.text}</div>

        <a
          href={`mailto:${recap?.emailTechnicien || ""}?subject=Régies chantier - ${recap?.nom}&body=${encodeURIComponent(recap?.text || "")}`}
          style={{ ...S.btnPrimary, marginTop: 16, display: "block", textAlign: "center", textDecoration: "none" }}
          onClick={() => recap?.items.forEach(r => updateStatus(r.id, "envoye"))}
        >
          ✉️ Envoyer au technicien
        </a>

        <button style={{ ...S.btnPrimary, marginTop: 8, background: "#1E2235", color: "#9CA3AF", border: "none" }} onClick={() => { try { navigator.clipboard.writeText(recap?.text); } catch {} }}>
          📋 Copier le texte
        </button>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button style={{ ...S.btnSecondary, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "envoye")); setView("dashboard"); }}>
            Marquer envoyé
          </button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "facture")); setView("dashboard"); }}>
            ✓ Facturé
          </button>
        </div>
        <div style={{ height: 40 }} />
      </div>
      {showSignature && <SignatureCanvas onSave={(d) => handleSignature(showSignature, d)} onCancel={() => setShowSignature(null)} />}
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const totalRegies = regies.filter(r => r.status !== "facture").length;
  const enAttenteCount = regies.filter(r => r.status === "en_attente").length;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>⚡</div>
          <div>
            <div style={S.logoTitle}>Bourquin Électricité</div>
            <div style={S.logoSub}>Suivi régies</div>
          </div>
        </div>
        <button onClick={loadData} style={S.btnGhost}>↻ Sync</button>
      </div>

      <div style={S.body}>
        {errorMsg && <div style={S.errorBox}>{errorMsg}</div>}

        <div style={S.kpiGrid}>
          <div style={S.kpiCard(false)}>
            <div style={S.kpiLabel}>Régies actives</div>
            <div style={S.kpiVal(false)}>{totalRegies}</div>
          </div>
          <div style={S.kpiCard(enAttenteCount > 0)}>
            <div style={S.kpiLabel}>Sans signature</div>
            <div style={S.kpiVal(enAttenteCount > 0)}>{enAttenteCount}</div>
          </div>
        </div>

        {enAttenteCount > 0 && (
          <div style={S.alertBanner}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{enAttenteCount} régie{enAttenteCount !== 1 ? "s" : ""} sans signature client</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Faire signer ou envoyer au technicien</div>
            </div>
          </div>
        )}

        <div style={S.sectionTitle}>Chantiers</div>

        {chantiers.filter(c => regiesByChantier(c.id).length > 0).length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏗</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aucun chantier</div>
            <div style={{ fontSize: 13 }}>Appuie sur + pour saisir ta première régie</div>
          </div>
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
                    {chantier.numero && <div style={S.chantierNumero}>N° {chantier.numero}</div>}
                    <div style={S.chantierMeta}>{items.length} régie{items.length !== 1 ? "s" : ""} · {nf.length} active{nf.length !== 1 ? "s" : ""}</div>
                  </div>
                  {sansSig > 0 && <span style={S.badge(STATUS_COLORS.en_attente)}>⚠️ {sansSig} sans sig.</span>}
                </div>

                {nf.map(r => {
                  const cat = CATEGORIES.find(c => c.id === r.categorie);
                  const lignes = r.lignes || [{ description: r.description, quantite: r.quantite, unite: r.unite }];
                  return (
                    <div key={r.id} style={S.regieRow}>
                      {r.photo_url && <img src={r.photo_url} style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} alt="photo" />}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={S.regieDesc}>{cat?.icon} {cat?.label}</div>
                        <button style={S.deleteBtn} onClick={() => setConfirmDelete(r.id)}>🗑</button>
                      </div>
                      <div style={S.regieMeta}>
                        {r.initiales && <span style={S.initialesBadge}>{r.initiales}</span>}
                        <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(r.created_at)}</span>
                      </div>
                      {lignes.map((l, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "3px 0" }}>
                          • {l.description}{l.quantite ? ` — ${l.quantite} ${l.unite}` : ""}
                        </div>
                      ))}
                      {r.signature_url && (
                        <div style={{ ...S.signatureBox, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)", marginTop: 8 }}>
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
                  );
                })}

                {nf.length > 0 && (
                  <button style={{ ...S.btnPrimary, marginTop: 14 }} onClick={() => generateRecap(chantier.id)}>
                    📄 Générer récapitulatif
                  </button>
                )}
              </div>
            );
          })
        )}
        <div style={{ height: 80 }} />
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 8 }}>Supprimer cette régie ?</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Cette action est irréversible.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btnDanger, flex: 1, padding: "12px" }} onClick={() => deleteRegie(confirmDelete)}>Oui, supprimer</button>
              <button style={{ ...S.btnGhost, flex: 1, padding: "12px" }} onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <button style={S.fab} onClick={() => setView("saisie")}>+</button>
    </div>
  );
}
