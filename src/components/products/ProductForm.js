"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { categoriesApi } from "@/lib/api/categoriesApi";
import { tagsApi } from "@/lib/api/tagsApi";
import { destinationsApi } from "@/lib/api/destinationsApi";
import { addonsApi } from "@/lib/api/addonsApi";
import { uploadFile as uploadFileApi } from "@/lib/api/uploadApi";
import RichTextEditor from "@/components/ui/RichTextEditor";

/* ── helpers ─────────────────────────────────────── */

const str = (v, f = "") => (v === undefined || v === null ? f : String(v));
const bool = (v, f = false) => {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return f;
  return ["true", "1", "yes"].includes(String(v).toLowerCase().trim());
};
const arr = (v) => (Array.isArray(v) ? v : []);
const slugInput = (t) =>
  String(t).toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const slugSave = (t) => slugInput(t).replace(/^-+|-+$/g, "");

const TABS = [
  "Basic Info",
  "Media",
  "Relations",
  "Content",
  "Itinerary",
  "FAQs & Buttons",
  "Transportation",
  "Cancellation & SEO",
];
const BADGES = ["", "NEW", "BEST_SELLER", "TOP_RATED", "DISCOUNTED"];
const BADGE_LABELS = { "": "None", NEW: "New", BEST_SELLER: "Best Seller", TOP_RATED: "Top Rated", DISCOUNTED: "Discounted" };

/* ── component ───────────────────────────────────── */

