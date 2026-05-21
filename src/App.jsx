import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  { id: "mo", label: "Main d'oeuvre", icon: "👷" },
  { id: "mat", label: "Matériel", icon: "📦" },
  { id: "mo_mat", label: "MO + Matériel", icon: "👷📦" },
];

const STATUS_COLORS = {
  en_attente: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#EF4444", label: "En attente" },
  signe: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10B981", label: "Signé" },
  envoye: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#3B82F6", label: "Envoyé" },
  facture: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#8B5CF6", label: "Facturé" },
};

const MONTEURS = ["JP", "AL", "MR", "FB", "PL", "Autre"];

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
  fab: { position: "fixed", bottom: 24, right: 20, width: 60, height: 60, background: "linear-gradient(135deg, #F59E0B, #EF4444)", borderRadius: "50%", border: "none", fontSize: 28, cursor: "pointer", color: "#0A0C12", fontWeight: 700, boxShadow: "0 8px 32px rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: 0.3 },
  input: { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 15, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 15, outline: "none", boxSizing: "border-box" },
  fieldGroup: { marginBottom: 16 },
  catGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  catBtn: (active) => ({ background: active ? "rgba(245,158,11,0.12)" : "#0A0C12", border: "1px solid", borderColor: active ? "#F59E0B" : "#1E2235", borderRadius: 10, padding: "12px 10px", color: active ? "#F59E0B" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }),
  typeBtn: (active) => ({ background: active ? "rgba(59,130,246,0.12)" : "#0A0C12", border: "1px solid", borderColor: active ? "#3B82F6" : "#1E2235", borderRadius: 10, padding: "11px 10px", color: active ? "#3B82F6" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", flex: 1, textAlign: "center" }),
  monteurBtn: (active) => ({ background: active ? "rgba(245,158,11,0.15)" : "#0A0C12", border: "1px solid", borderColor: active ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "10px 0", color: active ? "#F59E0B" : "#6B7280", fontSize: 14, fontWeight: 800, cursor: "pointer", flex: 1, textAlign: "center" }),
  photoBox: { border: "2px dashed #1E2235", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: "#0A0C12" },
  toast: { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "white", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, zIndex: 200, boxShadow: "0 4px 20px rgba(16,185,129,0.4)" },
  backBtn: { background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  recapBox: { background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#E8EAF0", whiteSpace: "pre-wrap", lineHeight: 1.8 },
  alertBanner: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: "#4B5563" },
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [regies, setRegies] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recap, setRecap] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showNewChantier, setShowNewChantier] = useState(false);
  const [newChantier, setNewChantier] = useState({ nom: "", numero: "", email: "" });
  const [form, setForm] = useState({
    chantier_id: "", chantier_nom: "", categorie: "", type_travail: "",
    description: "", heures: "", commentaire: "", initiales: "",
    date: new Date().toISOString().split("T")[0]
  });
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("chantiers").select("*").order("created_at", { ascending: false }),
      supabase.from("regies").select("*").order("created_at", { ascending: false }),
    ]);
    setChantiers(c || []);
    setRegies(r || []);
    setLoading(false);
  };

  const addChantier = async () => {
    if (!newChantier.nom.trim()) return;
    const { data, error } = await supabase.from("chantiers").insert({
      nom: newChantier.nom.trim(),
      numero: newChantier.numero.trim() || null,
      email_technicien: newChantier.email.trim() || null,
    }).select().single();
    if (!error && data) {
      setChantiers(prev => [data, ...prev]);
      setForm(f => ({ ...f, chantier_id: data.id, chantier_nom: data.nom }));
      setNewChantier({ nom: "", numero: "", email: "" });
      setShowNewChantier(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file) => {
    const ext = file.name.split(".").pop();
    const path = `regies/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos-regies").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("photos-regies").getPublicUrl(path);
    return data.publicUrl;
  };

  const submitRegie = async () => {
    if (!form.chantier_id || !form.categorie || !form.description || !form.initiales) return;
    setSaving(true);
    let photo_url = null;
    if (photo) photo_url = await uploadPhoto(photo);
    const { data, error } = await supabase.from("regies").insert({
      chantier_id: form.chantier_id,
      chantier_nom: form.chantier_nom,
      categorie: form.categorie,
      description: form.description,
      quantite: parseFloat(form.heures) || null,
      unite: "h",
      montant: null,
      commentaire: form.commentaire || null,
      initiales: form.initiales,
      type_travail: form.type_travail || null,
      photo_url,
      date: form.date,
      status: "en_attente",
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setRegies(prev => [data, ...prev]);
      setSaved(true);
      setPhoto(null);
      setPhotoPreview(null);
      setForm(f => ({ ...f, categorie: "", type_travail: "", description: "", heures: "", commentaire: "", initiales: "", date: new Date().toISOString().split("T")[0] }));
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("regies").update({ status }).eq("id", id);
    setRegies(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const getChantier = (id) => chantiers.find(c => c.id === id);
  const regiesByChantier = (id) => regies.filter(r => r.chantier_id === id);
  const nonFactures = (id) => regiesByChantier(id).filter(r => r.status !== "facture");

  const generateRecap = (chantierId) => {
    const items = nonFactures(chantierId);
    const ch = getChantier(chantierId);
    const nom = ch?.nom || "";
    const numero = ch?.numero ? ` (N° ${ch.numero})` : "";
    const text = `RÉCAPITULATIF PLUS VALUES / RÉGIE\nChantier : ${nom}${numero}\nDate : ${formatDate(new Date().toISOString())}\n\n${items.map((r, i) => {
      const cat = CATEGORIES.find(c => c.id === r.categorie);
      const type = TYPE_TRAVAIL.find(t => t.id === r.type_travail);
      return `${i + 1}. ${cat?.label || r.categorie} [${r.initiales}]\n   Date : ${formatDate(r.created_at)}\n   Description : ${r.description}${r.commentaire ? `\n   Commentaire : ${r.commentaire}` : ""}${r.quantite ? `\n   Heures : ${r.quantite}h` : ""}${type ? `\n   Type : ${type.label}` : ""}`;
    }).join("\n\n")}\n\n${"─".repeat(40)}\nTotal régies : ${items.length}\n\nSignature client : ____________________\nDate : ____________________`;
    setRecap({ chantierId, nom: `${nom}${numero}`, text, items });
    setView("recap");
  };

  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
        <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 15 }}>Chargement...</div>
      </div>
    </div>
  );

  if (view === "saisie") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={S.logoTitle}>Nouvelle Régie</div>
          <div style={S.logoSub}>Saisie terrain</div>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>

        <div style={S.fieldGroup}>
          <label style={S.label}>Chantier</label>
          {!showNewChantier ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...S.select, flex: 1 }} value={form.chantier_id} onChange={e => {
                const c = chantiers.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, chantier_id: e.target.value, chantier_nom: c?.nom || "" }));
              }}>
                <option value="">Sélectionner...</option>
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero ? `[${c.numero}] ` : ""}{c.nom}
                  </option>
                ))}
              </select>
              <button style={S.btnGhost} onClick={() => setShowNewChantier(true)}>+ Nouveau</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={S.input} placeholder="Nom du chantier *" value={newChantier.nom} onChange={e => setNewChantier(f => ({ ...f, nom: e.target.value }))} />
              <input style={S.input} placeholder="Numéro de chantier (ex: 2024-087)" value={newChantier.numero} onChange={e => setNewChantier(f => ({ ...f, numero: e.target.value }))} />
              <input style={S.input} placeholder="Email technicien responsable" type="email" value={newChantier.email} onChange={e => setNewChantier(f => ({ ...f, email: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnGhost, flex: 1, color: "#10B981", borderColor: "#10B981" }} onClick={addChantier}>Créer</button>
                <button style={S.btnGhost} onClick={() => setShowNewChantier(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Initiales du monteur</label>
          <div style={{ display: "flex", gap: 6 }}>
            {MONTEURS.map(m => (
              <button key={m} style={S.monteurBtn(form.initiales === m)} onClick={() => setForm(f => ({ ...f, initiales: m }))}>{m}</button>
            ))}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Catégorie</label>
          <div style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={S.catBtn(form.categorie === cat.id)} onClick={() => setForm(f => ({ ...f, categorie: cat.id }))}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Type de travail</label>
          <div style={{ display: "flex", gap: 8 }}>
            {TYPE_TRAVAIL.map(t => (
              <button key={t.id} style={S.typeBtn(form.type_travail === t.id)} onClick={() => setForm(f => ({ ...f, type_travail: t.id }))}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Description des travaux</label>
          <textarea style={{ ...S.input, minHeight: 90, resize: "vertical" }} placeholder="Décris précisément ce qui a été fait en plus..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Commentaire (optionnel)</label>
          <input style={S.input} placeholder="Ex: 2 prises supplémentaires demandées par le client..." value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Heures (optionnel)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input style={{ ...S.input, flex: 1 }} type="number" placeholder="ex: 2.5" value={form.heures} onChange={e => setForm(f => ({ ...f, heures: e.target.value }))} />
            <span style={{ color: "#6B7280", fontSize: 14, whiteSpace: "nowrap" }}>heures</span>
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Photo (optionnel)</label>
          <div style={S.photoBox} onClick={() => fileRef.current.click()}>
            {photoPreview
              ? <img src={photoPreview} style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover", marginBottom: 8 }} alt="preview" />
              : <div><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><div style={{ fontSize: 13, color: "#4B5563" }}>Prendre une photo comme preuve</div></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Date</label>
          <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        <button
          style={{ ...S.btnPrimary, opacity: (!form.chantier_id || !form.categorie || !form.description || !form.initiales || saving) ? 0.4 : 1 }}
          onClick={submitRegie}
          disabled={!form.chantier_id || !form.categorie || !form.description || !form.initiales || saving}
        >
          {saving ? "Enregistrement..." : "✓ Enregistrer la régie"}
        </button>

        {(!form.initiales || !form.description || !form.categorie || !form.chantier_id) && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563", marginTop: 8 }}>
            Obligatoire : chantier, initiales, catégorie, description
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
      {saved && <div style={S.toast}>✓ Régie enregistrée !</div>}
    </div>
  );

  if (view === "recap") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
          <div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{recap?.items.length} régie{recap?.items.length !== 1 ? "s" : ""}</div>
        </div>

        {recap?.items.filter(r => r.photo_url).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={S.sectionTitle}>Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {recap.items.filter(r => r.photo_url).map(r => (
                <img key={r.id} src={r.photo_url} style={{ width: "100%", borderRadius: 10, aspectRatio: "1", objectFit: "cover" }} alt="régie" />
              ))}
            </div>
          </div>
        )}

        <div style={S.sectionTitle}>Document client</div>
        <div style={S.recapBox}>{recap?.text}</div>

        <button style={{ ...S.btnPrimary, marginTop: 16 }} onClick={() => navigator.clipboard?.writeText(recap?.text)}>
          📋 Copier pour envoyer par mail
        </button>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button style={{ ...S.btnSecondary, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "envoye")); setView("dashboard"); }}>
            ✉️ Marquer envoyé
          </button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "facture")); setView("dashboard"); }}>
            ✓ Facturé
          </button>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  const totalRegies = regies.filter(r => r.status !== "facture").length;
  const enAttenteCount = regies.filter(r => r.status === "en_attente").length;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Faire signer ou envoyer par mail au client</div>
            </div>
          </div>
        )}

        <div style={S.sectionTitle}>Chantiers</div>

        {chantiers.length === 0 ? (
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
                  const type = TYPE_TRAVAIL.find(t => t.id === r.type_travail);
                  const sc = STATUS_COLORS[r.status] || STATUS_COLORS.en_attente;
                  return (
                    <div key={r.id} style={S.regieRow}>
                      {r.photo_url && <img src={r.photo_url} style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} alt="photo" />}
                      <div style={S.regieDesc}>{cat?.icon} {r.description}</div>
                      <div style={S.regieMeta}>
                        {r.initiales && <span style={S.initialesBadge}>{r.initiales}</span>}
                        {type && <span style={S.typeBadge}>{type.label}</span>}
                        {r.quantite && <span style={S.typeBadge}>{r.quantite}h</span>}
                        <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(r.created_at)}</span>
                      </div>
                      {r.commentaire && <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6, fontStyle: "italic" }}>"{r.commentaire}"</div>}
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
                    📄 Générer récapitulatif client
                  </button>
                )}
              </div>
            );
          })
        )}
        <div style={{ height: 80 }} />
      </div>
      <button style={S.fab} onClick={() => setView("saisie")}>+</button>
    </div>
  );
}
