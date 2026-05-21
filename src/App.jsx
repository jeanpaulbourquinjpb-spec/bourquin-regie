import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://tibwhditawfhrxpmsrtp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYndoZGl0YXdmaHJ4cG1zcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDk4OTksImV4cCI6MjA5NDkyNTg5OX0.k9ago70XNq0GlFdFKDjXKoPb8j1a3CZMgEfrwBvar7I";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = [
  { id: "heures", label: "Heures supplémentaires / régie", icon: "⏱" },
  { id: "materiel", label: "Matériel non prévu", icon: "🔧" },
  { id: "plans", label: "Modification de plans", icon: "📐" },
  { id: "cache", label: "Travaux cachés découverts", icon: "🔍" },
  { id: "autre", label: "Autre", icon: "📋" },
];

const STATUS_COLORS = {
  en_attente: { bg: "#FFF3CD", text: "#856404", label: "En attente signature" },
  signe: { bg: "#D1E7DD", text: "#0A3622", label: "Signé" },
  envoye: { bg: "#CFE2FF", text: "#084298", label: "Envoyé par mail" },
  facture: { bg: "#E8D5F5", text: "#4A1572", label: "Facturé" },
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMoney(n) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(n || 0);
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [regies, setRegies] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ chantier_id: "", chantier_nom: "", categorie: "", description: "", quantite: "", unite: "h", prix_unit: "", date: new Date().toISOString().split("T")[0] });
  const [newChantier, setNewChantier] = useState("");
  const [newChantierEmail, setNewChantierEmail] = useState("");
  const [showNewChantier, setShowNewChantier] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [recap, setRecap] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from("chantiers").select("*").order("created_at", { ascending: false }),
        supabase.from("regies").select("*").order("created_at", { ascending: false }),
      ]);
      setChantiers(c || []);
      setRegies(r || []);
    } catch (e) {
      setError("Erreur de connexion à la base de données");
    }
    setLoading(false);
  };

  const addChantier = async () => {
    if (!newChantier.trim()) return;
    const { data, error } = await supabase.from("chantiers").insert({ nom: newChantier.trim(), email_technicien: newChantierEmail.trim() || null }).select().single();
    if (!error && data) {
      setChantiers(prev => [data, ...prev]);
      setForm(f => ({ ...f, chantier_id: data.id, chantier_nom: data.nom }));
      setNewChantier("");
      setNewChantierEmail("");
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
    if (!form.chantier_id || !form.categorie || !form.description) return;
    setSaving(true);
    let photo_url = null;
    if (photo) photo_url = await uploadPhoto(photo);
    const montant = parseFloat(form.quantite || 0) * parseFloat(form.prix_unit || 0);
    const { data, error } = await supabase.from("regies").insert({
      chantier_id: form.chantier_id,
      chantier_nom: form.chantier_nom,
      categorie: form.categorie,
      description: form.description,
      quantite: parseFloat(form.quantite) || null,
      unite: form.unite,
      prix_unit: parseFloat(form.prix_unit) || null,
      montant,
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
      setForm(f => ({ ...f, categorie: "", description: "", quantite: "", unite: "h", prix_unit: "", date: new Date().toISOString().split("T")[0] }));
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("regies").update({ status }).eq("id", id);
    if (!error) setRegies(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const getChantierNom = (id) => chantiers.find(c => c.id === id)?.nom || "";
  const regiesByChantier = (id) => regies.filter(r => r.chantier_id === id);
  const nonFactures = (id) => regiesByChantier(id).filter(r => r.status !== "facture");

  const generateRecap = (chantierId) => {
    const items = nonFactures(chantierId);
    const nom = getChantierNom(chantierId);
    const total = items.reduce((s, r) => s + (r.montant || 0), 0);
    const text = `RÉCAPITULATIF PLUS VALUES / RÉGIE\nChantier : ${nom}\nDate : ${formatDate(new Date().toISOString())}\n\n${items.map((r, i) => {
      const cat = CATEGORIES.find(c => c.id === r.categorie);
      return `${i + 1}. ${cat?.label || r.categorie}\n   Date : ${formatDate(r.created_at)}\n   Description : ${r.description}\n   Quantité : ${r.quantite} ${r.unite} x CHF ${r.prix_unit} = ${formatMoney(r.montant)}`;
    }).join("\n\n")}\n\n${"─".repeat(40)}\nTOTAL PLUS VALUES : ${formatMoney(total)}\n\nSignature client : ____________________\nDate : ____________________`;
    setRecap({ chantierId, nom, text, items, total });
    setView("recap");
  };

  const styles = {
    app: { fontFamily: "'DM Sans', sans-serif", background: "#0F1117", minHeight: "100vh", color: "#E8EAF0", maxWidth: 480, margin: "0 auto", position: "relative" },
    header: { background: "linear-gradient(135deg, #1A1D2E 0%, #0F1117 100%)", borderBottom: "1px solid #2A2D3E", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logoIcon: { width: 36, height: 36, background: "linear-gradient(135deg, #F59E0B, #EF4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
    logoText: { fontSize: 13, fontWeight: 700, color: "#E8EAF0", letterSpacing: 0.5 },
    logoSub: { fontSize: 10, color: "#6B7280", letterSpacing: 1, textTransform: "uppercase" },
    body: { padding: 16 },
    card: { background: "#1A1D2E", border: "1px solid #2A2D3E", borderRadius: 14, padding: 16, marginBottom: 12 },
    amount: { fontSize: 22, fontWeight: 800, color: "#F59E0B", letterSpacing: -0.5 },
    amountSub: { fontSize: 11, color: "#6B7280" },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #2A2D3E" },
    btnPrimary: { background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "#0F1117", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 8 },
    btnSecondary: { background: "transparent", color: "#F59E0B", border: "1px solid #F59E0B", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnGhost: { background: "transparent", color: "#6B7280", border: "1px solid #2A2D3E", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" },
    fab: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, background: "linear-gradient(135deg, #F59E0B, #EF4444)", borderRadius: "50%", border: "none", fontSize: 26, cursor: "pointer", color: "#0F1117", fontWeight: 700, boxShadow: "0 8px 24px rgba(245,158,11,0.4)", display: "flex", alignItems: "center", justifyContent: "center" },
    label: { fontSize: 12, color: "#9CA3AF", marginBottom: 6, display: "block", fontWeight: 500, letterSpacing: 0.3 },
    input: { width: "100%", background: "#0F1117", border: "1px solid #2A2D3E", borderRadius: 8, padding: "10px 12px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", background: "#0F1117", border: "1px solid #2A2D3E", borderRadius: 8, padding: "10px 12px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    fieldGroup: { marginBottom: 14 },
    toast: { position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "white", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 100 },
    sectionTitle: { fontSize: 11, color: "#6B7280", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 10, marginTop: 4 },
    catBtn: (active) => ({ background: active ? "rgba(245,158,11,0.15)" : "#0F1117", border: "1px solid", borderColor: active ? "#F59E0B" : "#2A2D3E", borderRadius: 8, padding: "8px 12px", color: active ? "#F59E0B" : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }),
    catGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 },
    inlineRow: { display: "flex", gap: 8 },
    statusRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 },
    statusBtn: (active) => ({ background: active ? "#F59E0B" : "#0F1117", color: active ? "#0F1117" : "#9CA3AF", border: "1px solid", borderColor: active ? "#F59E0B" : "#2A2D3E", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }),
    recapBox: { background: "#0F1117", border: "1px solid #2A2D3E", borderRadius: 10, padding: 14, fontFamily: "monospace", fontSize: 12, color: "#E8EAF0", whiteSpace: "pre-wrap", lineHeight: 1.7 },
    alertCard: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 },
    photoBox: { border: "2px dashed #2A2D3E", borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer", marginBottom: 14 },
    photoPreview: { width: "100%", borderRadius: 8, marginBottom: 8, maxHeight: 200, objectFit: "cover" },
    backBtn: { background: "none", border: "none", color: "#9CA3AF", fontSize: 20, cursor: "pointer" },
    chantierName: { fontSize: 15, fontWeight: 700, color: "#E8EAF0" },
    chantierSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    emptyState: { textAlign: "center", padding: "40px 20px", color: "#6B7280" },
  };

  if (loading) return (
    <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
        <div style={{ color: "#F59E0B", fontWeight: 600 }}>Chargement...</div>
      </div>
    </div>
  );

  if (view === "saisie") return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={styles.header}>
        <button onClick={() => setView("dashboard")} style={styles.backBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.logoText}>Nouvelle Régie</div>
          <div style={styles.logoSub}>Saisie terrain</div>
        </div>
        <div style={{ width: 32 }} />
      </div>
      <div style={styles.body}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Chantier</label>
          {!showNewChantier ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...styles.select, flex: 1 }} value={form.chantier_id} onChange={e => {
                const c = chantiers.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, chantier_id: e.target.value, chantier_nom: c?.nom || "" }));
              }}>
                <option value="">Sélectionner...</option>
                {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <button style={styles.btnGhost} onClick={() => setShowNewChantier(true)}>+ Nouveau</button>
            </div>
          ) : (
            <div>
              <input style={{ ...styles.input, marginBottom: 8 }} placeholder="Nom du chantier..." value={newChantier} onChange={e => setNewChantier(e.target.value)} />
              <input style={{ ...styles.input, marginBottom: 8 }} placeholder="Email technicien responsable..." type="email" value={newChantierEmail} onChange={e => setNewChantierEmail(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...styles.btnGhost, flex: 1, color: "#10B981", borderColor: "#10B981" }} onClick={addChantier}>Créer le chantier</button>
                <button style={styles.btnGhost} onClick={() => setShowNewChantier(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Catégorie</label>
          <div style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} style={styles.catBtn(form.categorie === cat.id)} onClick={() => setForm(f => ({ ...f, categorie: cat.id }))}>
                <span>{cat.icon}</span><span style={{ fontSize: 11 }}>{cat.label.split("/")[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Description des travaux</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} placeholder="Décris précisément ce qui a été fait en plus..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div style={{ ...styles.inlineRow, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Quantité</label>
            <input style={styles.input} type="number" placeholder="0" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} />
          </div>
          <div style={{ width: 80 }}>
            <label style={styles.label}>Unité</label>
            <select style={styles.select} value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}>
              <option value="h">h</option>
              <option value="u">u</option>
              <option value="m">m</option>
              <option value="m²">m²</option>
              <option value="forfait">forf.</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Prix unit. CHF</label>
            <input style={styles.input} type="number" placeholder="0.00" value={form.prix_unit} onChange={e => setForm(f => ({ ...f, prix_unit: e.target.value }))} />
          </div>
        </div>

        {form.quantite && form.prix_unit && (
          <div style={{ ...styles.card, background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", marginBottom: 14 }}>
            <span style={{ color: "#9CA3AF", fontSize: 12 }}>Montant calculé : </span>
            <span style={{ color: "#F59E0B", fontWeight: 800, fontSize: 18 }}>{formatMoney(parseFloat(form.quantite) * parseFloat(form.prix_unit))}</span>
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Photo (optionnel)</label>
          <div style={styles.photoBox} onClick={() => fileRef.current.click()}>
            {photoPreview ? (
              <img src={photoPreview} style={styles.photoPreview} alt="preview" />
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>Appuyer pour prendre une photo</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Date</label>
          <input style={styles.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>

        <button style={{ ...styles.btnPrimary, opacity: (!form.chantier_id || !form.categorie || !form.description || saving) ? 0.5 : 1 }} onClick={submitRegie} disabled={!form.chantier_id || !form.categorie || !form.description || saving}>
          {saving ? "Enregistrement..." : "✓ Enregistrer la régie"}
        </button>
      </div>
      {saved && <div style={styles.toast}>✓ Régie enregistrée !</div>}
    </div>
  );

  if (view === "recap") return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={styles.header}>
        <button onClick={() => setView("dashboard")} style={styles.backBtn}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.logoText}>Récapitulatif</div>
          <div style={styles.logoSub}>{recap?.nom}</div>
        </div>
        <div style={{ width: 32 }} />
      </div>
      <div style={styles.body}>
        <div style={{ ...styles.card, background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", marginBottom: 16 }}>
          <div style={styles.amountSub}>Total plus values à facturer</div>
          <div style={styles.amount}>{formatMoney(recap?.total)}</div>
        </div>

        {recap?.items.filter(r => r.photo_url).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={styles.sectionTitle}>Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {recap.items.filter(r => r.photo_url).map(r => (
                <img key={r.id} src={r.photo_url} style={{ width: "100%", borderRadius: 8, aspectRatio: "1", objectFit: "cover" }} alt="régie" />
              ))}
            </div>
          </div>
        )}

        <div style={styles.sectionTitle}>Récapitulatif à envoyer au client</div>
        <div style={styles.recapBox}>{recap?.text}</div>

        <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={() => navigator.clipboard?.writeText(recap?.text)}>
          📋 Copier pour envoyer par mail
        </button>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "envoye")); setView("dashboard"); }}>
            ✉️ Marquer envoyé
          </button>
          <button style={{ ...styles.btnGhost, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "facture")); setView("dashboard"); }}>
            ✓ Facturé
          </button>
        </div>
      </div>
    </div>
  );

  // DASHBOARD
  const totalNonFacture = regies.filter(r => r.status !== "facture").reduce((s, r) => s + (r.montant || 0), 0);
  const enAttenteSignature = regies.filter(r => r.status === "en_attente").length;

  return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logoIcon}>⚡</div>
          <div>
            <div style={styles.logoText}>Bourquin Électricité</div>
            <div style={styles.logoSub}>Suivi régies et plus values</div>
          </div>
        </div>
        <button onClick={loadData} style={styles.btnGhost}>↻</button>
      </div>

      <div style={styles.body}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ ...styles.card, marginBottom: 0 }}>
            <div style={styles.amountSub}>À facturer</div>
            <div style={{ ...styles.amount, fontSize: 18 }}>{formatMoney(totalNonFacture)}</div>
          </div>
          <div style={{ ...styles.card, marginBottom: 0, background: enAttenteSignature > 0 ? "rgba(239,68,68,0.08)" : "#1A1D2E", borderColor: enAttenteSignature > 0 ? "rgba(239,68,68,0.3)" : "#2A2D3E" }}>
            <div style={styles.amountSub}>Sans signature</div>
            <div style={{ ...styles.amount, fontSize: 18, color: enAttenteSignature > 0 ? "#EF4444" : "#F59E0B" }}>{enAttenteSignature} régie{enAttenteSignature !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {enAttenteSignature > 0 && (
          <div style={styles.alertCard}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{enAttenteSignature} régie{enAttenteSignature !== 1 ? "s" : ""} sans signature client</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Ces régies ne sont pas encore validées</div>
            </div>
          </div>
        )}

        <div style={styles.sectionTitle}>Chantiers actifs</div>

        {chantiers.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun chantier</div>
            <div style={{ fontSize: 13 }}>Commence par saisir une régie</div>
          </div>
        ) : (
          chantiers.map(chantier => {
            const items = regiesByChantier(chantier.id);
            if (items.length === 0) return null;
            const nf = nonFactures(chantier.id);
            const total = nf.reduce((s, r) => s + (r.montant || 0), 0);
            const sansSig = nf.filter(r => r.status === "en_attente").length;
            return (
              <div key={chantier.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.chantierName}>{chantier.nom}</div>
                    <div style={styles.chantierSub}>{items.length} régie{items.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>{formatMoney(total)}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>non facturé</div>
                  </div>
                </div>

                {sansSig > 0 && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8, fontWeight: 600 }}>⚠️ {sansSig} sans signature</div>}

                {nf.map(r => {
                  const cat = CATEGORIES.find(c => c.id === r.categorie);
                  return (
                    <div key={r.id} style={styles.row}>
                      <div style={{ flex: 1 }}>
                        {r.photo_url && <img src={r.photo_url} style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", marginBottom: 6 }} alt="photo" />}
                        <div style={{ fontSize: 12, color: "#E8EAF0", fontWeight: 500 }}>{cat?.icon} {r.description?.slice(0, 45)}{r.description?.length > 45 ? "..." : ""}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{formatDate(r.created_at)}</div>
                        <div style={styles.statusRow}>
                          {Object.entries(STATUS_COLORS).map(([key, val]) => (
                            <button key={key} style={styles.statusBtn(r.status === key)} onClick={() => updateStatus(r.id, key)}>{val.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginLeft: 10 }}>{formatMoney(r.montant)}</div>
                    </div>
                  );
                })}

                {nf.length > 0 && (
                  <button style={{ ...styles.btnPrimary, marginTop: 12 }} onClick={() => generateRecap(chantier.id)}>
                    📄 Générer récapitulatif client
                  </button>
                )}
              </div>
            );
          })
        )}
        <div style={{ height: 80 }} />
      </div>

      <button style={styles.fab} onClick={() => setView("saisie")}>+</button>
    </div>
  );
}
