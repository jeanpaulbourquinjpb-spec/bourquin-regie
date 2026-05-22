import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tibwhditawfhrxpmsrtp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYndoZGl0YXdmaHJ4cG1zcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDk4OTksImV4cCI6MjA5NDkyNTg5OX0.k9ago70XNq0GlFdFKDjXKoPb8j1a3CZMgEfrwBvar7I";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_NAME = "Bourquin les \u00c9lectriciens";
const TECH_EMAILS = [
  { id: "JPB", email: "jean-paul@bourquinelectricite.ch" },
  { id: "CF",  email: "fatio@bourquinelectricite.ch" },
  { id: "JYB", email: "bourquin@bourquinelectricite.ch" },
];
const CATEGORIES = [
  { id: "heures",    label: "Heures r\u00e9gie",      icon: "\u23f1" },
  { id: "materiel",  label: "Mat\u00e9riel non pr\u00e9vu", icon: "\U0001f527" },
  { id: "plans",     label: "Modification plans", icon: "\U0001f4d0" },
  { id: "cache",     label: "Travaux cach\u00e9s",     icon: "\U0001f50d" },
  { id: "depannage", label: "D\u00e9pannage",          icon: "\U0001f6a8" },
  { id: "autre",     label: "Autre",              icon: "\U0001f4cb" },
];
const SERVICES_MO = [
  { id: "installateur",  label: "Electricien installateur",           unite: "h" },
  { id: "aide2",         label: "Electricien aide 2",                 unite: "h" },
  { id: "aide1",         label: "Electricien aide 1",                 unite: "h" },
  { id: "conseiller",    label: "Electricien conseiller s\u00e9curit\u00e9",    unite: "h" },
  { id: "programmateur", label: "Electricien programmateur",          unite: "h" },
  { id: "chef_projet",   label: "Electricien chef de projet",         unite: "h" },
  { id: "chef_chantier", label: "Electricien chef de chantier",       unite: "h" },
  { id: "it_depanneur",  label: "Electricien service IT & d\u00e9panneur", unite: "h" },
  { id: "planificateur", label: "Electricien planificateur",          unite: "h" },
  { id: "vehicule",      label: "V\u00e9hicule, outillage, stock",         unite: "q" },
  { id: "petit_mat_sup", label: "Petit mat\u00e9riel > 3h",               unite: "q" },
  { id: "petit_mat_inf", label: "Petit mat\u00e9riel \u2264 3h",               unite: "q" },
];
const FOURNISSEURS = ["EM", "OF", "SP", "STOCK", "Autre"];
const STATUS_COLORS = {
  en_attente: { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.4)",  text: "#EF4444", label: "En attente" },
  signe:      { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10B981", label: "Sign\u00e9" },
  envoye:     { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#3B82F6", label: "Envoy\u00e9" },
  facture:    { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#8B5CF6", label: "Factur\u00e9" },
};
const SORT_OPTIONS = [
  { id: "recent",  label: "Plus r\u00e9cent" },
  { id: "oldest",  label: "Plus ancien" },
  { id: "alpha",   label: "A \u2192 Z" },
  { id: "pending", label: "Sans signature" },
];
const DEFAULT_MONTEURS = ["LH", "LA", "GP", "EM", "HS", "VR"];
const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const EMPTY_MO  = () => ({ id: uid(), service: "", quantite: "" });
const EMPTY_MAT = () => ({ id: uid(), designation: "", eldas: "", fournisseur: "", fournisseur_custom: "", quantite: "" });
function safeLS(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function setLS(key, val)  { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function formatDate(iso)  { if (!iso) return ""; return new Date(iso).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function formatTime(iso)  { if (!iso) return ""; return new Date(iso).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" }); }
function parseLignes(raw) { if (!raw) return { mo: [], mat: [] }; if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return { mo: [], mat: [] }; } } return raw; }
function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] > 0 && (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250)) return false;
  }
  return true;
}

const S = {
  app:        { fontFamily: "'DM Sans', sans-serif", background: "#0A0C12", minHeight: "100vh", color: "#E8EAF0", maxWidth: 500, margin: "0 auto" },
  header:     { background: "linear-gradient(135deg,#13162A,#0A0C12)", borderBottom: "1px solid #1E2235", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  logoWrap:   { display: "flex", alignItems: "center", gap: 10 },
  logoIcon:   { width: 38, height: 38, background: "linear-gradient(135deg,#F59E0B,#EF4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  logoTitle:  { fontSize: 13, fontWeight: 800, color: "#E8EAF0" },
  logoSub:    { fontSize: 10, color: "#4B5563", letterSpacing: 1, textTransform: "uppercase", marginTop: 1 },
  body:       { padding: "16px 14px" },
  card:       { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 12 },
  section:    { background: "#13162A", border: "1px solid #1E2235", borderRadius: 14, padding: 14, marginBottom: 14 },
  secTitle:   { fontSize: 11, color: "#F59E0B", letterSpacing: 1, textTransform: "uppercase", fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  kpiGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  kpiCard:    (a) => ({ background: a ? "rgba(239,68,68,0.08)" : "#13162A", border: "1px solid", borderColor: a ? "rgba(239,68,68,0.3)" : "#1E2235", borderRadius: 14, padding: "14px 16px" }),
  kpiVal:     (a) => ({ fontSize: 20, fontWeight: 800, color: a ? "#EF4444" : "#F59E0B", marginTop: 4 }),
  kpiLabel:   { fontSize: 10, color: "#4B5563", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 },
  dashSec:    { fontSize: 10, color: "#4B5563", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, marginTop: 4 },
  chCard:     { background: "#13162A", border: "1px solid #1E2235", borderRadius: 16, padding: 16, marginBottom: 10 },
  chHead:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  chName:     { fontSize: 15, fontWeight: 700, color: "#E8EAF0" },
  chNum:      { fontSize: 11, color: "#F59E0B", fontWeight: 700, marginTop: 2 },
  chMeta:     { fontSize: 11, color: "#4B5563", marginTop: 2 },
  regieRow:   { borderTop: "1px solid #1E2235", paddingTop: 10, marginTop: 10 },
  regieMeta:  { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 },
  badge:      (c) => ({ background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  initBadge:  { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 },
  numBadge:   { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#A78BFA", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800 },
  photoBadge: { background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  sigBadge:   { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  statusRow:  { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 },
  statusBtn:  (a, c) => ({ background: a ? c.bg : "transparent", color: a ? c.text : "#4B5563", border: "1px solid", borderColor: a ? c.border : "#1E2235", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }),
  tabRow:     { display: "flex", gap: 4, marginBottom: 14 },
  tabBtn:     (a) => ({ background: a ? "#F59E0B" : "transparent", color: a ? "#0A0C12" : "#4B5563", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }),
  filterRow:  { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  filterBtn:  (a) => ({ background: a ? "rgba(245,158,11,0.12)" : "transparent", color: a ? "#F59E0B" : "#4B5563", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }),
  searchBox:  { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "10px 14px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 },
  sortRow:    { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  sortBtn:    (a) => ({ background: a ? "rgba(59,130,246,0.12)" : "transparent", color: a ? "#3B82F6" : "#4B5563", border: "1px solid", borderColor: a ? "#3B82F6" : "#1E2235", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }),
  btnPrimary:   { background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#0A0C12", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%", marginTop: 10 },
  btnSecondary: { background: "transparent", color: "#F59E0B", border: "1px solid #F59E0B", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnGhost:   { background: "transparent", color: "#4B5563", border: "1px solid #1E2235", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnDanger:  { background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  btnAdd:     { background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 8 },
  btnArchive: { background: "rgba(139,92,246,0.1)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 },
  btnResign:  { background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600, marginTop: 6, width: "100%" },
  btnSend:    { background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, marginTop: 6, width: "100%", textDecoration: "none", display: "block", textAlign: "center" },
  fab:        { position: "fixed", bottom: 24, right: 20, width: 60, height: 60, background: "linear-gradient(135deg,#F59E0B,#EF4444)", borderRadius: "50%", border: "none", fontSize: 28, cursor: "pointer", color: "#0A0C12", fontWeight: 700, boxShadow: "0 8px 32px rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  label:      { fontSize: 12, color: "#6B7280", marginBottom: 6, display: "block", fontWeight: 600 },
  labelOpt:   { fontSize: 12, color: "#4B5563", marginBottom: 6, display: "block", fontWeight: 500 },
  input:      { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:     { width: "100%", background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: "12px 14px", color: "#E8EAF0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  catBtn:     (a) => ({ background: a ? "rgba(245,158,11,0.12)" : "#0A0C12", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 10, padding: "10px", color: a ? "#F59E0B" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }),
  montBtn:    (a) => ({ background: a ? "rgba(245,158,11,0.15)" : "#0A0C12", border: "1px solid", borderColor: a ? "#F59E0B" : "#1E2235", borderRadius: 8, padding: "10px 0", color: a ? "#F59E0B" : "#6B7280", fontSize: 13, fontWeight: 800, cursor: "pointer", flex: 1, textAlign: "center", minWidth: 44 }),
  techBtn:    (a) => ({ background: a ? "rgba(59,130,246,0.15)" : "#0A0C12", border: "1px solid", borderColor: a ? "#3B82F6" : "#1E2235", borderRadius: 8, padding: "10px 14px", color: a ? "#3B82F6" : "#6B7280", fontSize: 13, fontWeight: 800, cursor: "pointer" }),
  photoBox:   { border: "2px dashed #1E2235", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: "#0A0C12" },
  toast:      { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "white", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap" },
  backBtn:    { background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", padding: "0 4px" },
  recapBox:   { background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#E8EAF0", whiteSpace: "pre-wrap", lineHeight: 1.8 },
  alertBan:   { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: "#4B5563" },
  sigCanvas:  { width: "100%", background: "#fff", border: "2px solid #d1d5db", borderRadius: 10, touchAction: "none", cursor: "crosshair", display: "block" },
  sigBox:     { background: "#13162A", border: "1px solid #1E2235", borderRadius: 12, padding: 14, marginTop: 8 },
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  overlayBot: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  modal:      { background: "#13162A", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 500, margin: "0 auto" },
  rowLine:    { display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 8 },
  delSmall:   { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 6, padding: "8px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0 },
  errBox:     { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 14 },
  fullImg:    { maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" },
};

async function generateComposite(sigDataUrl, regie, chantier) {
  return new Promise((resolve) => {
    const W = 800; const PAD = 40; const LH = 24;
    const lignes = parseLignes(regie.lignes);
    const rows = [
      { t: `Chantier : ${chantier.nom}`, s: "field" },
      chantier.numero && { t: `N\u00b0 affaire : ${chantier.numero}`, s: "field" },
      { t: `Date : ${formatDate(regie.created_at)}  ${formatTime(regie.created_at)}`, s: "field" },
      { t: `Monteur : ${regie.initiales}`, s: "field" },
      { t: `Cat\u00e9gorie : ${regie.categorie}`, s: "field" },
      regie.demandeur   && { t: `Demand\u00e9 par : ${regie.demandeur}`, s: "field" },
      regie.emplacement && { t: `Emplacement : ${regie.emplacement}`, s: "field" },
      { t: "", s: "sp" },
      { t: "MAIN D'OEUVRE", s: "sec" },
      ...(lignes.mo || []).map(l => { const sv = SERVICES_MO.find(x => x.id === l.service); return { t: `  \u2022 ${sv?.label || l.service}${l.quantite ? ` : ${l.quantite} ${sv?.unite?.toUpperCase() || "H"}` : ""}`, s: "item" }; }),
      ...(lignes.mat?.length > 0 ? [
        { t: "", s: "sp" }, { t: "MAT\u00c9RIEL", s: "sec" },
        ...(lignes.mat || []).map(l => ({ t: `  \u2022 ${l.designation}${l.eldas ? ` | ELDAS: ${l.eldas}` : ""}${l.fournisseur ? ` | ${l.fournisseur === "Autre" ? l.fournisseur_custom || "Autre" : l.fournisseur}` : ""}${l.quantite ? ` | Qt\u00e9: ${l.quantite}` : ""}`, s: "item" })),
      ] : []),
      { t: "", s: "sp" },
    ].filter(Boolean);
    const textH = rows.length * LH + PAD * 2 + 60;
    const sigH = 180; const footH = 50; const H = textH + sigH + footH;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1; ctx.strokeRect(15, 15, W-30, H-30);
    ctx.fillStyle = "#13162A"; ctx.fillRect(15, 15, W-30, 56);
    ctx.fillStyle = "#F59E0B"; ctx.font = "bold 18px Arial"; ctx.fillText("\u26a1 " + APP_NAME, PAD, 50);
    ctx.fillStyle = "#9ca3af"; ctx.font = "12px Arial"; ctx.fillText("Bon de r\u00e9gie \u2014 Plus values", W-280, 50);
    let y = 90;
    for (const row of rows) {
      if (row.s === "sp") { y += 8; continue; }
      ctx.fillStyle = row.s === "sec" ? "#374151" : row.s === "item" ? "#6b7280" : "#374151";
      ctx.font = row.s === "sec" ? "bold 13px Arial" : "13px Arial";
      ctx.fillText(row.t, PAD, y); y += LH;
    }
    ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, textH-10); ctx.lineTo(W-PAD, textH-10); ctx.stroke();
    ctx.fillStyle = "#374151"; ctx.font = "bold 13px Arial";
    ctx.fillText("Lu et approuv\u00e9 \u2014 Signature du client :", PAD, textH+16);
    const sigAreaY = textH + 24;
    ctx.fillStyle = "#f9fafb"; ctx.fillRect(PAD, sigAreaY, W-PAD*2, sigH-30);
    ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 1; ctx.strokeRect(PAD, sigAreaY, W-PAD*2, sigH-30);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, PAD+8, sigAreaY+8, W-PAD*2-16, sigH-46);
      const fy = H - footH + 16;
      ctx.fillStyle = "#9ca3af"; ctx.font = "11px Arial";
      ctx.fillText(`G\u00e9n\u00e9r\u00e9 le ${formatDate(new Date().toISOString())} \u00e0 ${formatTime(new Date().toISOString())}`, PAD, fy);
      ctx.fillText("www.bourquinelectricite.ch", W-240, fy);
      resolve(cv.toDataURL("image/png"));
    };
    img.onerror = () => resolve(cv.toDataURL("image/png"));
    img.src = sigDataUrl;
  });
}

function SignatureCanvas({ regie, chantier, onSave, onCancel }) {
  const ref = useRef(); const drawing = useRef(false); const last = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true); const [sigErr, setSigErr] = useState(false);
  useEffect(() => {
    const init = () => {
      const canvas = ref.current; if (!canvas) return;
      const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, rect.width, rect.height);
    };
    setTimeout(init, 80);
  }, []);
  const getPos = (e) => { const canvas = ref.current; const rect = canvas.getBoundingClientRect(); const t = e.touches?.[0] || e; return { x: t.clientX - rect.left, y: t.clientY - rect.top }; };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = getPos(e); };
  const stop  = (e) => { e?.preventDefault(); drawing.current = false; if (ref.current && !isCanvasEmpty(ref.current)) setIsEmpty(false); };
  const draw  = (e) => {
    e.preventDefault(); if (!drawing.current) return;
    const ctx = ref.current.getContext("2d"); const p = getPos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); last.current = p;
  };
  const clear = () => {
    const canvas = ref.current; const ctx = canvas.getContext("2d"); const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, rect.width, rect.height); setIsEmpty(true); setSigErr(false);
  };
  const validate = () => { if (isCanvasEmpty(ref.current)) { setSigErr(true); return; } onSave(ref.current.toDataURL("image/png")); };
  const lignes = parseLignes(regie.lignes);
  return (
    <div style={S.overlayBot}>
      <div style={{ ...S.modal, paddingBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#E8EAF0", marginBottom: 4 }}>Signature client</div>
        <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 12 }}>Le client lit les travaux et signe ci-dessous</div>
        <div style={{ background: "#0A0C12", borderRadius: 10, padding: 12, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>{chantier.nom}{chantier.numero ? ` \u2014 N\u00b0 ${chantier.numero}` : ""}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>R\u00e9gie #{regie.regie_number} \u00b7 {regie.categorie} \u00b7 {regie.initiales} \u00b7 {formatDate(regie.created_at)}</div>
          {regie.emplacement && <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>\ud83d\udccd {regie.emplacement}</div>}
          {regie.demandeur   && <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>\ud83d\ude4b {regie.demandeur}</div>}
          {(lignes.mo || []).map((l, i) => { const sv = SERVICES_MO.find(x => x.id === l.service); return <div key={i} style={{ fontSize: 11, color: "#9CA3AF" }}>\ud83d\udc77 {sv?.label || l.service}{l.quantite ? ` : ${l.quantite} ${sv?.unite?.toUpperCase() || "H"}` : ""}</div>; })}
          {(lignes.mat || []).filter(l => l.designation).map((l, i) => <div key={i} style={{ fontSize: 11, color: "#9CA3AF" }}>\ud83d\udce6 {l.designation}{l.quantite ? ` \u00b7 Qt\u00e9: ${l.quantite}` : ""}</div>)}
        </div>
        {sigErr && <div style={{ ...S.errBox, marginBottom: 8 }}>\u26a0\ufe0f Le client doit signer avant de valider.</div>}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#E8EAF0", marginBottom: 6 }}>Signer ci-dessous :</div>
        <canvas ref={ref} style={{ ...S.sigCanvas, height: 130 }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...S.btnPrimary, marginTop: 0, flex: 2, opacity: isEmpty ? 0.5 : 1 }} onClick={validate}>\u2713 Valider</button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={clear}>Effacer</button>
          <button style={{ ...S.btnDanger, flex: 1 }} onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function FullscreenViewer({ url, onClose }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ position: "relative", maxWidth: 500, width: "100%" }}>
        <img src={url} style={S.fullImg} alt="plein \u00e9cran" />
        <button onClick={onClose} style={{ position: "absolute", top: -40, right: 0, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>\u2715 Fermer</button>
      </div>
    </div>
  );
}

export default function App() {
  const [view,          setView]          = useState("dashboard");
  const [dashTab,       setDashTab]       = useState("actifs");
  const [regies,        setRegies]        = useState([]);
  const [chantiers,     setChantiers]     = useState([]);
  const [deletedIds,    setDeletedIds]    = useState(() => safeLS("deletedIds", []));
  const [monteurs,      setMonteurs]      = useState(() => safeLS("monteurs", DEFAULT_MONTEURS));
  const [isLoading,     setIsLoading]     = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [errorMsg,      setErrorMsg]      = useState(null);
  const [recap,         setRecap]         = useState(null);
  const [photo,         setPhoto]         = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [showNewCh,     setShowNewCh]     = useState(false);
  const [showAddMont,   setShowAddMont]   = useState(false);
  const [newMontVal,    setNewMontVal]    = useState("");
  const [showSig,       setShowSig]       = useState(null);
  const [confirmDel,    setConfirmDel]    = useState(null);
  const [confirmArch,   setConfirmArch]   = useState(null);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [sortBy,        setSortBy]        = useState("recent");
  const [searchQ,       setSearchQ]       = useState("");
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [newCh, setNewCh] = useState({ nom: "", numero: "", techIds: [], techCustom: "" });
  const [form, setForm] = useState({
    chantier_id: "", chantier_nom: "", chantier_email_tech: "",
    date: new Date().toISOString().split("T")[0],
    initiales: "", demandeur: "", categories: [], categorie_custom: "", emplacement: "",
    lignes_mo: [EMPTY_MO()], lignes_mat: [], has_materiel: false,
  });
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setErrorMsg(null);
    try {
      const [{ data: c, error: ce }, { data: r, error: re }] = await Promise.all([
        supabase.from("chantiers").select("*").order("created_at", { ascending: false }),
        supabase.from("regies").select("*").order("created_at", { ascending: false }),
      ]);
      if (ce || re) throw new Error();
      setChantiers(c || []);
      const ids = safeLS("deletedIds", []);
      setRegies((r || []).filter(x => !ids.includes(x.id)));
    } catch { setErrorMsg("Impossible de charger les donn\u00e9es."); }
    setIsLoading(false);
  };

  const saveMonteurs   = (list) => { setMonteurs(list); setLS("monteurs", list); };
  const saveDeletedIds = (ids)  => { setDeletedIds(ids); setLS("deletedIds", ids); };

  const addMonteur = () => {
    const i = newMontVal.trim().toUpperCase();
    if (!i || monteurs.includes(i)) return;
    saveMonteurs([...monteurs, i]); setForm(f => ({ ...f, initiales: i }));
    setNewMontVal(""); setShowAddMont(false);
  };

  const buildTechEmails = (ids, custom) => {
    const emails = ids.map(id => TECH_EMAILS.find(t => t.id === id)?.email).filter(Boolean);
    if (custom.trim()) emails.push(custom.includes("@") ? custom.trim() : `${custom.trim()}@bourquinelectricite.ch`);
    return emails.join(";");
  };

  const addChantier = async () => {
    if (!newCh.nom.trim()) return;
    const emailTech = buildTechEmails(newCh.techIds, newCh.techCustom);
    const { data, error } = await supabase.from("chantiers").insert({
      nom: newCh.nom.trim(), numero: newCh.numero.trim() || null, email_technicien: emailTech || null,
    }).select().single();
    if (error) { alert("Erreur cr\u00e9ation chantier."); return; }
    setChantiers(prev => [data, ...prev]);
    setForm(f => ({ ...f, chantier_id: data.id, chantier_nom: data.nom, chantier_email_tech: emailTech }));
    setNewCh({ nom: "", numero: "", techIds: [], techCustom: "" }); setShowNewCh(false);
  };

  const archiveChantier   = async (id) => { await supabase.from("chantiers").update({ archived: true  }).eq("id", id); setChantiers(p => p.map(c => c.id === id ? { ...c, archived: true  } : c)); setConfirmArch(null); };
  const unarchiveChantier = async (id) => { await supabase.from("chantiers").update({ archived: false }).eq("id", id); setChantiers(p => p.map(c => c.id === id ? { ...c, archived: false } : c)); };

  const toggleTechId = (id) => setNewCh(f => ({ ...f, techIds: f.techIds.includes(id) ? f.techIds.filter(x => x !== id) : [...f.techIds, id] }));
  const toggleCat    = (id) => setForm(f => ({ ...f, categories: f.categories.includes(id) ? f.categories.filter(x => x !== id) : [...f.categories, id] }));
  const updateMO     = (id, fld, val) => setForm(f => ({ ...f, lignes_mo:  f.lignes_mo.map(l  => l.id === id ? { ...l, [fld]: val } : l) }));
  const updateMat    = (id, fld, val) => setForm(f => ({ ...f, lignes_mat: f.lignes_mat.map(l => l.id === id ? { ...l, [fld]: val } : l) }));
  const removeMO     = (id) => setForm(f => ({ ...f, lignes_mo:  f.lignes_mo.filter(l  => l.id !== id) }));
  const removeMat    = (id) => setForm(f => ({ ...f, lignes_mat: f.lignes_mat.filter(l => l.id !== id) }));
  const handlePhoto  = (e)  => { const file = e.target.files[0]; if (!file) return; setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); };

  const uploadFile = async (file, folder, ct) => {
    try {
      let blob = file;
      if (typeof file === "string") {
        const bin = atob(file.split(",")[1]); const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        blob = new Blob([arr], { type: ct });
      }
      const ext  = typeof file === "string" ? "png" : (file.name?.split(".").pop() || "jpg");
      const path = `${folder}/${uid()}.${ext}`;
      const { error } = await supabase.storage.from("photos-regies").upload(path, blob, { contentType: ct });
      if (error) { console.error("Upload error:", error); return null; }
      return supabase.storage.from("photos-regies").getPublicUrl(path).data.publicUrl;
    } catch (e) { console.error("Upload exception:", e); return null; }
  };

  const handleSignature = async (regieId, dataUrl) => {
    setShowSig(null);
    const regie    = regies.find(r => r.id === regieId);
    const chantier = chantiers.find(c => c.id === regie?.chantier_id) || {};
    const composite = await generateComposite(dataUrl, regie, chantier);
    const url = await uploadFile(composite, "signatures", "image/png");
    if (!url) { alert("Erreur upload signature. V\u00e9rifie ta connexion."); return; }
    const { error } = await supabase.from("regies").update({ signature_url: url, status: "signe" }).eq("id", regieId);
    if (!error) setRegies(prev => prev.map(r => r.id === regieId ? { ...r, signature_url: url, status: "signe" } : r));
  };

  const deleteRegie = async (id) => {
    await supabase.from("regies").delete().eq("id", id);
    saveDeletedIds([...deletedIds, id]); setRegies(prev => prev.filter(r => r.id !== id)); setConfirmDel(null);
  };

  const submitRegie = async () => {
    const moValides  = form.lignes_mo.filter(l => l.service);
    const matValides = form.lignes_mat.filter(l => l.designation.trim());
    if (!form.chantier_id || !form.initiales || form.categories.length === 0 || moValides.length === 0 || !form.date || !form.demandeur.trim() || !form.emplacement.trim()) return;
    setSaving(true); setErrorMsg(null);
    let photo_url = null;
    if (photo) photo_url = await uploadFile(photo, "regies", photo.type || "image/jpeg");
    const cats   = form.categories.map(c => c === "autre" ? (form.categorie_custom || "Autre") : CATEGORIES.find(x => x.id === c)?.label).join(", ");
    const nextNum = regies.filter(r => r.chantier_id === form.chantier_id).length + 1;
    const { data, error } = await supabase.from("regies").insert({
      chantier_id: form.chantier_id, chantier_nom: form.chantier_nom, categorie: cats,
      description: moValides.map(l => { const s = SERVICES_MO.find(x => x.id === l.service); return `${s?.label || l.service} ${l.quantite}${s?.unite || "h"}`; }).join(" / "),
      lignes: { mo: moValides, mat: matValides },
      demandeur: form.demandeur, emplacement: form.emplacement, initiales: form.initiales,
      photo_url, date: form.date, status: "en_attente", regie_number: nextNum,
    }).select().single();
    setSaving(false);
    if (error) { setErrorMsg("Erreur enregistrement. V\u00e9rifie ta connexion."); return; }
    setRegies(prev => [data, ...prev]); setSaved(true);
    setPhoto(null); setPhotoPreview(null);
    setForm(f => ({ ...f, categories: [], categorie_custom: "", initiales: "", demandeur: "", emplacement: "", date: new Date().toISOString().split("T")[0], lignes_mo: [EMPTY_MO()], lignes_mat: [], has_materiel: false }));
    setTimeout(() => { setSaved(false); setView("dashboard"); }, 1200);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("regies").update({ status }).eq("id", id);
    setRegies(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const getChantier      = (id) => chantiers.find(c => c.id === id);
  const regiesByChantier = useCallback((id) => regies.filter(r => r.chantier_id === id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [regies]);
  const nonFactures      = (id) => regiesByChantier(id).filter(r => r.status !== "facture");

  const buildRegieEmail = (r, ch) => {
    const lignes = parseLignes(r.lignes);
    const num    = ch?.numero ? ` \u2014 N\u00b0 affaire: ${ch.numero}` : "";
    const lines  = [
      `R\u00e9gie #${r.regie_number} \u2014 ${APP_NAME}`,
      `Chantier : ${ch?.nom || ""}${num}`,
      `Date : ${formatDate(r.created_at)}`,
      `Monteur : ${r.initiales}`,
      `Cat\u00e9gorie : ${r.categorie}`,
      r.demandeur   ? `Demand\u00e9 par : ${r.demandeur}`   : "",
      r.emplacement ? `Emplacement : ${r.emplacement}` : "",
      r.photo_url     ? `\n\ud83d\udcf7 Photo : ${r.photo_url}`             : "",
      r.signature_url ? `\u270d\ufe0f Document sign\u00e9 : ${r.signature_url}` : "",
      `\nMAIN D'OEUVRE`,
      ...(lignes.mo || []).map(l => { const s = SERVICES_MO.find(x => x.id === l.service); return `  \u2022 ${s?.label || l.service}${l.quantite ? ` : ${l.quantite} ${s?.unite?.toUpperCase() || "H"}` : ""}`; }),
      ...(lignes.mat?.length > 0 ? ["\nMAT\u00c9RIEL", ...(lignes.mat || []).map(l => `  \u2022 ${l.designation}${l.eldas ? ` | ELDAS: ${l.eldas}` : ""}${l.fournisseur ? ` | ${l.fournisseur === "Autre" ? l.fournisseur_custom || "Autre" : l.fournisseur}` : ""}${l.quantite ? ` | Qt\u00e9: ${l.quantite}` : ""}`)] : []),
    ].filter(v => v !== "").join("\n");
    const subject = `R\u00e9gie #${r.regie_number} \u2014 ${ch?.nom || ""} \u2014 ${r.categorie}`;
    return `mailto:${ch?.email_technicien || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
  };

  const generateRecap = (chantierId) => {
    const items = nonFactures(chantierId);
    const ch    = getChantier(chantierId);
    const nom   = ch?.nom || "";
    const num   = ch?.numero ? ` (N\u00b0 affaire: ${ch.numero})` : "";
    const text  = [
      `R\u00c9CAPITULATIF PLUS VALUES / R\u00c9GIE`, `${APP_NAME}`, `Chantier : ${nom}${num}`,
      `Date : ${formatDate(new Date().toISOString())}`, "",
      ...items.map((r, i) => {
        const lignes = parseLignes(r.lignes);
        return [
          `R\u00e9gie #${r.regie_number || i+1} \u2014 [${r.initiales}] ${r.categorie}${r.emplacement ? ` \u2014 ${r.emplacement}` : ""}`,
          `Date : ${formatDate(r.created_at)}`,
          r.demandeur     ? `Demand\u00e9 par : ${r.demandeur}` : "",
          r.photo_url     ? `\ud83d\udcf7 Photo : ${r.photo_url}` : "",
          r.signature_url ? `\u270d\ufe0f Sign\u00e9 : ${r.signature_url}` : "",
          `\nMAIN D'OEUVRE`,
          ...(lignes.mo || []).map(l => { const s = SERVICES_MO.find(x => x.id === l.service); return `  \u2022 ${s?.label || l.service}${l.quantite ? ` : ${l.quantite} ${s?.unite?.toUpperCase() || "H"}` : ""}`; }),
          ...(lignes.mat?.length > 0 ? ["\nMAT\u00c9RIEL", ...(lignes.mat || []).map(l => `  \u2022 ${l.designation}${l.eldas ? ` | ELDAS: ${l.eldas}` : ""}${l.fournisseur ? ` | ${l.fournisseur === "Autre" ? l.fournisseur_custom || "Autre" : l.fournisseur}` : ""}${l.quantite ? ` | Qt\u00e9: ${l.quantite}` : ""}`)] : []),
          "\u2500".repeat(40),
        ].filter(v => v !== "").join("\n");
      }),
      "\u2550".repeat(40), `Nombre de r\u00e9gies : ${items.length}`,
    ].join("\n");
    setRecap({ chantierId, nom: `${nom}${num}`, text, items, ch }); setView("recap");
  };

  const filteredChantiers = chantiers
    .filter(c => dashTab === "archives" ? c.archived : !c.archived)
    .filter(c => {
      if (!searchQ.trim()) return true;
      const q = searchQ.toLowerCase();
      return c.nom.toLowerCase().includes(q) || (c.numero || "").toLowerCase().includes(q) ||
        regiesByChantier(c.id).some(r => r.categorie?.toLowerCase().includes(q) || r.emplacement?.toLowerCase().includes(q) || r.demandeur?.toLowerCase().includes(q));
    })
    .filter(c => filterStatus === "all" ? true : regiesByChantier(c.id).some(r => r.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === "alpha")   return a.nom.localeCompare(b.nom);
      if (sortBy === "oldest")  return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "pending") return regiesByChantier(b.id).filter(r => r.status === "en_attente").length - regiesByChantier(a.id).filter(r => r.status === "en_attente").length;
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .filter(c => regiesByChantier(c.id).length > 0 || dashTab === "archives");

  const totalRegies    = regies.filter(r => r.status !== "facture").length;
  const enAttenteCount = regies.filter(r => r.status === "en_attente").length;

  if (isLoading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 44, marginBottom: 12 }}>\u26a1</div><div style={{ color: "#F59E0B", fontWeight: 700 }}>Chargement...</div></div>
    </div>
  );

  if (view === "saisie") {
    const canSubmit = form.chantier_id && form.initiales && form.categories.length > 0 && form.lignes_mo.some(l => l.service) && form.date && form.demandeur.trim() && form.emplacement.trim();
    return (
      <div style={S.app}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div style={S.header}>
          <button onClick={() => setView("dashboard")} style={S.backBtn}>\u2190</button>
          <div style={{ textAlign: "center" }}><div style={S.logoTitle}>Nouvelle R\u00e9gie</div><div style={S.logoSub}>Saisie terrain</div></div>
          <div style={{ width: 36 }} />
        </div>
        <div style={S.body}>
          {errorMsg && <div style={S.errBox}>{errorMsg}</div>}

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\udcc5 Date *</div>
            <input style={S.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83c\udfd7 Chantier *</div>
            {!showNewCh ? (
              <div style={{ display: "flex", gap: 8 }}>
                <select style={{ ...S.select, flex: 1 }} value={form.chantier_id} onChange={e => {
                  const c = chantiers.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, chantier_id: e.target.value, chantier_nom: c?.nom || "", chantier_email_tech: c?.email_technicien || "" }));
                }}>
                  <option value="">S\u00e9lectionner...</option>
                  {chantiers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.numero ? `[${c.numero}] ` : ""}{c.nom}</option>)}
                </select>
                <button style={S.btnGhost} onClick={() => setShowNewCh(true)}>+ Nouveau</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><label style={S.label}>Nom du chantier *</label><input style={S.input} placeholder="Ex: R\u00e9novation Villa Dupont" value={newCh.nom} onChange={e => setNewCh(f => ({ ...f, nom: e.target.value }))} /></div>
                <div><label style={S.label}>Num\u00e9ro de l'affaire</label><input style={S.input} placeholder="Ex: 2024-087" value={newCh.numero} onChange={e => setNewCh(f => ({ ...f, numero: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...S.btnGhost, flex: 1, color: "#10B981", borderColor: "#10B981" }} onClick={addChantier}>Cr\u00e9er</button>
                  <button style={S.btnGhost} onClick={() => setShowNewCh(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\udce7 Technicien responsable</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {TECH_EMAILS.map(t => (
                <button key={t.id} style={S.techBtn(form.chantier_email_tech?.includes(t.email))} onClick={() => {
                  const has = form.chantier_email_tech?.includes(t.email);
                  const cur = form.chantier_email_tech ? form.chantier_email_tech.split(";").filter(Boolean) : [];
                  const upd = has ? cur.filter(e => e !== t.email) : [...cur, t.email];
                  setForm(f => ({ ...f, chantier_email_tech: upd.join(";") }));
                }}>{t.id}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input style={{ ...S.input, borderRadius: "10px 0 0 10px", flex: 1 }} placeholder="nom" value={newCh.techCustom} onChange={e => setNewCh(f => ({ ...f, techCustom: e.target.value }))} />
              <div style={{ background: "#1E2235", border: "1px solid #1E2235", borderLeft: "none", borderRadius: "0 10px 10px 0", padding: "12px 10px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>@bourquinelectricite.ch</div>
            </div>
            {form.chantier_email_tech && <div style={{ fontSize: 11, color: "#4B5563", marginTop: 6 }}>\u2192 {form.chantier_email_tech}</div>}
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\udc77 Monteur *</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {monteurs.map(m => <button key={m} style={S.montBtn(form.initiales === m)} onClick={() => setForm(f => ({ ...f, initiales: m }))}>{m}</button>)}
              {!showAddMont ? (
                <button style={{ ...S.btnGhost, padding: "10px 14px" }} onClick={() => setShowAddMont(true)}>+</button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...S.input, width: 70, padding: "10px" }} placeholder="ZB" maxLength={3} value={newMontVal} onChange={e => setNewMontVal(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && addMonteur()} autoFocus />
                  <button style={{ ...S.btnGhost, color: "#10B981", borderColor: "#10B981" }} onClick={addMonteur}>OK</button>
                  <button style={S.btnGhost} onClick={() => { setShowAddMont(false); setNewMontVal(""); }}>\u2715</button>
                </div>
              )}
            </div>
            {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {monteurs.filter(m => !DEFAULT_MONTEURS.includes(m)).map(m => (
                  <button key={m} onClick={() => saveMonteurs(monteurs.filter(x => x !== m))} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>{m} \u2715</button>
                ))}
              </div>
            )}
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\ude4b Qui a fait la demande ? *</div>
            <input style={S.input} placeholder="Nom (ex: Marc Dupont, architecte)" value={form.demandeur} onChange={e => setForm(f => ({ ...f, demandeur: e.target.value }))} />
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83c\udff7 Cat\u00e9gorie(s) * <span style={{ fontSize: 10, color: "#4B5563", fontWeight: 400 }}>S\u00e9lection multiple</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} style={S.catBtn(form.categories.includes(cat.id))} onClick={() => toggleCat(cat.id)}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span><span>{cat.label}</span>
                </button>
              ))}
            </div>
            {form.categories.includes("autre") && <input style={{ ...S.input, marginTop: 8 }} placeholder="Pr\u00e9cise la cat\u00e9gorie..." value={form.categorie_custom} onChange={e => setForm(f => ({ ...f, categorie_custom: e.target.value }))} />}
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\udccd Emplacement *</div>
            <input style={S.input} placeholder="Ex: Cuisine RDC, Local technique cave..." value={form.emplacement} onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))} />
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\u26a1 Main d'oeuvre *</div>
            {form.lignes_mo.map((l, idx) => {
              const svc = SERVICES_MO.find(x => x.id === l.service);
              return (
                <div key={l.id} style={S.rowLine}>
                  <div style={{ flex: 2 }}>
                    {idx === 0 && <label style={S.labelOpt}>Service</label>}
                    <select style={S.select} value={l.service} onChange={e => updateMO(l.id, "service", e.target.value)}>
                      <option value="">S\u00e9lectionner...</option>
                      {SERVICES_MO.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div style={{ width: 70 }}>
                    {idx === 0 && <label style={S.labelOpt}>Qt\u00e9</label>}
                    <input style={S.input} type="number" step="0.5" placeholder="0" value={l.quantite} onChange={e => updateMO(l.id, "quantite", e.target.value)} />
                  </div>
                  <div style={{ width: 36, paddingTop: idx === 0 ? 26 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "#4B5563", fontWeight: 700 }}>{svc?.unite?.toUpperCase() || "H"}</span>
                  </div>
                  {form.lignes_mo.length > 1 && <button style={{ ...S.delSmall, marginTop: idx === 0 ? 22 : 0 }} onClick={() => removeMO(l.id)}>\u2715</button>}
                </div>
              );
            })}
            <button style={S.btnAdd} onClick={() => setForm(f => ({ ...f, lignes_mo: [...f.lignes_mo, EMPTY_MO()] }))}>+ Ajouter un service</button>
          </div>

          <div style={S.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.secTitle}>\ud83d\udce6 Mat\u00e9riel</div>
              <button style={{ ...S.techBtn(form.has_materiel), fontSize: 12, padding: "6px 12px" }} onClick={() => setForm(f => ({ ...f, has_materiel: !f.has_materiel, lignes_mat: !f.has_materiel ? [EMPTY_MAT()] : [] }))}>
                {form.has_materiel ? "\u2713 Oui" : "Non"}
              </button>
            </div>
            {form.has_materiel && (
              <>
                {form.lignes_mat.map((l, idx) => (
                  <div key={l.id} style={{ background: "#0A0C12", border: "1px solid #1E2235", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, textTransform: "uppercase" }}>Ligne {idx + 1}</span>
                      {form.lignes_mat.length > 1 && <button style={S.delSmall} onClick={() => removeMat(l.id)}>\u2715</button>}
                    </div>
                    <div style={{ marginBottom: 8 }}><label style={S.labelOpt}>D\u00e9signation</label><input style={S.input} placeholder="Mat\u00e9riel, appareillage..." value={l.designation} onChange={e => updateMat(l.id, "designation", e.target.value)} /></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}><label style={S.labelOpt}>ELDAS n\u00b0</label><input style={S.input} placeholder="441.100.01" value={l.eldas} onChange={e => updateMat(l.id, "eldas", e.target.value)} /></div>
                      <div style={{ flex: 1 }}>
                        <label style={S.labelOpt}>Fournisseur</label>
                        <select style={S.select} value={l.fournisseur} onChange={e => updateMat(l.id, "fournisseur", e.target.value)}>
                          <option value="">Choisir...</option>
                          {FOURNISSEURS.map(fo => <option key={fo} value={fo}>{fo}</option>)}
                        </select>
                      </div>
                      <div style={{ width: 70 }}><label style={S.labelOpt}>Qt\u00e9</label><input style={S.input} type="number" placeholder="0" value={l.quantite} onChange={e => updateMat(l.id, "quantite", e.target.value)} /></div>
                    </div>
                    {l.fournisseur === "Autre" && <div style={{ marginTop: 8 }}><label style={S.labelOpt}>Nom fournisseur</label><input style={S.input} placeholder="Nom..." value={l.fournisseur_custom} onChange={e => updateMat(l.id, "fournisseur_custom", e.target.value)} /></div>}
                  </div>
                ))}
                <button style={S.btnAdd} onClick={() => setForm(f => ({ ...f, lignes_mat: [...f.lignes_mat, EMPTY_MAT()] }))}>+ Ajouter une ligne mat\u00e9riel</button>
              </>
            )}
          </div>

          <div style={S.section}>
            <div style={S.secTitle}>\ud83d\udcf7 Photo</div>
            <div style={S.photoBox} onClick={() => fileRef.current.click()}>
              {photoPreview ? <img src={photoPreview} style={{ width: "100%", borderRadius: 10, maxHeight: 220, objectFit: "cover" }} alt="preview" /> : <div><div style={{ fontSize: 32, marginBottom: 6 }}>\ud83d\udcf7</div><div style={{ fontSize: 13, color: "#4B5563" }}>Prendre une photo comme preuve</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          </div>

          <button style={{ ...S.btnPrimary, opacity: (!canSubmit || saving) ? 0.4 : 1 }} onClick={submitRegie} disabled={!canSubmit || saving}>
            {saving ? "Enregistrement..." : "\u2713 Enregistrer la r\u00e9gie"}
          </button>
          {!canSubmit && <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563", marginTop: 8 }}>Obligatoire : date, chantier, monteur, demandeur, emplacement, cat\u00e9gorie + au moins un service MO</div>}
          <div style={{ height: 40 }} />
        </div>
        {saved && <div style={S.toast}>\u2713 R\u00e9gie enregistr\u00e9e !</div>}
      </div>
    );
  }

  if (view === "recap") return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <button onClick={() => setView("dashboard")} style={S.backBtn}>\u2190</button>
        <div style={{ textAlign: "center" }}><div style={S.logoTitle}>R\u00e9capitulatif</div><div style={S.logoSub}>{recap?.nom}</div></div>
        <div style={{ width: 36 }} />
      </div>
      <div style={S.body}>
        <div style={{ ...S.card, background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)", marginBottom: 16 }}>
          <div style={S.kpiLabel}>R\u00e9gies du chantier</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>{recap?.items.length} r\u00e9gie{recap?.items.length !== 1 ? "s" : ""}</div>
        </div>
        {recap?.items.map((r, idx) => {
          const lignes = parseLignes(r.lignes); const ch = recap.ch;
          return (
            <div key={r.id} style={{ ...S.card, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#E8EAF0" }}>
                  R\u00e9gie #{r.regie_number || idx+1}
                  {r.initiales && <span style={{ ...S.initBadge, marginLeft: 8 }}>{r.initiales}</span>}
                  {r.photo_url && <span style={{ ...S.photoBadge, marginLeft: 6 }} onClick={() => setFullscreenUrl(r.photo_url)}>\ud83d\udcf7</span>}
                </div>
                <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(r.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{r.categorie}{r.emplacement ? ` \u00b7 \ud83d\udccd ${r.emplacement}` : ""}</div>
              {r.demandeur && <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>\ud83d\ude4b {r.demandeur}</div>}
              {(lignes.mo || []).map((l, i) => { const s = SERVICES_MO.find(x => x.id === l.service); return <div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "2px 0" }}>\ud83d\udc77 {s?.label || l.service}{l.quantite ? ` : ${l.quantite} ${s?.unite?.toUpperCase() || "H"}` : ""}</div>; })}
              {(lignes.mat || []).filter(l => l.designation).map((l, i) => <div key={i} style={{ fontSize: 12, color: "#9CA3AF", padding: "2px 0" }}>\ud83d\udce6 {l.designation}{l.quantite ? ` \u00b7 ${l.quantite}` : ""}</div>)}
              {r.signature_url ? (
                <div style={{ ...S.sigBox, background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 6 }}>\u2713 Sign\u00e9 par le client</div>
                  <img src={r.signature_url} onClick={() => setFullscreenUrl(r.signature_url)} style={{ width: "100%", borderRadius: 6, maxHeight: 100, objectFit: "contain", background: "#fff", cursor: "pointer" }} alt="doc sign\u00e9" />
                  <button style={S.btnResign} onClick={() => setShowSig(r.id)}>\u21a9 Re-signer</button>
                </div>
              ) : (
                <button style={{ ...S.btnSecondary, width: "100%", marginTop: 8 }} onClick={() => setShowSig(r.id)}>\u270d\ufe0f Faire signer le client</button>
              )}
              <a href={buildRegieEmail(r, ch)} style={S.btnSend} onClick={() => updateStatus(r.id, "envoye")}>
                \u2709\ufe0f Envoyer cette r\u00e9gie au technicien
              </a>
            </div>
          );
        })}
        <div style={{ ...S.dashSec, marginTop: 16 }}>R\u00e9capitulatif complet (vue interne)</div>
        <div style={S.recapBox}>{recap?.text}</div>
        <button style={{ ...S.btnPrimary, marginTop: 12, background: "#1E2235", color: "#9CA3AF", border: "none" }} onClick={() => { try { navigator.clipboard.writeText(recap?.text); } catch {} }}>
          \ud83d\udccb Copier le r\u00e9capitulatif
        </button>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button style={{ ...S.btnSecondary, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "envoye")); setView("dashboard"); }}>Tout marquer envoy\u00e9</button>
          <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { recap?.items.forEach(r => updateStatus(r.id, "facture")); setView("dashboard"); }}>\u2713 Tout factur\u00e9</button>
        </div>
        <div style={{ height: 40 }} />
      </div>
      {showSig && (() => { const r = regies.find(x => x.id === showSig); const ch = getChantier(r?.chantier_id) || {}; return <SignatureCanvas regie={r} chantier={ch} onSave={(d) => handleSignature(showSig, d)} onCancel={() => setShowSig(null)} />; })()}
      {fullscreenUrl && <FullscreenViewer url={fullscreenUrl} onClose={() => setFullscreenUrl(null)} />}
    </div>
  );

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.header}>
        <div style={S.logoWrap}><div style={S.logoIcon}>\u26a1</div><div><div style={S.logoTitle}>{APP_NAME}</div><div style={S.logoSub}>Suivi r\u00e9gies</div></div></div>
        <button onClick={loadData} style={S.btnGhost}>\u21bb</button>
      </div>
      <div style={S.body}>
        {errorMsg && <div style={S.errBox}>{errorMsg}</div>}
        <div style={S.kpiGrid}>
          <div style={S.kpiCard(false)}><div style={S.kpiLabel}>R\u00e9gies actives</div><div style={S.kpiVal(false)}>{totalRegies}</div></div>
          <div style={S.kpiCard(enAttenteCount > 0)}><div style={S.kpiLabel}>Sans signature</div><div style={S.kpiVal(enAttenteCount > 0)}>{enAttenteCount}</div></div>
        </div>
        {enAttenteCount > 0 && (
          <div style={S.alertBan}>
            <span style={{ fontSize: 20 }}>\u26a0\ufe0f</span>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{enAttenteCount} r\u00e9gie{enAttenteCount !== 1 ? "s" : ""} sans signature</div><div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Ouvrir le r\u00e9capitulatif pour faire signer</div></div>
          </div>
        )}
        <div style={S.tabRow}>
          <button style={S.tabBtn(dashTab === "actifs")}   onClick={() => setDashTab("actifs")}>Actifs</button>
          <button style={S.tabBtn(dashTab === "archives")} onClick={() => setDashTab("archives")}>Archives</button>
        </div>
        <input style={S.searchBox} placeholder="\ud83d\udd0d Rechercher..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <div style={S.filterRow}>
          {[{ id: "all", label: "Tous" }, ...Object.entries(STATUS_COLORS).map(([id, v]) => ({ id, label: v.label }))].map(f => (
            <button key={f.id} style={S.filterBtn(filterStatus === f.id)} onClick={() => setFilterStatus(f.id)}>{f.label}</button>
          ))}
        </div>
        <div style={S.sortRow}>{SORT_OPTIONS.map(s => <button key={s.id} style={S.sortBtn(sortBy === s.id)} onClick={() => setSortBy(s.id)}>{s.label}</button>)}</div>
        <div style={S.dashSec}>Chantiers ({filteredChantiers.length})</div>
        {filteredChantiers.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>{dashTab === "archives" ? "\ud83d\udce6" : "\ud83c\udfd7"}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{dashTab === "archives" ? "Aucune archive" : "Aucun chantier"}</div>
            <div style={{ fontSize: 13 }}>{dashTab === "archives" ? "Les chantiers archiv\u00e9s appara\u00eetront ici" : "Appuie sur + pour saisir ta premi\u00e8re r\u00e9gie"}</div>
          </div>
        ) : (
          filteredChantiers.map(chantier => {
            const allRegies = regiesByChantier(chantier.id); const nf = nonFactures(chantier.id);
            const sansSig = nf.filter(r => r.status === "en_attente").length;
            return (
              <div key={chantier.id} style={S.chCard}>
                <div style={S.chHead}>
                  <div style={{ flex: 1 }}>
                    <div style={S.chName}>{chantier.nom}</div>
                    {chantier.numero && <div style={S.chNum}>N\u00b0 affaire : {chantier.numero}</div>}
                    <div style={S.chMeta}>{allRegies.length} r\u00e9gie{allRegies.length !== 1 ? "s" : ""} \u00b7 {nf.length} active{nf.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    {sansSig > 0 && <span style={S.badge(STATUS_COLORS.en_attente)}>\u26a0\ufe0f {sansSig}</span>}
                    <button style={S.btnArchive} onClick={() => dashTab === "archives" ? unarchiveChantier(chantier.id) : setConfirmArch(chantier.id)}>
                      {dashTab === "archives" ? "\u21a9 Restaurer" : "\ud83d\udce6 Archiver"}
                    </button>
                  </div>
                </div>
                {nf.map((r, ridx) => {
                  const lignes = parseLignes(r.lignes); const rNum = r.regie_number || (allRegies.length - ridx);
                  return (
                    <div key={r.id} style={S.regieRow}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={S.regieMeta}>
                          <span style={S.numBadge}>#{rNum}</span>
                          {r.initiales && <span style={S.initBadge}>{r.initiales}</span>}
                          {r.photo_url     && <span style={S.photoBadge} onClick={() => setFullscreenUrl(r.photo_url)}>\ud83d\udcf7 Photo</span>}
                          {r.signature_url && <span style={S.sigBadge}   onClick={() => setFullscreenUrl(r.signature_url)}>\u270d\ufe0f Sign\u00e9</span>}
                          <span style={{ fontSize: 11, color: "#4B5563" }}>{formatDate(r.created_at)}</span>
                        </div>
                        <button style={S.delSmall} onClick={() => setConfirmDel(r.id)}>\ud83d\uddd1</button>
                      </div>
                      <div style={{ fontSize: 12, color: "#E8EAF0", fontWeight: 600, marginBottom: 2 }}>{r.categorie}</div>
                      {r.emplacement && <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>\ud83d\udccd {r.emplacement}</div>}
                      {r.demandeur   && <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 4 }}>\ud83d\ude4b {r.demandeur}</div>}
                      {(lignes.mo || []).slice(0,2).map((l, i) => { const sv = SERVICES_MO.find(x => x.id === l.service); return <div key={i} style={{ fontSize: 11, color: "#9CA3AF" }}>\ud83d\udc77 {sv?.label || l.service}{l.quantite ? ` \u00b7 ${l.quantite} ${sv?.unite?.toUpperCase() || "H"}` : ""}</div>; })}
                      {(lignes.mo || []).length > 2 && <div style={{ fontSize: 11, color: "#4B5563" }}>+ {lignes.mo.length - 2} service{lignes.mo.length - 2 > 1 ? "s" : ""}</div>}
                      {(lignes.mat || []).filter(l => l.designation).length > 0 && <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>\ud83d\udce6 {lignes.mat.length} ligne{lignes.mat.length > 1 ? "s" : ""} mat\u00e9riel</div>}
                      <div style={S.statusRow}>
                        {Object.entries(STATUS_COLORS).map(([key, val]) => (
                          <button key={key} style={S.statusBtn(r.status === key, val)} onClick={() => updateStatus(r.id, key)}>{val.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {nf.length > 0 && <button style={{ ...S.btnPrimary, marginTop: 14 }} onClick={() => generateRecap(chantier.id)}>\ud83d\udcc4 Ouvrir r\u00e9capitulatif</button>}
              </div>
            );
          })
        )}
        <div style={{ height: 80 }} />
      </div>
      {confirmDel && (
        <div style={S.overlayBot}><div style={S.modal}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 8 }}>Supprimer cette r\u00e9gie ?</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Cette action est irr\u00e9versible.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnDanger, flex: 1, padding: "12px" }} onClick={() => deleteRegie(confirmDel)}>Oui, supprimer</button>
            <button style={{ ...S.btnGhost, flex: 1, padding: "12px" }} onClick={() => setConfirmDel(null)}>Annuler</button>
          </div>
        </div></div>
      )}
      {confirmArch && (
        <div style={S.overlayBot}><div style={S.modal}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#E8EAF0", marginBottom: 8 }}>Archiver ce chantier ?</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Il dispara\u00eetre du dashboard et sera accessible dans Archives.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnArchive, flex: 1, padding: "12px", borderRadius: 10 }} onClick={() => archiveChantier(confirmArch)}>\ud83d\udce6 Archiver</button>
            <button style={{ ...S.btnGhost, flex: 1, padding: "12px" }} onClick={() => setConfirmArch(null)}>Annuler</button>
          </div>
        </div></div>
      )}
      {fullscreenUrl && <FullscreenViewer url={fullscreenUrl} onClose={() => setFullscreenUrl(null)} />}
      <button style={S.fab} onClick={() => setView("saisie")}>+</button>
    </div>
  );
}