export default function ProductForm({ initialValues, submitting, onSubmit, onSaveTab, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const iv = initialValues || {};

  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState({});
  const [savingTab, setSavingTab] = useState(false);
  const [savedTabs, setSavedTabs] = useState(() => new Set()); // tracks which tabs have been saved
  const ce = (f) => setErrors((p) => { const n = { ...p }; delete n[f]; return n; });

  /* ── Tab 1: Basic ────────────────────────────── */
  const [title, setTitle] = useState(str(iv.title));
  const [slug, setSlug] = useState(str(iv.slug));
  const [slugManual, setSlugManual] = useState(isEditing);
  const [shortDesc, setShortDesc] = useState(str(iv.shortDescription));
  const [duration, setDuration] = useState(str(iv.duration ?? ""));
  const [languages, setLanguages] = useState(arr(iv.languages).join(", "));
  const [basePrice, setBasePrice] = useState(str(iv.basePrice ?? ""));
  const [badge, setBadge] = useState(str(iv.badge || ""));
  const [minP, setMinP] = useState(str(iv.minParticipants ?? ""));
  const [maxP, setMaxP] = useState(str(iv.maxParticipants ?? ""));
  const [hasOffer, setHasOffer] = useState(bool(iv.hasOffer));
  const [discType, setDiscType] = useState(str(iv.discountType || "PERCENTAGE"));
  const [discVal, setDiscVal] = useState(str(iv.discountValue ?? ""));
  const [isActive, setIsActive] = useState(bool(iv.isActive, true));

  /* ── Tab 2: Media ─────────────────────────────── */
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState(str(iv.coverImage));
  const [fileKey, setFileKey] = useState(0);
  const [gallery, setGallery] = useState(() => arr(iv.gallery).filter(Boolean));
  const [galleryUploading, setGalleryUploading] = useState(false);

  /* ── Tab 3: Relations ─────────────────────────── */
  const [selCategories, setSelCategories] = useState(() => arr(iv.categories).map((c) => (typeof c === "object" ? c._id : c)));
  const [selTags, setSelTags] = useState(() => arr(iv.tags).map((t) => (typeof t === "object" ? t._id : t)));
  const [selDest, setSelDest] = useState(() => { const d = iv.destination; return d ? (typeof d === "object" ? d._id : d) : ""; });
  const [selAddons, setSelAddons] = useState(() => arr(iv.addons).map((a) => (typeof a === "object" ? a._id : a)));

  const [catOptions, setCatOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [destOptions, setDestOptions] = useState([]);
  const [addonOptions, setAddonOptions] = useState([]);

  useEffect(() => {
    categoriesApi.list({ limit: 100 }).then((r) => setCatOptions(arr(r?.data?.data?.items))).catch(() => {});
    tagsApi.list({ limit: 100 }).then((r) => setTagOptions(arr(r?.data?.data?.items))).catch(() => {});
    destinationsApi.list({ limit: 100 }).then((r) => setDestOptions(arr(r?.data?.data?.items))).catch(() => {});
    addonsApi.list({ limit: 100 }).then((r) => setAddonOptions(arr(r?.data?.data?.items))).catch(() => {});
  }, []);

  /* ── Tab 4: Content ───────────────────────────── */
  const [overView, setOverView] = useState(str(iv.overView));
  const [highlights, setHighlights] = useState(() => { const h = arr(iv.highlights).filter(Boolean); return h.length > 0 ? h : [""]; });
  const [inclusions, setInclusions] = useState(() => { const h = arr(iv.inclusions).filter(Boolean); return h.length > 0 ? h : [""]; });
  const [exclusions, setExclusions] = useState(() => { const h = arr(iv.exclusions).filter(Boolean); return h.length > 0 ? h : [""]; });

  /* ── Tab 5: Itinerary ─────────────────────────── */
  const [itinerary, setItinerary] = useState(() => {
    const it = arr(iv.itinerary).filter((x) => x && typeof x === "object");
    return it.length > 0 ? it.map((x) => ({ title: str(x.title), description: str(x.description) })) : [{ title: "", description: "" }];
  });

  /* ── Tab 6: FAQs & Buttons ────────────────────── */
  const [faqs, setFaqs] = useState(() => {
    const f = arr(iv.faqs).filter((x) => x && typeof x === "object");
    return f.length > 0 ? f.map((x) => ({ question: str(x.question), answer: str(x.answer), link: str(x.link) })) : [{ question: "", answer: "", link: "" }];
  });
  const [buttons, setButtons] = useState(() => {
    const b = arr(iv.buttons).filter((x) => x && typeof x === "object");
    return b.length > 0 ? b.map((x) => ({ label: str(x.label), url: str(x.url) })) : [];
  });

  /* ── Tab 7: Transportation ────────────────────── */
  const initStdTransport = (type) => {
    const t = iv.transportation?.[type] || {};
    const seasons = arr(t.seasons).map((s) => ({
      startDate: str(s.startDate ? String(s.startDate).substring(0, 10) : ""),
      endDate: str(s.endDate ? String(s.endDate).substring(0, 10) : ""),
      adult: str(s.pricing?.adult ?? ""),
      child: str(s.pricing?.child ?? ""),
      infant: str(s.pricing?.infant ?? ""),
    }));
    return { isEnabled: bool(t.isEnabled || t.useFallback), seasons };
  };
  const initPrivateTransport = () => {
    const t = iv.transportation?.private || {};
    const seasons = arr(t.seasons).map((s) => {
      let pricingObj = s.selectedVehicle?.pricing || {};
      // Handle MongoDB Map or plain object
      if (pricingObj instanceof Map || (typeof pricingObj === "object" && pricingObj.get && pricingObj.set)) {
        const o = {}; pricingObj.forEach((v, k) => { o[String(k)] = Number(v) || 0; }); pricingObj = o;
      } else if (typeof pricingObj === "object" && !Array.isArray(pricingObj)) {
        const o = {}; Object.entries(pricingObj).forEach(([k, v]) => { o[String(k)] = Number(v) || 0; }); pricingObj = o;
      }
      if (!pricingObj || Object.keys(pricingObj).length === 0) pricingObj = { "1": 0 };
      return {
        startDate: str(s.startDate ? String(s.startDate).substring(0, 10) : ""),
        endDate: str(s.endDate ? String(s.endDate).substring(0, 10) : ""),
        vehicleName: str(s.selectedVehicle?.name || "4-seater"),
        vehicleDesc: str(s.selectedVehicle?.description || ""),
        pricing: Object.entries(pricingObj).sort(([a], [b]) => Number(a) - Number(b)).map(([k, v]) => ({ people: String(k), price: str(v) })),
      };
    });
    return { isEnabled: bool(t.isEnabled), seasons };
  };
  const [tDirect, setTDirect] = useState(() => initStdTransport("direct"));
  const [tShared, setTShared] = useState(() => initStdTransport("shared"));
  const [tPrivate, setTPrivate] = useState(initPrivateTransport);
  const [tFallback, setTFallback] = useState(() => initStdTransport("fallbackPricing"));

  /* ── Tab 8: Cancellation & SEO ────────────────── */
  const [cancelPeriod, setCancelPeriod] = useState(str(iv.cancellationPolicy?.freeCancellationPeriod ?? ""));
  const [cancelTerms, setCancelTerms] = useState(str(iv.cancellationPolicy?.terms));
  const [seoTitle, setSeoTitle] = useState(str(iv.seo?.metaTitle));
  const [seoDesc, setSeoDesc] = useState(str(iv.seo?.metaDescription));
  const [seoKeywords, setSeoKeywords] = useState(arr(iv.seo?.keywords).join(", "));

  /* ── Cover image helpers ──────────────────────── */
  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : coverUrl || ""), [coverFile, coverUrl]);

  const pickCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ok.includes(f.type)) { setErrors((p) => ({ ...p, coverFile: "Only JPG, PNG, WebP, GIF allowed" })); return; }
    if (f.size > 10 * 1024 * 1024) { setErrors((p) => ({ ...p, coverFile: "Max 10 MB" })); return; }
    ce("coverFile");
    setCoverFile(f);
  };
  const clearCover = () => { setCoverFile(null); setFileKey((k) => k + 1); ce("coverFile"); };

  /* ── slug auto ────────────────────────────────── */
  const onTitleChange = (v) => { setTitle(v); ce("title"); if (!slugManual) setSlug(slugInput(v)); };
  const onSlugChange = (v) => { setSlugManual(true); setSlug(slugInput(v)); };

  /* ── dynamic list helpers ─────────────────────── */
  const addItem = (setter) => setter((p) => [...p, ""]);
  const removeItem = (setter, i) => setter((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (setter, i, v) => setter((p) => p.map((x, idx) => (idx === i ? v : x)));

  const addObj = (setter, template) => setter((p) => [...p, { ...template }]);
  const removeObj = (setter, i) => setter((p) => p.filter((_, idx) => idx !== i));
  const updateObj = (setter, i, key, v) => setter((p) => p.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));

  /* ── transport season helpers ──────────────────── */
  const emptySeason = { startDate: "", endDate: "", adult: "", child: "", infant: "" };
  const addSeason = (setter) => setter((p) => ({ ...p, seasons: [...p.seasons, { ...emptySeason }] }));
  const removeSeason = (setter, i) => setter((p) => ({ ...p, seasons: p.seasons.filter((_, idx) => idx !== i) }));
  const updateSeason = (setter, i, key, v) => setter((p) => ({
    ...p, seasons: p.seasons.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)),
  }));

  /* ── private transport helpers ─────────────────── */
  const emptyPrivateSeason = { startDate: "", endDate: "", vehicleName: "4-seater", vehicleDesc: "", pricing: [{ people: "1", price: "0" }] };
  const addPrivateSeason = () => setTPrivate((p) => ({ ...p, seasons: [...p.seasons, { ...emptyPrivateSeason, pricing: [{ people: "1", price: "0" }] }] }));
  const removePrivateSeason = (i) => setTPrivate((p) => ({ ...p, seasons: p.seasons.filter((_, idx) => idx !== i) }));
  const updatePrivateSeason = (i, key, v) => setTPrivate((p) => ({
    ...p, seasons: p.seasons.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)),
  }));
  const getMaxPeople = (vName) => (vName === "6-seater" ? 6 : 4);
  const addPricingRow = (si) => setTPrivate((p) => {
    const s = p.seasons[si]; if (!s) return p;
    const max = getMaxPeople(s.vehicleName);
    if (s.pricing.length >= max) return p;
    const nextKey = s.pricing.length > 0 ? String(Math.max(...s.pricing.map((r) => Number(r.people) || 0)) + 1) : "1";
    if (Number(nextKey) > max) return p;
    return { ...p, seasons: p.seasons.map((ss, idx) => idx === si ? { ...ss, pricing: [...ss.pricing, { people: nextKey, price: "0" }] } : ss) };
  });
  const removePricingRow = (si, pi) => setTPrivate((p) => ({
    ...p, seasons: p.seasons.map((ss, idx) => idx === si ? { ...ss, pricing: ss.pricing.filter((_, ri) => ri !== pi) } : ss),
  }));
  const updatePricingRow = (si, pi, key, v) => setTPrivate((p) => ({
    ...p, seasons: p.seasons.map((ss, idx) => idx === si ? { ...ss, pricing: ss.pricing.map((r, ri) => ri === pi ? { ...r, [key]: v } : r) } : ss),
  }));
  const onVehicleChange = (si, newName) => {
    const max = getMaxPeople(newName);
    setTPrivate((p) => ({
      ...p, seasons: p.seasons.map((ss, idx) => {
        if (idx !== si) return ss;
        const trimmed = ss.pricing.length > max ? ss.pricing.slice(0, max) : ss.pricing;
        return { ...ss, vehicleName: newName, pricing: trimmed };
      }),
    }));
  };

  /* ── fallback auto-toggle ─────────────────────── */
  const anyTransportEnabled = tDirect.isEnabled || tShared.isEnabled || tPrivate.isEnabled;
  useEffect(() => {
    if (anyTransportEnabled && tFallback.isEnabled) setTFallback((p) => ({ ...p, isEnabled: false }));
  }, [anyTransportEnabled]);
  useEffect(() => {
    if (!tDirect.isEnabled && !tShared.isEnabled && !tPrivate.isEnabled && !tFallback.isEnabled) setTFallback((p) => ({ ...p, isEnabled: true }));
  }, [tDirect.isEnabled, tShared.isEnabled, tPrivate.isEnabled]);

  /* ── toggle helpers ───────────────────────────── */
  const toggleMulti = (setter, id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* ── validate (basic) ─────────────────────────── */
  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    const dv = Number(duration);
    if (duration === "" || isNaN(dv)) e.duration = "Duration (hours) is required";
    else if (dv <= 0) e.duration = "Duration must be a positive number";
    const bp = Number(basePrice);
    if (basePrice === "" || isNaN(bp)) e.basePrice = "Base price is required";
    else if (bp < 0) e.basePrice = "Price must be 0 or more";
    if (!isEditing && !coverFile && !coverUrl) e.coverFile = "Cover image is required";
    return e;
  };

  /* ── build form data (shared between submit & tab save) ── */
  const buildStdSeasons = (t) => t.seasons.filter((s) => s.startDate && s.endDate).map((s) => ({
    startDate: s.startDate, endDate: s.endDate,
    pricing: { adult: Number(s.adult) || 0, child: Number(s.child) || 0, infant: Number(s.infant) || 0 },
  }));
  const buildPrivateSeasons = () => tPrivate.seasons.filter((s) => s.startDate && s.endDate).map((s) => {
    const pricingObj = {};
    (s.pricing || []).forEach((r) => { if (r.people) pricingObj[String(r.people)] = Number(r.price) || 0; });
    return {
      startDate: s.startDate, endDate: s.endDate,
      selectedVehicle: { name: s.vehicleName || "4-seater", description: s.vehicleDesc || "", pricing: Object.keys(pricingObj).length > 0 ? pricingObj : { "1": 0 } },
    };
  });

  const buildFormData = () => {
    const fd = new FormData();
    if (coverFile) fd.append("file", coverFile);

    // Basic
    fd.append("title", title.trim());
    fd.append("slug", slugSave(slug || title));
    fd.append("shortDescription", shortDesc.trim());
    fd.append("duration", String(Number(duration) || 0));
    fd.append("languages", JSON.stringify(languages.split(",").map((l) => l.trim()).filter(Boolean)));
    fd.append("basePrice", String(Number(basePrice) || 0));
    fd.append("badge", badge || "");
    if (minP) fd.append("minParticipants", minP);
    if (maxP) fd.append("maxParticipants", maxP);
    fd.append("hasOffer", String(hasOffer));
    if (hasOffer) {
      fd.append("discountType", discType);
      fd.append("discountValue", discVal || "0");
    }
    fd.append("isActive", String(isActive));

    // Cover URL (if no new file)
    if (!coverFile && coverUrl) fd.append("coverImage", coverUrl);

    // Gallery
    fd.append("gallery", JSON.stringify(gallery.filter(Boolean)));

    // Relations
    fd.append("categories", JSON.stringify(selCategories));
    fd.append("tags", JSON.stringify(selTags));
    fd.append("destination", selDest || "");
    fd.append("addons", JSON.stringify(selAddons));

    // Content
    fd.append("overView", overView);
    fd.append("highlights", JSON.stringify(highlights.filter(Boolean)));
    fd.append("inclusions", JSON.stringify(inclusions.filter(Boolean)));
    fd.append("exclusions", JSON.stringify(exclusions.filter(Boolean)));

    // Itinerary
    fd.append("itinerary", JSON.stringify(itinerary.filter((x) => x.title || x.description)));

    // FAQs & Buttons
    fd.append("faqs", JSON.stringify(faqs.filter((x) => x.question || x.answer)));
    fd.append("buttons", JSON.stringify(buttons.filter((x) => x.label && x.url)));

    // Transportation
    fd.append("transportation", JSON.stringify({
      direct: { isEnabled: tDirect.isEnabled, seasons: tDirect.isEnabled ? buildStdSeasons(tDirect) : [] },
      shared: { isEnabled: tShared.isEnabled, seasons: tShared.isEnabled ? buildStdSeasons(tShared) : [] },
      private: { isEnabled: tPrivate.isEnabled, seasons: tPrivate.isEnabled ? buildPrivateSeasons() : [] },
      fallbackPricing: { useFallback: tFallback.isEnabled, seasons: tFallback.isEnabled ? buildStdSeasons(tFallback) : [] },
    }));

    // Cancellation & SEO
    fd.append("cancellationPolicy", JSON.stringify({
      freeCancellationPeriod: cancelPeriod ? Number(cancelPeriod) : null,
      terms: cancelTerms.trim(),
    }));
    fd.append("seo", JSON.stringify({
      metaTitle: seoTitle.trim(),
      metaDescription: seoDesc.trim(),
      keywords: seoKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    }));

    return fd;
  };

  /* ── validate for tab save (lighter – only basic required fields) ── */
  const validateForTabSave = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    const dvt = Number(duration);
    if (duration === "" || isNaN(dvt)) e.duration = "Duration (hours) is required";
    else if (dvt <= 0) e.duration = "Duration must be a positive number";
    const bp = Number(basePrice);
    if (basePrice === "" || isNaN(bp)) e.basePrice = "Base price is required";
    else if (bp < 0) e.basePrice = "Price must be 0 or more";
    return e;
  };

  /* ── save current tab & advance ─────────────────── */
  const handleNextTab = async () => {
    // Validate basic required fields before saving
    const errs = validateForTabSave();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.title || errs.duration || errs.basePrice) setTab(0);
      return;
    }
    setErrors({});

    if (!onSaveTab) {
      // Fallback: just advance tab without saving
      setTab((t) => t + 1);
      return;
    }

    setSavingTab(true);
    try {
      const fd = buildFormData();
      await onSaveTab(fd);
      setSavedTabs((prev) => new Set(prev).add(tab));
      setTab((t) => t + 1);
    } catch {
      // Error is handled by the parent – stay on current tab
    } finally {
      setSavingTab(false);
    }
  };

  /* ── submit ───────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Jump to tab with the first error
      if (errs.title || errs.duration || errs.basePrice) setTab(0);
      else if (errs.coverFile) setTab(1);
      return;
    }

    const fd = buildFormData();
    await onSubmit(fd);
  };

  /* ── styling helpers ──────────────────────────── */
  const inp = (f) => `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${errors[f] ? "border-red-400" : "border-black/10"}`;
  const card = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";
  const label = "block text-sm font-medium text-foreground";
  const req = <span className="text-red-500">*</span>;
  const hint = "mt-1 text-xs text-[color:var(--color-light-1)]";
  const errT = "mt-1 text-xs text-red-500";
  const addBtn = "rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]";
  const rmBtn = "rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]";

  /* ── TransportSection sub-render ──────────────── */
  const renderTransport = (labelText, state, setter) => (
    <div className="space-y-3 rounded-xl border border-black/5 bg-[color:var(--color-light-3)]/40 p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" checked={state.isEnabled} onChange={(e) => setter((p) => ({ ...p, isEnabled: e.target.checked }))} className="h-4 w-4" />
        {labelText}
      </label>
      {state.isEnabled && (
        <div className="space-y-3 pl-6">
          {state.seasons.map((s, si) => (
            <div key={si} className="grid grid-cols-2 gap-2 rounded-xl border border-black/10 bg-white p-3 md:grid-cols-6">
              <div>
                <div className="text-[11px] text-[color:var(--color-light-1)]">Start</div>
                <input type="date" value={s.startDate} onChange={(e) => updateSeason(setter, si, "startDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" />
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--color-light-1)]">End</div>
                <input type="date" value={s.endDate} onChange={(e) => updateSeason(setter, si, "endDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" />
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--color-light-1)]">Adult</div>
                <input inputMode="decimal" value={s.adult} onChange={(e) => updateSeason(setter, si, "adult", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--color-light-1)]">Child</div>
                <input inputMode="decimal" value={s.child} onChange={(e) => updateSeason(setter, si, "child", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--color-light-1)]">Infant</div>
                <input inputMode="decimal" value={s.infant} onChange={(e) => updateSeason(setter, si, "infant", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => removeSeason(setter, si)} className={rmBtn}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addSeason(setter)} className={addBtn}>+ Add Season</button>
        </div>
      )}
    </div>
  );

  /* ── checkbox multi-select render ─────────────── */
  const renderMultiSelect = (labelText, options, selected, setter) => (
    <div>
      <div className={label}>{labelText}</div>
      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-black/10 bg-white p-3">
        {options.length === 0 ? (
          <p className="text-xs text-[color:var(--color-light-1)]">No options available</p>
        ) : (
          options.map((opt) => (
            <label key={opt._id} className="flex items-center gap-2 py-1 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.includes(opt._id)}
                onChange={() => toggleMulti(setter, opt._id)}
                className="h-4 w-4"
              />
              <span>{opt.name}</span>
              {opt.isActive === false && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">inactive</span>}
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && <p className={hint}>{selected.length} selected</p>}
    </div>
  );

  /* ── RENDER ───────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${tab === i ? "bg-black text-white" : "text-foreground hover:bg-[color:var(--color-light-3)]"}`}
          >
            {savedTabs.has(i) && (
              <svg className={`h-3.5 w-3.5 ${tab === i ? "text-emerald-300" : "text-emerald-500"}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Basic Info ─────────────────────── */}
      {tab === 0 && (
        <div className={card}>
          <h2 className="mb-4 text-base font-semibold text-foreground">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={label}>Title {req}</label>
              <input value={title} onChange={(e) => onTitleChange(e.target.value)} className={inp("title")} placeholder="Product title" maxLength={300} />
              {errors.title && <p className={errT}>{errors.title}</p>}
            </div>
            <div>
              <label className={label}>Slug</label>
              <input value={slug} onChange={(e) => onSlugChange(e.target.value)} className={inp("slug")} placeholder="auto-from-title" />
              <p className={hint}>Auto-generated. Lowercase with hyphens.</p>
            </div>
            <div>
              <label className={label}>Duration (Hours) {req}</label>
              <input type="number" min="0" step="0.5" value={duration} onChange={(e) => { setDuration(e.target.value); ce("duration"); }} className={inp("duration")} placeholder="e.g. 2, 3.5, 5" />
              {errors.duration && <p className={errT}>{errors.duration}</p>}
            </div>
            <div>
              <label className={label}>Base Price (AED) {req}</label>
              <input value={basePrice} onChange={(e) => { setBasePrice(e.target.value); ce("basePrice"); }} inputMode="decimal" className={inp("basePrice")} placeholder="0" />
              {errors.basePrice && <p className={errT}>{errors.basePrice}</p>}
            </div>
            <div>
              <label className={label}>Badge</label>
              <select value={badge} onChange={(e) => setBadge(e.target.value)} className={inp("")}>
                {BADGES.map((b) => <option key={b} value={b}>{BADGE_LABELS[b]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Languages</label>
              <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={inp("")} placeholder="English, Arabic, Hindi" />
              <p className={hint}>Comma-separated</p>
            </div>
            <div>
              <label className={label}>Min Participants</label>
              <input value={minP} onChange={(e) => setMinP(e.target.value)} inputMode="numeric" className={inp("")} placeholder="1" />
            </div>
            <div>
              <label className={label}>Max Participants</label>
              <input value={maxP} onChange={(e) => setMaxP(e.target.value)} inputMode="numeric" className={inp("")} placeholder="20" />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Short Description</label>
              <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} className={inp("")} placeholder="Brief summary" maxLength={1000} />
              <p className={`${hint} text-right`}>{shortDesc.length}/1000</p>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" /> Active
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={hasOffer} onChange={(e) => setHasOffer(e.target.checked)} className="h-4 w-4" /> Has Offer
              </label>
            </div>
            {hasOffer && (
              <>
                <div>
                  <label className={label}>Discount Type</label>
                  <select value={discType} onChange={(e) => setDiscType(e.target.value)} className={inp("")}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Discount Value</label>
                  <input value={discVal} onChange={(e) => setDiscVal(e.target.value)} inputMode="decimal" className={inp("")} placeholder="0" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 1: Media ──────────────────────────── */}
      {tab === 1 && (
        <div className="space-y-5">
          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Cover Image {!isEditing && req}</h2>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="md:w-2/3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">
                    Choose image
                    <input key={fileKey} type="file" accept="image/*" onChange={pickCover} className="sr-only" />
                  </label>
                  {coverFile ? (
                    <>
                      <span className="text-xs text-[color:var(--color-light-1)]">
                        <span className="font-medium text-foreground">{coverFile.name}</span> ({(coverFile.size / 1048576).toFixed(2)} MB)
                      </span>
                      <button type="button" onClick={clearCover} className={rmBtn}>Remove</button>
                    </>
                  ) : (
                    <span className="text-xs text-[color:var(--color-light-1)]">{coverUrl ? "Using existing image" : "No image selected"}</span>
                  )}
                </div>
                <p className={hint}>JPG, PNG, WebP, GIF. Max 10 MB.</p>
                {errors.coverFile && <p className={errT}>{errors.coverFile}</p>}
                {!coverFile && coverUrl && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-[color:var(--color-light-1)]">Image URL</label>
                    <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none" />
                  </div>
                )}
              </div>
              <div className="md:w-1/3">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <div className="mt-2 aspect-video w-full max-w-[200px] overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-light-3)]">
                  {coverPreview ? <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--color-light-1)]">No image</div>}
                </div>
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Gallery</h2>
            <p className={hint + " mb-3"}>Upload images for the product gallery.</p>

            {/* Upload button */}
            <div className="flex flex-wrap items-center gap-3">
              <label className={`inline-flex cursor-pointer items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)] ${galleryUploading ? "pointer-events-none opacity-60" : ""}`}>
                {galleryUploading ? "Uploading..." : "+ Upload Images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={galleryUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                    const valid = files.filter((f) => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
                    if (valid.length === 0) {
                      setErrors((p) => ({ ...p, gallery: "Only images (JPG, PNG, WebP, GIF) under 10 MB are allowed" }));
                      return;
                    }
                    ce("gallery");
                    setGalleryUploading(true);
                    const newUrls = [];
                    for (const file of valid) {
                      try {
                        const result = await uploadFileApi(file, "gallery", "gallery");
                        if (result?.url) newUrls.push(result.url);
                      } catch {
                        /* skip failed uploads silently */
                      }
                    }
                    if (newUrls.length > 0) setGallery((prev) => [...prev, ...newUrls]);
                    setGalleryUploading(false);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-[color:var(--color-light-1)]">
                {gallery.length} image{gallery.length !== 1 ? "s" : ""} in gallery
              </span>
            </div>
            {errors.gallery && <p className={errT}>{errors.gallery}</p>}
            <p className={hint}>JPG, PNG, WebP, GIF. Max 10 MB per image. Select multiple files at once.</p>

            {/* Gallery grid */}
            {gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {gallery.map((url, i) => (
                  <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-light-3)]">
                    <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                      title="Remove image"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100 truncate">
                      {i + 1} of {gallery.length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Relations ──────────────────────── */}
      {tab === 2 && (
        <div className="space-y-5">
          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Categories, Tags & Destination</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {renderMultiSelect("Categories", catOptions, selCategories, setSelCategories)}
              {renderMultiSelect("Tags", tagOptions, selTags, setSelTags)}
              <div>
                <label className={label}>Destination</label>
                <select value={selDest} onChange={(e) => setSelDest(e.target.value)} className={inp("")}>
                  <option value="">-- None --</option>
                  {destOptions.map((d) => <option key={d._id} value={d._id}>{d.name}{d.isActive === false ? " (inactive)" : ""}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Addons</h2>
            <p className={hint + " mb-3"}>Select addons in the order you want them displayed. Use arrows to reorder.</p>

            {/* Selected addons - shown in selection order */}
            {selAddons.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-foreground mb-2">Selected ({selAddons.length}) — drag order preserved</div>
                <div className="space-y-1.5">
                  {selAddons.map((id, idx) => {
                    const opt = addonOptions.find((o) => o._id === id);
                    if (!opt) return null;
                    return (
                      <div key={id} className="flex items-center gap-2 rounded-xl border border-black/10 bg-[color:var(--color-light-3)]/50 px-3 py-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">{idx + 1}</span>
                        {opt.image ? (
                          <img src={opt.image} alt={opt.name} className="h-8 w-8 shrink-0 rounded-lg object-cover border border-black/10" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[9px] text-[color:var(--color-light-1)]">—</div>
                        )}
                        <span className="flex-1 text-sm font-medium text-foreground truncate">{opt.name}</span>
                        <span className="text-xs text-[color:var(--color-light-1)]">AED {Number(opt.price || 0).toLocaleString()}</span>
                        <div className="flex items-center gap-0.5">
                          <button type="button" disabled={idx === 0} onClick={() => setSelAddons((prev) => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; })} className="rounded p-1 text-[color:var(--color-light-1)] hover:bg-black/5 disabled:opacity-30" title="Move up">↑</button>
                          <button type="button" disabled={idx === selAddons.length - 1} onClick={() => setSelAddons((prev) => { const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; })} className="rounded p-1 text-[color:var(--color-light-1)] hover:bg-black/5 disabled:opacity-30" title="Move down">↓</button>
                        </div>
                        <button type="button" onClick={() => toggleMulti(setSelAddons, id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-red-50" title="Remove">×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All available addons sorted by sortOrder */}
            <div className="text-xs font-semibold text-foreground mb-2">Available Addons</div>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-black/10 bg-white">
              {addonOptions.length === 0 ? (
                <p className="p-3 text-xs text-[color:var(--color-light-1)]">No addons available. Create addons first.</p>
              ) : (
                [...addonOptions]
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name || "").localeCompare(b.name || ""))
                  .map((opt) => {
                    const isSelected = selAddons.includes(opt._id);
                    return (
                      <label
                        key={opt._id}
                        className={`flex cursor-pointer items-center gap-3 border-b border-black/5 px-3 py-2.5 last:border-b-0 transition ${isSelected ? "bg-black/[0.03]" : "hover:bg-black/[0.02]"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMulti(setSelAddons, opt._id)}
                          className="h-4 w-4 shrink-0"
                        />
                        {opt.image ? (
                          <img src={opt.image} alt={opt.name} className="h-9 w-9 shrink-0 rounded-lg object-cover border border-black/10" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-light-3)] text-[9px] text-[color:var(--color-light-1)]">No img</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{opt.name}</div>
                          {opt.description && <div className="truncate text-[11px] text-[color:var(--color-light-1)]">{opt.description}</div>}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-foreground">AED {Number(opt.price || 0).toLocaleString()}</span>
                        {opt.isActive === false && <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">inactive</span>}
                      </label>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Content ────────────────────────── */}
      {tab === 3 && (
        <div className="space-y-5">
          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Overview</h2>
            <RichTextEditor
              value={overView}
              onChange={setOverView}
              placeholder="Detailed product overview (formatting supported)"
            />
          </div>
          {[
            { title: "Highlights", state: highlights, setter: setHighlights },
            { title: "Inclusions", state: inclusions, setter: setInclusions },
            { title: "Exclusions", state: exclusions, setter: setExclusions },
          ].map(({ title: t, state: s, setter }) => (
            <div key={t} className={card}>
              <h2 className="mb-3 text-base font-semibold text-foreground">{t}</h2>
              <div className="space-y-2">
                {s.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={v} onChange={(e) => updateItem(setter, i, e.target.value)} className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20" placeholder={`${t} item`} />
                    {s.length > 1 && <button type="button" onClick={() => removeItem(setter, i)} className={rmBtn}>Remove</button>}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addItem(setter)} className={addBtn + " mt-3"}>+ Add {t.slice(0, -1)}</button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: Itinerary ──────────────────────── */}
      {tab === 4 && (
        <div className={card}>
          <h2 className="mb-4 text-base font-semibold text-foreground">Itinerary</h2>
          <div className="space-y-3">
            {itinerary.map((it, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-[color:var(--color-light-3)]/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Step {i + 1}</span>
                  {itinerary.length > 1 && <button type="button" onClick={() => removeObj(setItinerary, i)} className={rmBtn}>Remove</button>}
                </div>
                <input value={it.title} onChange={(e) => updateObj(setItinerary, i, "title", e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20" placeholder="Step title" />
                <textarea value={it.description} onChange={(e) => updateObj(setItinerary, i, "description", e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20" placeholder="Step description (HTML supported)" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addObj(setItinerary, { title: "", description: "" })} className={addBtn + " mt-3"}>+ Add Step</button>
        </div>
      )}

      {/* ── TAB 5: FAQs & Buttons ─────────────────── */}
      {tab === 5 && (
        <div className="space-y-5">
          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">FAQs</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-xl border border-black/10 bg-[color:var(--color-light-3)]/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">FAQ {i + 1}</span>
                    {faqs.length > 1 && <button type="button" onClick={() => removeObj(setFaqs, i)} className={rmBtn}>Remove</button>}
                  </div>
                  <input value={f.question} onChange={(e) => updateObj(setFaqs, i, "question", e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="Question" />
                  <textarea value={f.answer} onChange={(e) => updateObj(setFaqs, i, "answer", e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="Answer" />
                  <input value={f.link} onChange={(e) => updateObj(setFaqs, i, "link", e.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="Link (optional)" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addObj(setFaqs, { question: "", answer: "", link: "" })} className={addBtn + " mt-3"}>+ Add FAQ</button>
          </div>

          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">CTA Buttons</h2>
            <div className="space-y-3">
              {buttons.map((b, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-black/10 bg-[color:var(--color-light-3)]/40 p-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <div className="text-[11px] text-[color:var(--color-light-1)]">Label</div>
                    <input value={b.label} onChange={(e) => updateObj(setButtons, i, "label", e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="Button label" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-[color:var(--color-light-1)]">URL</div>
                    <input value={b.url} onChange={(e) => updateObj(setButtons, i, "url", e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="https://..." />
                  </div>
                  <button type="button" onClick={() => removeObj(setButtons, i)} className={rmBtn}>Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addObj(setButtons, { label: "", url: "" })} className={addBtn + " mt-3"}>+ Add Button</button>
          </div>
        </div>
      )}

      {/* ── TAB 6: Transportation ─────────────────── */}
      {tab === 6 && (
        <div className={card}>
          <h2 className="mb-4 text-base font-semibold text-foreground">Transportation</h2>
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            Enable shared, private, or direct transportation — or use fallback pricing if none are enabled.
          </div>
          <div className="space-y-4">
            {/* Direct */}
            {renderTransport("Direct Transfer", tDirect, setTDirect)}

            {/* Shared */}
            {renderTransport("Shared Transfer", tShared, setTShared)}

            {/* ── Private Transfer ─────────────────────── */}
            <div className="space-y-3 rounded-xl border border-black/5 bg-[color:var(--color-light-3)]/40 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={tPrivate.isEnabled} onChange={(e) => setTPrivate((p) => ({ ...p, isEnabled: e.target.checked }))} className="h-4 w-4" />
                Private Transfer
              </label>
              {tPrivate.isEnabled && (
                <div className="space-y-3 pl-6">
                  {tPrivate.seasons.map((s, si) => {
                    const maxP = getMaxPeople(s.vehicleName);
                    return (
                      <div key={si} className="rounded-xl border border-black/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Season {si + 1}</span>
                          {tPrivate.seasons.length > 1 && <button type="button" onClick={() => removePrivateSeason(si)} className={rmBtn}>Remove</button>}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-[color:var(--color-light-1)]">Start Date</div>
                            <input type="date" value={s.startDate} onChange={(e) => updatePrivateSeason(si, "startDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs" />
                          </div>
                          <div>
                            <div className="text-[11px] text-[color:var(--color-light-1)]">End Date</div>
                            <input type="date" value={s.endDate} onChange={(e) => updatePrivateSeason(si, "endDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs" />
                          </div>
                        </div>

                        {/* Vehicle */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-[color:var(--color-light-1)]">Vehicle Type</div>
                            <select value={s.vehicleName} onChange={(e) => onVehicleChange(si, e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs">
                              <option value="4-seater">4-Seater Vehicle</option>
                              <option value="6-seater">6-Seater Vehicle</option>
                            </select>
                          </div>
                          <div>
                            <div className="text-[11px] text-[color:var(--color-light-1)]">Vehicle Description</div>
                            <input value={s.vehicleDesc} onChange={(e) => updatePrivateSeason(si, "vehicleDesc", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs" placeholder="e.g. Land Cruiser" />
                          </div>
                        </div>

                        {/* Pricing by people */}
                        <div className="mt-3">
                          <div className="text-[11px] font-semibold text-foreground mb-2">Pricing by Number of People</div>
                          <div className="space-y-2">
                            {(s.pricing || []).map((row, pi) => (
                              <div key={pi} className="flex items-center gap-3">
                                <span className="w-24 text-xs text-foreground">{row.people} {Number(row.people) === 1 ? "Person" : "People"}</span>
                                <div className="flex-1">
                                  <input inputMode="decimal" value={row.price} onChange={(e) => updatePricingRow(si, pi, "price", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs" placeholder="0" />
                                </div>
                                <span className="text-[10px] text-[color:var(--color-light-1)]">AED</span>
                                {s.pricing.length > 1 && (
                                  <button type="button" onClick={() => removePricingRow(si, pi)} className={rmBtn}>×</button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => addPricingRow(si)}
                            disabled={s.pricing.length >= maxP}
                            className={addBtn + " mt-2 disabled:opacity-40"}
                          >
                            + Add Pricing Option ({s.pricing.length}/{maxP})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" onClick={addPrivateSeason} className={addBtn}>+ Add Season</button>
                </div>
              )}
            </div>

            {/* Fallback */}
            <div className="space-y-3 rounded-xl border border-black/5 bg-[color:var(--color-light-3)]/40 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={tFallback.isEnabled} onChange={(e) => { if (!anyTransportEnabled || !e.target.checked) setTFallback((p) => ({ ...p, isEnabled: e.target.checked })); }} className="h-4 w-4" />
                Fallback Pricing
                {anyTransportEnabled && <span className="text-[10px] text-[color:var(--color-light-1)]">(disabled when other types are enabled)</span>}
              </label>
              {tFallback.isEnabled && (
                <div className="space-y-3 pl-6">
                  {tFallback.seasons.map((s, si) => (
                    <div key={si} className="grid grid-cols-2 gap-2 rounded-xl border border-black/10 bg-white p-3 md:grid-cols-6">
                      <div>
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Start</div>
                        <input type="date" value={s.startDate} onChange={(e) => updateSeason(setTFallback, si, "startDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" />
                      </div>
                      <div>
                        <div className="text-[11px] text-[color:var(--color-light-1)]">End</div>
                        <input type="date" value={s.endDate} onChange={(e) => updateSeason(setTFallback, si, "endDate", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" />
                      </div>
                      <div>
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Adult</div>
                        <input inputMode="decimal" value={s.adult} onChange={(e) => updateSeason(setTFallback, si, "adult", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
                      </div>
                      <div>
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Child</div>
                        <input inputMode="decimal" value={s.child} onChange={(e) => updateSeason(setTFallback, si, "child", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
                      </div>
                      <div>
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Infant</div>
                        <input inputMode="decimal" value={s.infant} onChange={(e) => updateSeason(setTFallback, si, "infant", e.target.value)} className="w-full rounded-lg border border-black/10 px-2 py-1 text-xs" placeholder="0" />
                      </div>
                      <div className="flex items-end">
                        {tFallback.seasons.length > 1 && <button type="button" onClick={() => removeSeason(setTFallback, si)} className={rmBtn}>Remove</button>}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addSeason(setTFallback)} className={addBtn}>+ Add Season</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: Cancellation & SEO ─────────────── */}
      {tab === 7 && (
        <div className="space-y-5">
          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Cancellation Policy</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={label}>Free Cancellation Period (Days)</label>
                <input type="number" min="0" step="1" value={cancelPeriod} onChange={(e) => setCancelPeriod(e.target.value)} className={inp("")} placeholder="e.g. 7" />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Cancellation Terms</label>
                <textarea value={cancelTerms} onChange={(e) => setCancelTerms(e.target.value)} rows={3} className={inp("")} placeholder="Cancellation terms and conditions" />
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-4 text-base font-semibold text-foreground">SEO</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={label}>Meta Title</label>
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inp("")} placeholder="SEO title" maxLength={200} />
              </div>
              <div>
                <label className={label}>Meta Description</label>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={inp("")} placeholder="SEO description" maxLength={500} />
                <p className={`${hint} text-right`}>{seoDesc.length}/500</p>
              </div>
              <div>
                <label className={label}>Keywords</label>
                <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className={inp("")} placeholder="keyword1, keyword2, keyword3" />
                <p className={hint}>Comma-separated keywords</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/products" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Cancel</Link>
        <div className="flex items-center gap-3">
          {tab < TABS.length - 1 && (
            <button
              type="button"
              onClick={handleNextTab}
              disabled={savingTab}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-60"
            >
              {savingTab && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              )}
              {savingTab ? "Saving..." : "Next Tab →"}
            </button>
          )}
          <button type="submit" disabled={submitting || savingTab} className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
