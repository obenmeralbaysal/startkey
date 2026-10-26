"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  canApproveEarnings,
  canDeleteRecords,
  canManageRates,
  canVerify,
  integrationLinks,
  roleOf,
  settingsLinks,
  settingsPageAccess,
} from "@/components/portal/office/access";
import { OfficeError, officeCall, one, rows, text, type OfficeRecord } from "@/components/portal/office/api";
import { OfficeDashboard } from "@/components/portal/office/dashboard";
import { OfficeSettingsForm } from "@/components/portal/office/office-settings-form";
import { TeamSettings } from "@/components/portal/office/team-settings";
import { ConfirmButton, PageFrame, PasswordInput, RecordTable, RecordView, useOffice } from "@/components/portal/office/ui";
import { hasWatermarkedMedia, isWatermarkedImage, mediaThumb, portfolioMedia, WatermarkBadge, WatermarkBanner } from "@/components/portal/office/watermark";
import { PORTAL_UX_COPY } from "@/content/portal-ux";
import { officeSectionDenied, withLang } from "@/lib/portal-ux";
import {
  classifySahibindenImportFailure,
  parseSahibindenListing,
  portfolioDraftFromImport,
  SAHIBINDEN_IMPORT_ERROR_TEXT,
  type PortfolioImportDraft,
  type SahibindenImportError,
} from "@/lib/sahibinden-listing";

export function OfficeWork({ parts }: { parts: string[] }) {
  const { office, locale } = useOffice();
  const [head, id] = parts;
  if (officeSectionDenied(parts, roleOf(office), office)) {
    return (
      <section className="glass-card">
        <p>{PORTAL_UX_COPY[locale].denied}</p>
      </section>
    );
  }
  if (!head) return <OfficeDashboard />;
  if (head === "contacts") return id === "new" ? <ContactForm /> : id ? <ContactDetail id={id} /> : <ContactList />;
  if (head === "portfolios") return id === "new" ? <PortfolioNew step={parts[2]} /> : id ? <PortfolioDetail id={id} /> : <PortfolioList />;
  if (head === "demands") return id === "new" ? <DemandForm /> : id ? <DemandDetail id={id} /> : <DemandList />;
  if (head === "matches") return <SimpleList title={PORTAL_UX_COPY[locale].matches} path="matches" />;
  if (head === "calendar") return <Calendar />;
  if (head === "earnings") return <Earnings />;
  if (head === "reports") return <SimpleList title={roleOf(office) === "agent" ? PORTAL_UX_COPY[locale].performance : PORTAL_UX_COPY[locale].reports} path="reports/closings" />;
  if (head === "collaborations") return <Collaborations />;
  if (head === "lease") return <Lease />;
  if (head === "branches") return <BranchList />;
  if (head === "settings") return <Settings parts={parts.slice(1)} />;
  return <p className="glass-muted">Bu bölüm yok.</p>;
}

function useData(path: string) {
  const { officeId, notice } = useOffice();
  const [data, setData] = useState<unknown>(undefined);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (path === "" || /(?:^|[?&])(?:city_id|district_id)=0(?:&|$)/.test(path)) {
      return;
    }
    let cancelled = false;
    officeCall(path, officeId)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((error: Error) => {
        if (!cancelled) setData((current: unknown) => (current === undefined ? null : current));
        notice(`Hata: ${error.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [path, officeId, notice, version]);
  return { data, reload: () => setVersion((value) => value + 1) };
}

function ContactList() {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("contacts");
  return (
    <PageFrame title={copy.contacts} action={<Link className="ux-create" href={withLang("/portal/office/contacts/new", locale)}>+ {copy.newContact}</Link>}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} href={(row) => withLang(`/portal/office/contacts/${row.id}`, locale)} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function ContactForm() {
  const { officeId, notice } = useOffice();
  return (
    <Form
      title="Yeni kişi"
      onSubmit={async (form) => {
        const payload = await officeCall("contacts", officeId, {
          method: "POST",
          body: { first_name: form.get("first_name"), last_name: form.get("last_name"), phone: form.get("phone"), email: form.get("email") || null },
        });
        notice("Kişi kaydedildi.");
        const id = one(payload)?.id;
        if (id) window.location.href = `/portal/office/contacts/${id}`;
      }}
    >
      <input name="first_name" placeholder="Ad" required />
      <input name="last_name" placeholder="Soyad" required />
      <input name="phone" placeholder="Telefon" required />
      <input name="email" type="email" placeholder="E-posta" />
    </Form>
  );
}

function ContactDetail({ id }: { id: string }) {
  const { officeId, office, notice } = useOffice();
  const item = useData(`contacts/${id}`);
  const role = roleOf(office);
  return (
    <section className="glass-card">
      <h2>Kişi</h2>
      <RecordView value={item.data} />
      <div className="glass-actions">
        <button className="glass-btn-lite" type="button" onClick={() => officeCall(`contacts/${id}/generate-intake-link`, officeId, { method: "POST", body: {} }).then((payload) => notice(String(one(payload)?.public_url ?? "Toplama bağlantısı hazır."))).catch((error: Error) => notice(`Hata: ${error.message}`))}>
          İlan toplama bağlantısı
        </button>
        {canDeleteRecords(role) ? (
          <ConfirmButton label="Sil" message="Kişi kalıcı olarak silinir." onConfirm={() => officeCall(`contacts/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/contacts"; }).catch((error: Error) => notice(`Hata: ${error.message}`))} />
        ) : null}
      </div>
    </section>
  );
}

function PortfolioList() {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("portfolios");
  return (
    <PageFrame title={copy.portfolios} action={<Link className="ux-create" href={withLang("/portal/office/portfolios/new", locale)}>+ {copy.newPortfolio}</Link>}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} href={(row) => withLang(`/portal/office/portfolios/${row.id}`, locale)} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function startDictation(onText: (text: string) => void): boolean {
  const host = window as unknown as {
    SpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null };
    webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null };
  };
  const Recognition = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  if (!Recognition) {
    return false;
  }
  const recognition = new Recognition();
  recognition.lang = "tr-TR";
  recognition.onresult = (event) => {
    const parts: string[] = [];
    for (let index = 0; index < event.results.length; index += 1) {
      parts.push(event.results[index][0].transcript);
    }
    onText(parts.join(" "));
  };
  recognition.start();
  return true;
}

function VoiceDraft({ kind }: { kind: "portfolio" | "demand" }) {
  const { officeId, notice } = useOffice();
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<OfficeRecord | null>(null);
  const resolved = draft && isRecord(draft.resolved) ? draft.resolved : null;

  async function createFromDraft() {
    if (!resolved) {
      return;
    }
    if (kind === "portfolio") {
      const contactId = Number(resolved.contact_id);
      const categoryId = Number(resolved.category_id);
      const cityId = Number(resolved.city_id);
      const districtId = Number(resolved.district_id);
      const neighborhoodId = Number(resolved.neighborhood_id);
      const price = Number(resolved.price);
      if (!contactId || !categoryId || !cityId || !districtId || !neighborhoodId || !price) {
        notice("Taslak hazır. Eksik alanları formdan tamamlayın.");
        return;
      }
      const payload = await officeCall("portfolios/quick", officeId, {
        method: "POST",
        body: {
          contact_id: contactId,
          category_id: categoryId,
          city_id: cityId,
          district_id: districtId,
          neighborhood_id: neighborhoodId,
          price,
          type: resolved.type === "rent" ? "rent" : "sale",
          title: resolved.title || null,
          attributes: isRecord(resolved.attributes) ? resolved.attributes : {},
        },
      });
      const id = one(payload)?.id;
      window.location.href = id ? `/portal/office/portfolios/${id}` : "/portal/office/portfolios";
      return;
    }
    const locations = Array.isArray(resolved.locations) ? resolved.locations.filter(isRecord) : [];
    const cityId = Number(locations[0]?.city_id ?? 0);
    const categories = Array.isArray(resolved.category_ids) ? resolved.category_ids : [];
    const categoryId = Number(categories[0] ?? 0);
    const contactId = Number(resolved.contact_id);
    if (!contactId || !categoryId || !cityId) {
      notice("Taslak hazır. Eksik alanları formdan tamamlayın.");
      return;
    }
    await officeCall("demands", officeId, {
      method: "POST",
      body: {
        contact_id: contactId,
        category_id: categoryId,
        type: resolved.portfolio_type === "rent" ? "rent" : "sale",
        min_price: resolved.min_price ? Number(resolved.min_price) : null,
        max_price: resolved.max_price ? Number(resolved.max_price) : null,
        locations: [{ city_id: cityId }],
        notes: resolved.notes || null,
      },
    });
    window.location.href = "/portal/office/demands";
  }

  return (
    <section className="glass-card" data-screen={kind === "portfolio" ? "portfolio-voice" : undefined}>
      <h3>Sesli taslak</h3>
      <textarea value={transcript} placeholder="Konuşma metni" onChange={(event) => setTranscript(event.target.value)} />
      <div className="glass-actions">
        <button className="glass-btn-lite" type="button" onClick={() => { if (!startDictation(setTranscript)) notice("Bu tarayıcı konuşmayı metne çeviremiyor. Metni yazabilirsiniz."); }}>Konuş</button>
        <button className="glass-btn-lite" type="button" onClick={() => {
          officeCall(kind === "portfolio" ? "portfolios/voice-draft" : "demands/voice-draft", officeId, { method: "POST", body: { transcript } })
            .then((payload) => { setDraft(one(payload)); notice("Taslak hazır."); })
            .catch((error: Error) => notice(`Hata: ${error.message}`));
        }}>Çözümle</button>
        {draft ? <button className="glass-btn" type="button" onClick={() => createFromDraft().catch((error: Error) => notice(`Hata: ${error.message}`))}>Taslağı kaydet</button> : null}
      </div>
      <RecordView value={draft} />
    </section>
  );
}

function ChunkedMedia({ id, onDone }: { id: string; onDone: () => void }) {
  const { officeId, notice } = useOffice();
  const [progress, setProgress] = useState("");

  async function send(file: File) {
    const fileType = file.type.startsWith("video/") ? "video" : "image";
    const max = fileType === "video" ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > max) {
      notice(fileType === "video" ? "Video 200 MB sınırını aşıyor." : "Görsel 10 MB sınırını aşıyor.");
      return;
    }
    const uploadId = crypto.randomUUID();
    const chunkSize = 2 * 1024 * 1024;
    const total = Math.max(1, Math.ceil(file.size / chunkSize));
    for (let index = 0; index < total; index += 1) {
      const form = new FormData();
      form.append("file", file.slice(index * chunkSize, (index + 1) * chunkSize), file.name);
      form.append("upload_id", uploadId);
      form.append("chunk_index", String(index));
      form.append("total_chunks", String(total));
      form.append("file_name", file.name);
      form.append("file_type", fileType);
      setProgress(`${index + 1}/${total}`);
      await officeCall(`portfolios/${id}/media/upload-chunk`, officeId, { method: "POST", form });
    }
    await officeCall(`portfolios/${id}/media/finalize-upload`, officeId, {
      method: "POST",
      body: { upload_id: uploadId, total_chunks: total, file_name: file.name, file_type: fileType, total_size: file.size },
    });
    setProgress("");
    notice("Dosya eklendi.");
    onDone();
  }

  return (
    <form className="glass-form" onSubmit={(event) => {
      event.preventDefault();
      const file = event.currentTarget.elements.namedItem("file");
      if (!(file instanceof HTMLInputElement) || !file.files?.[0]) {
        return;
      }
      send(file.files[0]).catch((error: Error) => { setProgress(""); notice(`Hata: ${error.message}`); });
    }}>
      <h3>Büyük dosya</h3>
      <input name="file" type="file" accept="image/*,video/mp4,video/webm" required />
      <button className="glass-btn-lite" type="submit">{progress ? `Yükleniyor ${progress}` : "Parça parça yükle"}</button>
    </form>
  );
}

function PortfolioNew({ step }: { step?: string }) {
  if (step === "manual") return <PortfolioForm />;
  if (step === "voice") return <VoiceDraft kind="portfolio" />;
  if (step === "sahibinden") return <SahibindenImport />;
  if (step) return <p className="glass-muted">Bu bölüm yok.</p>;
  return (
    <section className="glass-card" data-screen="portfolio-new">
      <h2>Yeni portföy</h2>
      <div className="portfolio-choice-grid">
        <Link className="portfolio-choice" href="/portal/office/portfolios/new/manual" data-choice="manual">
          <span className="portfolio-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M4 20h4l10.5-10.5-4-4L4 16v4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M13 6.5l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <strong>El ile</strong>
            <small>Alanları kendiniz doldurun</small>
          </span>
        </Link>
        <Link className="portfolio-choice" href="/portal/office/portfolios/new/voice" data-choice="voice">
          <span className="portfolio-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <strong>Sesle</strong>
            <small>Konuşarak taslak oluşturun</small>
          </span>
        </Link>
        <Link className="portfolio-choice" href="/portal/office/portfolios/new/sahibinden" data-choice="sahibinden">
          <span className="portfolio-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M10 14a4 4 0 0 0 5.7 0l2-2a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-2 2a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <strong>Sahibinden linkiyle</strong>
            <small>İlan adresinden formu doldurun</small>
          </span>
        </Link>
      </div>
    </section>
  );
}

function SahibindenImport() {
  const { officeId, notice } = useOffice();
  const [draft, setDraft] = useState<PortfolioImportDraft | null>(null);
  const [error, setError] = useState<SahibindenImportError | null>(null);
  const [pending, setPending] = useState(false);

  async function readListing(raw: string) {
    const parsed = parseSahibindenListing(raw);
    if (!parsed.ok) {
      setError("invalid");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const payload = await officeCall("portfolios/import/sahibinden", officeId, { method: "POST", body: { url: parsed.url } });
      setDraft(portfolioDraftFromImport(payload));
      notice("İlan okundu. Alanları kontrol edip kaydedin.");
    } catch (caught) {
      const status = caught instanceof OfficeError ? caught.status : 0;
      const message = caught instanceof Error ? caught.message : "";
      setError(classifySahibindenImportFailure(status, message));
    } finally {
      setPending(false);
    }
  }

  if (draft) {
    return <PortfolioForm draft={draft} />;
  }

  return (
    <section className="glass-card" data-screen="sahibinden-import" data-loading={pending ? "true" : "false"}>
      <h2>Sahibinden linkiyle</h2>
      <form className="glass-form" aria-busy={pending} onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        readListing(String(form.get("url") ?? "")).catch(() => setError("upstream"));
      }}>
        <input name="url" placeholder="sahibinden.com ilan adresi veya ilan numarası" required aria-invalid={error ? true : undefined} disabled={pending} />
        {error ? <p className="glass-notice" data-tone="error" role="alert" data-error={error}>{SAHIBINDEN_IMPORT_ERROR_TEXT[error]}</p> : null}
        <button className="glass-btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Okunuyor" : "Formu doldur"}</button>
      </form>
      <Link className="glass-link" href="/portal/office/portfolios/new">Seçenekler</Link>
    </section>
  );
}

function PortfolioForm({ draft }: { draft?: PortfolioImportDraft | null }) {
  const { officeId, notice } = useOffice();
  const contacts = useData("contacts?limit=100");
  const categories = useData("categories");
  const cities = useData("locations/cities");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [contactId, setContactId] = useState(draft?.contactId ?? "");
  const [categoryId, setCategoryId] = useState(draft?.categoryId ?? "");
  const [type, setType] = useState(draft?.type ?? "sale");
  const [price, setPrice] = useState(draft?.price ?? "");
  const [city, setCity] = useState(draft?.cityId ?? "");
  const [district, setDistrict] = useState(draft?.districtId ?? "");
  const [neighborhood, setNeighborhood] = useState(draft?.neighborhoodId ?? "");
  const districts = useData(city ? `locations/districts?city_id=${city}` : "");
  const neighborhoods = useData(district ? `locations/neighborhoods?district_id=${district}` : "");
  return (
    <div data-screen="portfolio-manual">
    <Form
      title="Yeni portföy"
      onSubmit={async (form) => {
        const payload = await officeCall("portfolios/quick", officeId, {
          method: "POST",
          body: {
            contact_id: Number(form.get("contact_id")),
            category_id: Number(form.get("category_id")),
            price: Number(form.get("price")),
            city_id: Number(form.get("city_id")),
            district_id: Number(form.get("district_id")),
            neighborhood_id: Number(form.get("neighborhood_id")),
            type: form.get("type"),
            title: form.get("title") || null,
          },
        });
        notice("Portföy taslağı açıldı.");
        const id = one(payload)?.id;
        if (id) window.location.href = `/portal/office/portfolios/${id}`;
      }}
    >
      <input name="title" placeholder="Başlık" value={title} onChange={(event) => setTitle(event.target.value)} />
      <select name="contact_id" required value={contactId} onChange={(event) => setContactId(event.target.value)}><option value="">Kişi</option>{rows(contacts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["first_name"])}</option>)}</select>
      <select name="category_id" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Kategori</option>{rows(categories.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="type" required value={type} onChange={(event) => setType(event.target.value === "rent" ? "rent" : "sale")}><option value="sale">Satılık</option><option value="rent">Kiralık</option></select>
      <input name="price" type="number" min="0" placeholder="Fiyat" required value={price} onChange={(event) => setPrice(event.target.value)} />
      <select name="city_id" required value={city} onChange={(event) => { setCity(event.target.value); setDistrict(""); setNeighborhood(""); }}><option value="">İl</option>{rows(cities.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="district_id" required value={district} onChange={(event) => { setDistrict(event.target.value); setNeighborhood(""); }}><option value="">İlçe</option>{rows(districts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="neighborhood_id" required value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}><option value="">Mahalle</option>{rows(neighborhoods.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
    </Form>
    </div>
  );
}

function requiredAtActive(definition: OfficeRecord, type: string): boolean {
  const sale = Array.isArray(definition.required_stages_sale) ? definition.required_stages_sale.map(String) : [];
  const rent = Array.isArray(definition.required_stages_rent) ? definition.required_stages_rent.map(String) : [];
  if (sale.length > 0 || rent.length > 0) {
    return (type === "rent" ? rent : sale).includes("active");
  }
  const stages = Array.isArray(definition.required_stages) ? definition.required_stages.map(String) : [];
  if (stages.length > 0) {
    return stages.includes("active");
  }
  return definition.is_required === true;
}

function choiceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter((item) => item !== "");
  }
  if (typeof value !== "string" || value === "") {
    return [];
  }
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return [];
    }
  }
  return value.split(";").map((item) => item.trim()).filter((item) => item !== "");
}

function storedAttribute(portfolio: OfficeRecord, definitionId: number): string {
  if (!Array.isArray(portfolio.attributes)) {
    return "";
  }
  for (const attribute of portfolio.attributes) {
    if (isRecord(attribute) && Number(attribute.definition_id) === definitionId && attribute.value != null) {
      return String(attribute.value);
    }
  }
  return "";
}

function isRecord(value: unknown): value is OfficeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function PortfolioCompletion({ id, portfolio, onSaved }: { id: string; portfolio: OfficeRecord | null; onSaved: () => void }) {
  const { officeId, notice } = useOffice();
  const status = String(portfolio?.status ?? "");
  const type = String(portfolio?.type ?? "sale");
  const categoryId = Number(portfolio?.category_id ?? 0);
  const definitions = useData(categoryId > 0 ? `categories/${categoryId}/attributes?type=${type}` : "");
  const requirements = useData(`portfolios/${id}/compliance-requirements?stage=activate`);
  const [values, setValues] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File | null>>({});

  const definitionRows = rows(definitions.data).filter((definition) => {
    const scope = String(definition.scope ?? "property");
    const owner = definition.office_id;
    const listingType = definition.listing_type;
    if (scope === "complex") {
      return false;
    }
    if (owner != null && owner !== "" && Number(owner) !== officeId) {
      return false;
    }
    if (listingType != null && listingType !== "" && listingType !== type) {
      return false;
    }
    if (!requiredAtActive(definition, type)) {
      return false;
    }
    if (definition.parent_id) {
      const parentValue = values[Number(definition.parent_id)] ?? "";
      return parentValue !== "" && parentValue === String(definition.show_when_value ?? "");
    }
    return true;
  });

  useEffect(() => {
    if (!portfolio) {
      return;
    }
    const requirementData = one(requirements.data);
    const loadedRules = Array.isArray(requirementData?.rules) ? requirementData.rules.filter(isRecord) : [];
    setValues((current) => {
      const next = { ...current };
      for (const definition of rows(definitions.data)) {
        const definitionId = Number(definition.id);
        if (!next[definitionId]) {
          const stored = storedAttribute(portfolio, definitionId);
          if (stored !== "") {
            next[definitionId] = stored;
          }
        }
      }
      for (const row of loadedRules) {
        const rule = isRecord(row.rule) ? row.rule : null;
        const item = isRecord(row.item) ? row.item : null;
        if (!rule || !item || typeof item.submitted_value !== "string" || item.submitted_value === "") {
          continue;
        }
        const key = -Number(rule.id);
        if (!next[key]) {
          next[key] = item.submitted_value;
        }
      }
      return next;
    });
  }, [portfolio, definitions.data, requirements.data]);

  const requirementData = one(requirements.data);
  const rules = Array.isArray(requirementData?.rules) ? requirementData.rules.filter(isRecord) : [];
  const missing = isRecord(portfolio?.completeness) && Array.isArray(portfolio.completeness.missing_labels)
    ? portfolio.completeness.missing_labels.filter((label): label is string => typeof label === "string")
    : [];
  const listed = portfolio?.is_listed === true || portfolio?.is_listed === 1;
  if (!portfolio || status === "closed" || status === "pending_closing_approval" || (status === "active" && listed && missing.length === 0)) {
    return null;
  }

  async function saveFields(form: FormData) {
    const attributes = definitionRows.flatMap((definition) => {
      const definitionId = Number(definition.id);
      const value = values[definitionId] ?? "";
      return value === "" ? [] : [{ definition_id: definitionId, value }];
    });
    if (attributes.length > 0) {
      await officeCall("portfolio-attributes", officeId, {
        method: "POST",
        body: { portfolio_id: Number(id), attributes },
      });
    }
    const eidsCode = String(form.get("eids_code") ?? "");
    const eidsExpiry = String(form.get("eids_expires_at") ?? "");
    if (eidsCode !== "" || eidsExpiry !== "") {
      await officeCall(`portfolios/${id}`, officeId, {
        method: "PUT",
        body: {
          ...(eidsCode !== "" ? { eids_code: eidsCode } : {}),
          ...(eidsExpiry !== "" ? { eids_expires_at: eidsExpiry } : {}),
        },
      });
    }
  }

  async function submitCompliance() {
    const items: Record<string, { value?: string }> = {};
    const documents = new FormData();
    documents.append("stage", "activate");
    let filesAttached = false;
    for (const row of rules) {
      const rule = isRecord(row.rule) ? row.rule : null;
      if (!rule) {
        continue;
      }
      const ruleId = Number(rule.id);
      const value = values[-ruleId] ?? "";
      const file = files[ruleId];
      if (value === "" && !file) {
        continue;
      }
      if (value !== "") {
        items[String(ruleId)] = { value };
        documents.append(`items[${ruleId}][value]`, value);
      }
      if (file) {
        documents.append(`items[${ruleId}][file]`, file);
        filesAttached = true;
      }
    }
    if (Object.keys(items).length === 0 && !filesAttached) {
      return false;
    }
    const payload = filesAttached
      ? await officeCall(`portfolios/${id}/compliance-submit`, officeId, { method: "POST", form: documents })
      : await officeCall(`portfolios/${id}/compliance-submit`, officeId, { method: "POST", body: { stage: "activate", items } });
    notice(typeof payload.message === "string" ? payload.message : "Evraklar kaydedildi.");
    return true;
  }

  return (
    <form className="glass-form" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const publish = event.nativeEvent.submitter?.getAttribute("name") === "publish";
      saveFields(form).then(async () => {
        if (!publish) {
          notice("Alanlar kaydedildi.");
          onSaved();
          return;
        }
        if (status === "active") {
          await officeCall(`portfolios/${id}`, officeId, { method: "PUT", body: { is_listed: true } });
          notice("İlan yayına alındı.");
          onSaved();
          return;
        }
        try {
          const payload = await officeCall(`portfolios/${id}/status`, officeId, { method: "POST", body: { status: "active" } });
          notice(typeof payload.message === "string" ? payload.message : "Portföy aktife alındı.");
        } catch (error) {
          const onlyDocuments = error instanceof OfficeError && error.kinds.length > 0 && error.kinds.every((kind) => kind.startsWith("dynamic_rule_"));
          if (!onlyDocuments || !(await submitCompliance())) {
            throw error;
          }
        }
        onSaved();
      }).catch((error: Error) => notice(`Hata: ${error.message}`));
    }}>
      <h3>Yayın için eksikler</h3>
      {missing.length > 0 ? <p className="glass-muted">{missing.join(", ")}</p> : null}
      {definitionRows.map((definition) => {
        const definitionId = Number(definition.id);
        const inputType = String(definition.input_type ?? definition.type ?? "text");
        const choices = choiceList(definition.options);
        const value = values[definitionId] ?? "";
        if (inputType === "select" && choices.length > 0) {
          return (
            <select key={definitionId} value={value} onChange={(event) => setValues((current) => ({ ...current, [definitionId]: event.target.value }))}>
              <option value="">{String(definition.label ?? "Alan")}</option>
              {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
            </select>
          );
        }
        if (inputType === "boolean" || inputType === "checkbox") {
          return (
            <label key={definitionId}>
              <input type="checkbox" checked={value === "1"} onChange={(event) => setValues((current) => ({ ...current, [definitionId]: event.target.checked ? "1" : "" }))} />
              {String(definition.label ?? "Alan")}
            </label>
          );
        }
        return (
          <input
            key={definitionId}
            type={inputType === "number" ? "number" : "text"}
            placeholder={String(definition.label ?? "Alan")}
            value={value}
            onChange={(event) => setValues((current) => ({ ...current, [definitionId]: event.target.value }))}
          />
        );
      })}
      {rules.map((row) => {
        const rule = isRecord(row.rule) ? row.rule : null;
        if (!rule || rule.is_required !== true) {
          return null;
        }
        const ruleId = Number(rule.id);
        const inputType = String(rule.input_type ?? "text");
        if (inputType === "file") {
          return (
            <label key={ruleId}>
              {String(rule.label ?? "Evrak")}
              <input type="file" accept="image/*,application/pdf" onChange={(event) => setFiles((current) => ({ ...current, [ruleId]: event.target.files?.[0] ?? null }))} />
            </label>
          );
        }
        return (
          <input
            key={ruleId}
            type={inputType === "date" ? "date" : inputType === "number" ? "number" : "text"}
            placeholder={String(rule.label ?? "Evrak")}
            value={values[-ruleId] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [-ruleId]: event.target.value }))}
          />
        );
      })}
      <input name="eids_code" placeholder="EİDS yetki kodu" defaultValue={typeof portfolio.eids_code === "string" ? portfolio.eids_code : ""} />
      <input name="eids_expires_at" type="date" defaultValue={typeof portfolio.eids_expires_at === "string" ? portfolio.eids_expires_at.slice(0, 10) : ""} />
      <div className="glass-actions">
        <button className="glass-btn-lite" type="submit">Kaydet</button>
        <button className="glass-btn" name="publish" type="submit">{status === "active" ? "Sitede yayınla" : "Aktife al"}</button>
      </div>
    </form>
  );
}

function withoutGallery(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (isRecord(value.data)) {
    return { ...value, data: stripGallery(value.data) };
  }
  return stripGallery(value);
}

function stripGallery(row: OfficeRecord): OfficeRecord {
  const copy = { ...row };
  delete copy.media;
  delete copy.images;
  delete copy.photos;
  return copy;
}

function PortfolioGallery({ portfolio }: { portfolio: OfficeRecord | null }) {
  const items = portfolioMedia(portfolio);
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="portfolio-media">
      {items.map((item, index) => {
        const src = mediaThumb(item);
        return (
          <li key={String(item.id ?? index)}>
            {src ? <img alt="" src={src} /> : null}
            <WatermarkBadge flagged={isWatermarkedImage(item)} />
          </li>
        );
      })}
    </ul>
  );
}

function PortfolioDetail({ id }: { id: string }) {
  const { officeId, office, notice } = useOffice();
  const item = useData(`portfolios/${id}`);
  const role = roleOf(office);
  async function act(path: string, body?: unknown) {
    try {
      const payload = await officeCall(path, officeId, { method: "POST", body: body ?? {} });
      notice(typeof payload.message === "string" ? payload.message : "Kaydedildi.");
      item.reload();
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : "İşlem tamamlanamadı."}`);
    }
  }
  const portfolio = one(item.data);
  return (
    <section className="glass-card">
      <h2>Portföy</h2>
      <WatermarkBanner show={hasWatermarkedMedia(portfolio)} />
      <PortfolioGallery portfolio={portfolio} />
      <RecordView value={withoutGallery(item.data)} />
      <PortfolioCompletion id={id} portfolio={one(item.data)} onSaved={() => item.reload()} />
      <div className="glass-actions">
        {canVerify(office) ? <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/approve`)}>Onayla</button> : null}
        <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/generate-showcase-link`)}>Vitrin bağlantısı</button>
        {canDeleteRecords(role) ? <ConfirmButton label="Sil" message="Portföy kalıcı olarak silinir." onConfirm={() => officeCall(`portfolios/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/portfolios"; }).catch((error: Error) => notice(`Hata: ${error.message}`))} /> : null}
      </div>
      <form className="glass-form" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        act(`portfolios/${id}/import/sahibinden/apply`, { url: form.get("url") });
      }}>
        <input name="url" placeholder="Sahibinden ilan adresi" required />
        <button className="glass-btn-lite" type="submit">Sahibinden üzerinden doldur</button>
      </form>
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        officeCall(`portfolios/${id}/media`, officeId, { method: "POST", form }).then(() => { notice("Görsel eklendi."); item.reload(); }).catch((error: Error) => notice(`Hata: ${error.message}`));
      }}>
        <input name="files[]" type="file" accept="image/*,video/mp4,application/pdf" required />
        <button className="glass-btn-lite" type="submit">Dosya yükle</button>
      </form>
      <ChunkedMedia id={id} onDone={() => item.reload()} />
      {canVerify(office) ? (
        <Form title="Geri çevir" onSubmit={async (form) => { await act(`portfolios/${id}/reject`, { rejection_reason: form.get("rejection_reason") }); }}>
          <textarea name="rejection_reason" minLength={5} placeholder="Gerekçe" required />
        </Form>
      ) : null}
      <ClosingForm id={id} portfolio={one(item.data)} onDone={() => item.reload()} />
    </section>
  );
}

function ClosingForm({ id, portfolio, onDone }: { id: string; portfolio: OfficeRecord | null; onDone: () => void }) {
  const { officeId, office, notice } = useOffice();
  const status = String(portfolio?.status ?? "");
  const rent = String(portfolio?.type ?? "") === "rent";
  const stage = rent ? "close_rent" : "close_sale";
  const contacts = useData(status === "closed" || !portfolio ? "" : "contacts?limit=100");
  const demands = useData(status === "closed" || !portfolio ? "" : `portfolios/${id}/closable-demands`);
  const requirements = useData(status === "closed" || !portfolio ? "" : `portfolios/${id}/compliance-requirements?stage=${stage}`);
  const [values, setValues] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [result, setResult] = useState("success");
  const [coop, setCoop] = useState("none");
  const [demandPick, setDemandPick] = useState("");
  const demandDetail = useData(coop === "internal" && demandPick ? `demands/${demandPick}` : "");
  if (!portfolio || status === "closed") {
    return null;
  }
  if (status === "pending_closing_approval") {
    const canFinalize = Boolean(office?.can_verify_closings) || roleOf(office) === "owner";
    return (
      <section className="glass-card">
        <h3>Kapanış onayı</h3>
        <p className="glass-muted">Evraklar kontrol bekliyor.</p>
        {canFinalize ? <button className="glass-btn" type="button" onClick={() => officeCall(`portfolios/${id}/finalize-closing`, officeId, { method: "POST", body: {} }).then((payload) => { notice(typeof payload.message === "string" ? payload.message : "Kapanış onaylandı."); onDone(); }).catch((error: Error) => notice(`Hata: ${error.message}`))}>Kapanışı onayla</button> : null}
      </section>
    );
  }

  const requirementData = one(requirements.data);
  const rules = Array.isArray(requirementData?.rules) ? requirementData.rules.filter(isRecord) : [];
  const demandRecord = one(demandDetail.data);
  const agreements = Array.isArray(demandRecord?.showing_agreements) ? demandRecord.showing_agreements.filter(isRecord) : [];

  return (
    <form className="glass-form" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const send = async () => {
        if (result === "failure") {
          await officeCall(`portfolios/${id}/close`, officeId, {
            method: "POST",
            body: {
              result: "failure",
              cancellation_reason: form.get("cancellation_reason"),
              closed_at: form.get("closed_at") || null,
              note: form.get("note") || null,
            },
          });
          notice("Portföy kapatıldı.");
          onDone();
          return;
        }
        const buyerId = Number(form.get("buyer_id"));
        const price = Number(form.get("closing_price"));
        const commission = Number(form.get("closing_commission"));
        const demandId = Number(form.get("demand_id") || 0);
        const showingId = Number(form.get("showing_agreement_id") || 0);
        const closing = {
          buyer_id: buyerId,
          closing_price: price,
          closing_commission: commission,
          invoice_issued: form.get("invoice_issued") === "1",
          closed_at: form.get("closed_at"),
          deposit_amount: rent ? Number(form.get("deposit_amount") || 0) : null,
          demand_id: demandId || null,
          demand_commission: demandId ? Number(form.get("demand_commission") || commission) : null,
          coop_mode: coop,
          showing_agreement_id: coop === "internal" && showingId ? showingId : null,
          external_agency_broker: coop === "external" ? form.get("external_agency_broker") : null,
          external_agency_license: coop === "external" ? form.get("external_agency_license") : null,
          external_coop_split_percent: coop === "external" ? Number(form.get("external_coop_split_percent") || 0) : null,
        };
        if (rules.length === 0) {
          await officeCall(`portfolios/${id}/close`, officeId, {
            method: "POST",
            body: { result: "success", ...closing, note: form.get("note") || null },
          });
          notice("Portföy kapatıldı.");
          onDone();
          return;
        }
        const items: Record<string, { value?: string }> = {};
        const documents = new FormData();
        documents.append("stage", stage);
        for (const [key, value] of Object.entries(closing)) {
          if (value === null || value === undefined) {
            continue;
          }
          documents.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
        }
        let filesAttached = false;
        for (const row of rules) {
          const rule = isRecord(row.rule) ? row.rule : null;
          if (!rule || rule.is_required !== true) {
            continue;
          }
          const ruleId = Number(rule.id);
          const textValue = values[ruleId] ?? "";
          const file = files[ruleId];
          if (textValue !== "") {
            items[String(ruleId)] = { value: textValue };
            documents.append(`items[${ruleId}][value]`, textValue);
          }
          if (file) {
            documents.append(`items[${ruleId}][file]`, file);
            filesAttached = true;
          }
        }
        const payload = filesAttached
          ? await officeCall(`portfolios/${id}/compliance-submit`, officeId, { method: "POST", form: documents })
          : await officeCall(`portfolios/${id}/compliance-submit`, officeId, { method: "POST", body: { stage, items, ...closing } });
        notice(typeof payload.message === "string" ? payload.message : "Kapanış gönderildi.");
        onDone();
      };
      send().catch((error: Error) => notice(`Hata: ${error.message}`));
    }}>
      <h3>Kapanış</h3>
      <select value={result} onChange={(event) => setResult(event.target.value)}>
        <option value="success">{rent ? "Kiralandı" : "Satıldı"}</option>
        <option value="failure">Başarısız</option>
      </select>
      {result === "failure" ? (
        <textarea name="cancellation_reason" minLength={20} placeholder="İptal gerekçesi, en az 20 karakter" required />
      ) : (
        <>
          <select name="buyer_id" required defaultValue=""><option value="">Alıcı</option>{rows(contacts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["first_name"])}</option>)}</select>
          <input name="closing_price" type="number" min="0" step="0.01" placeholder="Kapanış fiyatı" required />
          <input name="closing_commission" type="number" min="0" step="0.01" placeholder="Hizmet bedeli" required />
          <select name="invoice_issued" defaultValue="0"><option value="0">Fatura yok</option><option value="1">Fatura var</option></select>
          {rent ? <input name="deposit_amount" type="number" min="0" step="0.01" placeholder="Depozito" required /> : null}
          <select name="demand_id" value={demandPick} required={coop === "internal"} onChange={(event) => setDemandPick(event.target.value)}><option value="">Talep</option>{rows(demands.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["title", "name"])}</option>)}</select>
          <input name="demand_commission" type="number" min="0" step="0.01" placeholder="Talep hizmet bedeli" />
          <select value={coop} onChange={(event) => setCoop(event.target.value)}>
            <option value="none">İşbirliği yok</option>
            <option value="internal">İç ofis</option>
            <option value="external">Dış ofis</option>
          </select>
          {coop === "internal" ? (
            <select name="showing_agreement_id" defaultValue="">
              <option value="">{agreements.length > 0 ? "Gösterim sözleşmesi" : "Bu talepte gösterim sözleşmesi yok"}</option>
              {agreements.map((row) => {
                const portfolioTitle = isRecord(row.portfolio) ? text(row.portfolio, ["title"]) : "";
                const when = typeof row.executed_at === "string" ? row.executed_at.slice(0, 10) : "";
                const label = [portfolioTitle, when].filter((part) => part !== "").join(" · ");
                return <option key={String(row.id)} value={String(row.id)}>{label || String(row.id)}</option>;
              })}
            </select>
          ) : null}
          {coop === "external" ? (
            <>
              <input name="external_agency_broker" placeholder="Dış ofis yetkilisi" required />
              <input name="external_agency_license" placeholder="Yetki belge no" required />
              <input name="external_coop_split_percent" type="number" min="0" max="100" step="0.01" placeholder="Paylaşım oranı" required />
            </>
          ) : null}
          {rules.map((row) => {
            const rule = isRecord(row.rule) ? row.rule : null;
            if (!rule || rule.is_required !== true) {
              return null;
            }
            const ruleId = Number(rule.id);
            const inputType = String(rule.input_type ?? "text");
            if (inputType === "file") {
              return (
                <label key={ruleId}>
                  {String(rule.label ?? "Evrak")}
                  <input type="file" accept="image/*,application/pdf" onChange={(event) => setFiles((current) => ({ ...current, [ruleId]: event.target.files?.[0] ?? null }))} />
                </label>
              );
            }
            return (
              <input
                key={ruleId}
                type={inputType === "date" ? "date" : inputType === "number" ? "number" : "text"}
                placeholder={String(rule.label ?? "Evrak")}
                value={values[ruleId] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [ruleId]: event.target.value }))}
              />
            );
          })}
        </>
      )}
      <input name="closed_at" type="date" required />
      <textarea name="note" placeholder="Not" />
      <button className="glass-btn" type="submit">Kapanışı gönder</button>
    </form>
  );
}

function DemandList() {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("demands");
  return (
    <PageFrame title={copy.demands} action={<Link className="ux-create" href={withLang("/portal/office/demands/new", locale)}>+ {copy.newDemand}</Link>}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} href={(row) => withLang(`/portal/office/demands/${row.id}`, locale)} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function DemandForm() {
  const { officeId, notice } = useOffice();
  const contacts = useData("contacts?limit=100");
  const categories = useData("categories");
  const cities = useData("locations/cities");
  const me = useData("me");
  const [matchNetwork, setMatchNetwork] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !isRecord(me.data)) {
      return;
    }
    const user = isRecord(me.data.user) ? me.data.user : me.data;
    setMatchNetwork(user.demand_match_network_default === true || user.demand_match_network_default === 1);
    setReady(true);
  }, [me.data, ready]);

  return (
    <>
    <VoiceDraft kind="demand" />
    <Form
      title="Yeni talep"
      onSubmit={async (form) => {
        const cityId = Number(form.get("city_id"));
        await officeCall("demands", officeId, {
          method: "POST",
          body: {
            contact_id: Number(form.get("contact_id")),
            category_id: Number(form.get("category_id")),
            type: form.get("type"),
            min_price: form.get("min_price") ? Number(form.get("min_price")) : null,
            max_price: form.get("max_price") ? Number(form.get("max_price")) : null,
            locations: [{ city_id: cityId }],
            notes: form.get("notes") || null,
            match_network: matchNetwork,
          },
        });
        notice("Talep kaydedildi.");
        window.location.href = "/portal/office/demands";
      }}
    >
      <select name="contact_id" required defaultValue=""><option value="">Kişi</option>{rows(contacts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["first_name"])}</option>)}</select>
      <select name="category_id" required defaultValue=""><option value="">Kategori</option>{rows(categories.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="type" defaultValue="sale"><option value="sale">Satılık</option><option value="rent">Kiralık</option></select>
      <select name="city_id" required defaultValue=""><option value="">İl</option>{rows(cities.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <input name="min_price" type="number" placeholder="Alt fiyat" />
      <input name="max_price" type="number" placeholder="Üst fiyat" />
      <textarea name="notes" placeholder="Not" />
      <label>
        <input type="checkbox" checked={matchNetwork} onChange={(event) => setMatchNetwork(event.target.checked)} />
        Diğer StartKey portföyleri ile eşleşsin
      </label>
    </Form>
    </>
  );
}

function DemandDetail({ id }: { id: string }) {
  const { officeId, office, notice } = useOffice();
  const item = useData(`demands/${id}`);
  return (
    <section className="glass-card">
      <h2>Talep</h2>
      <RecordView value={item.data} />
      <div className="glass-actions">
        <button className="glass-btn-lite" type="button" onClick={() => officeCall(`demands/${id}/close-external`, officeId, { method: "POST", body: { result: "success" } }).then(() => item.reload()).catch((error: Error) => notice(`Hata: ${error.message}`))}>Kapat</button>
        {canDeleteRecords(roleOf(office)) ? <ConfirmButton label="Sil" message="Talep kalıcı olarak silinir." onConfirm={() => officeCall(`demands/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/demands"; }).catch((error: Error) => notice(`Hata: ${error.message}`))} /> : null}
      </div>
    </section>
  );
}

function Calendar() {
  const { officeId, notice, locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("appointments");
  return (
    <PageFrame title={copy.calendar}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} empty={copy.noAppointments} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
      <Form
        title="Randevu"
        onSubmit={async (form) => {
          await officeCall("appointments", officeId, { method: "POST", body: { title: form.get("title"), starts_at: form.get("starts_at") } });
          notice("Randevu kaydedildi.");
          list.reload();
        }}
      >
        <input name="title" placeholder="Başlık" required />
        <input name="starts_at" type="datetime-local" required />
      </Form>
    </PageFrame>
  );
}

function Earnings() {
  const { officeId, office, notice, locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("earnings");
  const role = roleOf(office);
  return (
    <PageFrame title={copy.earnings}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
      {rows(list.data).map((row) => (
        <article key={String(row.id)}>
          {canApproveEarnings(role) ? (
            <div className="glass-actions">
              <button className="glass-btn-lite" type="button" onClick={() => officeCall(`earnings/${row.id}/approve`, officeId, { method: "POST", body: {} }).then(() => list.reload()).catch((error: Error) => notice(`Hata: ${error.message}`))}>Onayla</button>
              <button className="glass-btn-lite" type="button" onClick={() => officeCall(`earnings/${row.id}/reject`, officeId, { method: "POST", body: {} }).then(() => list.reload()).catch((error: Error) => notice(`Hata: ${error.message}`))}>Reddet</button>
            </div>
          ) : null}
        </article>
      ))}
      {canManageRates(role) ? <Link className="glass-link" href="/portal/office/settings/rates">Oranlar</Link> : null}
      {canApproveEarnings(role) ? (
        <Form title="Hakediş kaydı" onSubmit={async (form) => {
          await officeCall("earnings", officeId, {
            method: "POST",
            body: {
              user_id: Number(form.get("user_id")),
              type: form.get("type"),
              category: form.get("category"),
              gross_amount: Number(form.get("gross_amount")),
              description: form.get("description") || null,
              period: form.get("period") || null,
            },
          });
          notice("Hakediş kaydedildi.");
          list.reload();
        }}>
          <input name="user_id" type="number" placeholder="Kullanıcı no" required />
          <select name="type" defaultValue="accrual"><option value="accrual">Tahakkuk</option><option value="payment">Ödeme</option><option value="advance">Avans</option><option value="adjustment">Düzeltme</option></select>
          <select name="category" defaultValue="sale"><option value="sale">Satış</option><option value="demand">Talep</option><option value="bonus">Prim</option><option value="other">Diğer</option></select>
          <input name="gross_amount" type="number" min="0.01" step="0.01" placeholder="Tutar" required />
          <input name="period" placeholder="Dönem YYYY-AA" />
          <input name="description" placeholder="Açıklama" />
        </Form>
      ) : null}
      <Form title="Mutabakat" onSubmit={async (form) => {
        await officeCall("earnings/reconciliations", officeId, {
          method: "POST",
          body: { user_id: Number(form.get("user_id")), period: form.get("period") },
        });
        notice("Mutabakat açıldı.");
        list.reload();
      }}>
        <input name="user_id" type="number" placeholder="Kullanıcı no" required />
        <input name="period" placeholder="Dönem YYYY-AA" required />
      </Form>
    </PageFrame>
  );
}

function Collaborations() {
  const { officeId, notice, locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("collaboration-requests");
  async function send(id: unknown, action: "accept" | "reject") {
    try {
      await officeCall(`collaboration-requests/${id}/${action}`, officeId, { method: "PUT", body: {} });
      list.reload();
    } catch (error) {
      notice(`Hata: ${error instanceof Error ? error.message : "İşlem tamamlanamadı."}`);
    }
  }
  return (
    <PageFrame title={copy.collaborations}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
      {rows(list.data).map((row) => (
        <div className="glass-actions" key={String(row.id)}>
          <span>{text(row, ["title", "name", "office_name"])}</span>
          <button className="glass-btn-lite" type="button" onClick={() => send(row.id, "accept")}>Kabul</button>
          <button className="glass-btn-lite" type="button" onClick={() => send(row.id, "reject")}>Red</button>
        </div>
      ))}
    </PageFrame>
  );
}

function Lease() {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("crm/lease-radar");
  return (
    <PageFrame title={copy.lease} description={copy.leaseDescription} crumb={[copy.office, copy.lease]}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} empty={copy.leaseEmpty} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function MatchmakingForm() {
  const { officeId, notice } = useOffice();
  const current = useData("office/matchmaking-weights");
  return (
    <section className="glass-card">
      <h2>Eşleşme</h2>
      <RecordView value={current.data} />
      <Form title="Skor" onSubmit={async (form) => {
        await officeCall("office/matchmaking-weights", officeId, {
          method: "POST",
          body: {
            min_match_score: Number(form.get("min_match_score")),
            price_weight: Number(form.get("price_weight")),
            size_weight: Number(form.get("size_weight")),
            weights: [],
          },
        });
        notice("Eşleşme kaydedildi.");
        current.reload();
      }}>
        <input name="min_match_score" type="number" min={0} max={100} placeholder="En düşük skor" required />
        <input name="price_weight" type="number" min={0} max={100} placeholder="Fiyat ağırlığı" required />
        <input name="size_weight" type="number" min={0} max={100} placeholder="Metrekare ağırlığı" required />
      </Form>
      <Form title="Özellik ağırlığı" onSubmit={async (form) => {
        const weight = String(form.get("match_weight") ?? "");
        await officeCall("office/matchmaking-weights", officeId, {
          method: "POST",
          body: {
            weights: [{
              attribute_definition_id: Number(form.get("attribute_definition_id")),
              match_weight: weight === "" ? null : Number(weight),
            }],
          },
        });
        notice("Ağırlık kaydedildi.");
        current.reload();
      }}>
        <input name="attribute_definition_id" type="number" placeholder="Özellik no" required />
        <input name="match_weight" type="number" min={0} max={100} placeholder="Ağırlık, boşsa varsayılan" />
      </Form>
    </section>
  );
}

function BadgeForm() {
  const { officeId, notice } = useOffice();
  const list = useData("badges");
  const activityTypes = useData("activity-types");
  const [metric, setMetric] = useState("closings");
  return (
    <section className="glass-card">
      <h2>Rozetler</h2>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} />
      <Form title="Rozet" onSubmit={async (form) => {
        await officeCall("badges", officeId, {
          method: "POST",
          body: {
            title: form.get("title"),
            description: form.get("description") || null,
            metric,
            activity_type_id: metric === "calendar_activity" ? Number(form.get("activity_type_id")) : null,
            threshold: Number(form.get("threshold")),
            period: form.get("period"),
          },
        });
        notice("Rozet kaydedildi.");
        list.reload();
      }}>
        <input name="title" placeholder="Başlık" required />
        <input name="description" placeholder="Açıklama" />
        <select name="metric" value={metric} onChange={(event) => setMetric(event.target.value)}>
          <option value="active_portfolios">Açık portföy</option>
          <option value="total_portfolios">Tüm portföy</option>
          <option value="contacts">Kişi</option>
          <option value="showings">Gösterim</option>
          <option value="closings">Kapanış</option>
          <option value="calendar_activity">Takvim</option>
        </select>
        {metric === "calendar_activity" ? (
          <select name="activity_type_id" required defaultValue="">
            <option value="">Etkinlik türü</option>
            {rows(activityTypes.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}
          </select>
        ) : null}
        <input name="threshold" type="number" min={1} placeholder="Eşik" required />
        <select name="period" defaultValue="monthly"><option value="monthly">Aylık</option><option value="quarterly">Üç aylık</option><option value="yearly">Yıllık</option></select>
      </Form>
    </section>
  );
}

function CommissionForm() {
  const { officeId, notice } = useOffice();
  const current = useData("commission-policy");
  const [tiers, setTiers] = useState<Array<{ threshold: string; rate: string }>>([]);
  return (
    <section className="glass-card">
      <h2>Hizmet bedeli</h2>
      <RecordView value={current.data} />
      <Form title="Kural" onSubmit={async (form) => {
        await officeCall("commission-policy", officeId, {
          method: "PUT",
          body: {
            period_unit: form.get("period_unit"),
            period_anchor: form.get("period_anchor"),
            starts_on: form.get("starts_on"),
            base_rate_percentage: Number(form.get("base_rate_percentage")),
            listing_scope: form.get("listing_scope"),
            requires_approval: form.get("requires_approval") === "1",
            tiers: tiers.flatMap((tier) => {
              const threshold = Number(tier.threshold);
              const rate = Number(tier.rate);
              return threshold > 0 ? [{ threshold_amount: threshold, rate_percentage: rate }] : [];
            }),
          },
        });
        notice("Hizmet bedeli kaydedildi.");
        current.reload();
      }}>
        {tiers.map((tier, index) => (
          <div key={index} className="glass-actions">
            <input value={tier.threshold} type="number" min="0.01" step="0.01" placeholder="Eşik tutar" onChange={(event) => setTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, threshold: event.target.value } : item))} />
            <input value={tier.rate} type="number" min="0" max="100" step="0.01" placeholder="Dilim oranı" onChange={(event) => setTiers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, rate: event.target.value } : item))} />
            <button className="glass-btn-lite" type="button" onClick={() => setTiers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Sil</button>
          </div>
        ))}
        <button className="glass-btn-lite" type="button" onClick={() => setTiers((current) => [...current, { threshold: "", rate: "" }])}>Dilim ekle</button>
        <select name="period_unit" defaultValue="monthly"><option value="monthly">Aylık</option><option value="yearly">Yıllık</option></select>
        <select name="period_anchor" defaultValue="calendar"><option value="calendar">Takvim</option><option value="anniversary">Yıldönümü</option></select>
        <input name="starts_on" type="date" required />
        <input name="base_rate_percentage" type="number" min={0} max={100} step="0.01" placeholder="Oran" required />
        <select name="listing_scope" defaultValue="all"><option value="all">Tümü</option><option value="sale">Satılık</option><option value="rent">Kiralık</option></select>
        <select name="requires_approval" defaultValue="0"><option value="0">Onaysız</option><option value="1">Onaylı</option></select>
      </Form>
    </section>
  );
}

function RateForm() {
  const { officeId, notice } = useOffice();
  const list = useData("earning-rates");
  return (
    <section className="glass-card">
      <h2>Hakediş oranları</h2>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} />
      <Form title="Oran" onSubmit={async (form) => {
        await officeCall("earning-rates", officeId, {
          method: "POST",
          body: {
            user_id: Number(form.get("user_id")),
            rate_type: form.get("rate_type"),
            rate_percentage: Number(form.get("rate_percentage")),
            effective_from: form.get("effective_from"),
            effective_to: form.get("effective_to") || null,
          },
        });
        notice("Oran kaydedildi.");
        list.reload();
      }}>
        <input name="user_id" type="number" placeholder="Kullanıcı no" required />
        <select name="rate_type" defaultValue="sale"><option value="sale">Satış</option><option value="demand">Talep</option></select>
        <input name="rate_percentage" type="number" min={0} max={100} step="0.01" placeholder="Oran" required />
        <input name="effective_from" type="date" required />
        <input name="effective_to" type="date" />
      </Form>
    </section>
  );
}

function SubscriptionForm() {
  const { officeId, notice } = useOffice();
  const current = useData("office/subscription");
  return (
    <section className="glass-card">
      <h2>Abonelik</h2>
      <RecordView value={current.data} />
      <Form title="Paket" onSubmit={async (form) => {
        await officeCall("office/subscription/upgrade", officeId, {
          method: "POST",
          body: { package_id: Number(form.get("package_id")), billing_interval: form.get("billing_interval") },
        });
        notice("Abonelik isteği kaydedildi.");
        current.reload();
      }}>
        <input name="package_id" type="number" placeholder="Paket no" required />
        <select name="billing_interval" defaultValue="month"><option value="month">Aylık</option><option value="year">Yıllık</option></select>
      </Form>
    </section>
  );
}

function BillingForm() {
  const current = useData("hq/office/billing");
  return (
    <section className="glass-card">
      <h2>Faturalar</h2>
      <RecordView value={current.data} />
    </section>
  );
}

function SimpleList({ title, path }: { title: string; path: string }) {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData(path);
  return (
    <PageFrame title={title}>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function Settings({ parts }: { parts: string[] }) {
  const { office, locale } = useOffice();
  const role = roleOf(office);
  const page = parts[0];
  const child = parts[1];
  if (!page) {
    const copy = PORTAL_UX_COPY[locale];
    return (
      <PageFrame title={copy.settings}>
        <div className="glass-grid" data-screen="office-settings">
          {settingsLinks(role, office).map(({ slug, label }) => (
            <Link key={slug} className="ux-card" href={withLang(`/portal/office/settings/${slug}`, locale)} data-settings={slug}>{label}</Link>
          ))}
        </div>
      </PageFrame>
    );
  }
  if (settingsPageAccess(page, role, office) === "deny") {
    return (
      <PageFrame title={PORTAL_UX_COPY[locale].settings}>
        <p data-screen="office-settings">{PORTAL_UX_COPY[locale].denied}</p>
      </PageFrame>
    );
  }
  if (page === "integrations") return child === "sahibinden" ? <Sellers /> : child ? <SettingsDenied /> : <Integrations />;
  if (page === "profile") return <ProfileForm />;
  if (page === "notifications") return <SimpleList title="Bildirimler" path="notifications" />;
  if (page === "duty") return <DutyForm />;
  if (page === "team") return <TeamSettings />;
  if (page === "office") return <OfficeSettingsForm />;
  if (page === "matchmaking") return <MatchmakingForm />;
  if (page === "badges") return <BadgeForm />;
  if (page === "commission") return <CommissionForm />;
  if (page === "rates") return <RateForm />;
  if (page === "subscription") return <SubscriptionForm />;
  if (page === "whatsapp") return <WhatsappForm />;
  if (page === "email") return <EmailForm />;
  if (page === "billing") return <BillingForm />;
  return <SettingsDenied />;
}

function SettingsDenied() {
  const { locale } = useOffice();
  return (
    <PageFrame title={PORTAL_UX_COPY[locale].settings}>
      <p data-screen="office-settings">{PORTAL_UX_COPY[locale].denied}</p>
    </PageFrame>
  );
}

function BranchList() {
  const { locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const list = useData("branches");
  const data = rows(list.data);
  return (
    <PageFrame title={copy.branches}>
      <RecordTable rows={data} loading={list.data === undefined} empty={copy.branchesEmpty} recordLabel={copy.record} summaryLabel={copy.summaryColumn} />
    </PageFrame>
  );
}

function Integrations() {
  const { office, locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  return (
    <PageFrame title={copy.tabIntegrations} crumb={[copy.settings, copy.tabIntegrations]}>
      <div className="glass-grid" data-screen="settings-integrations">
        {integrationLinks(roleOf(office), office).map(({ slug, href, label }) => (
          <Link key={slug} className="ux-card" href={withLang(href, locale)} data-settings={slug}>{label}</Link>
        ))}
      </div>
    </PageFrame>
  );
}

function ProfileForm() {
  const { officeId, notice } = useOffice();
  const me = useData("me");
  const [matchNetwork, setMatchNetwork] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !isRecord(me.data)) {
      return;
    }
    const user = isRecord(me.data.user) ? me.data.user : me.data;
    setMatchNetwork(user.demand_match_network_default === true || user.demand_match_network_default === 1);
    setReady(true);
  }, [me.data, ready]);

  return (
    <Form title="Profil" onSubmit={async (form) => {
      const body: OfficeRecord = {
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        phone: form.get("phone"),
        demand_match_network_default: matchNetwork,
      };
      const password = String(form.get("password") || "");
      if (password) body.password = password;
      await officeCall("profile", officeId, { method: "PUT", body });
      notice("Profil güncellendi.");
    }}>
      <input name="first_name" placeholder="Ad" required />
      <input name="last_name" placeholder="Soyad" required />
      <input name="phone" placeholder="Telefon" />
      <PasswordInput name="password" placeholder="Yeni şifre" autoComplete="new-password" />
      <label>
        <input type="checkbox" checked={matchNetwork} onChange={(event) => setMatchNetwork(event.target.checked)} />
        Yeni taleplerim diğer StartKey portföyleri ile eşleşsin
      </label>
    </Form>
  );
}

function DutyForm() {
  const { officeId, notice } = useOffice();
  const team = useData("team");
  const roster = useData("duty-roster");
  return (
    <section className="glass-card">
      <h2>Nöbet</h2>
      <RecordView value={roster.data} />
      <Form title="Günü yaz" onSubmit={async (form) => {
        await officeCall("duty-roster", officeId, { method: "PUT", body: { date: form.get("date"), branch_id: null, user_ids: [Number(form.get("user_id"))] } });
        notice("Nöbet yazıldı.");
        roster.reload();
      }}>
        <input name="date" type="date" required />
        <select name="user_id" required defaultValue=""><option value="">Kişi</option>{rows(team.data).map((row) => <option key={String(row.id ?? row.user_id)} value={String(row.user_id ?? row.id)}>{text(row, ["first_name", "name"])}</option>)}</select>
      </Form>
    </section>
  );
}


function WhatsappForm() {
  const { officeId, notice } = useOffice();
  const accounts = useData("whatsapp/accounts");
  return (
    <section className="glass-card">
      <h2>WhatsApp</h2>
      <RecordView value={accounts.data} />
      <Form title="Hesap" onSubmit={async (form) => {
        await officeCall("whatsapp/accounts", officeId, { method: "POST", body: { meta_phone_number_id: form.get("meta_phone_number_id"), meta_waba_id: form.get("meta_waba_id"), access_token: form.get("access_token") || null, phone_number: form.get("phone_number") || null } });
        notice("Hesap kaydedildi.");
        accounts.reload();
      }}>
        <input name="meta_phone_number_id" placeholder="Telefon numarası kimliği" required />
        <input name="meta_waba_id" placeholder="Hesap kimliği" required />
        <input name="phone_number" placeholder="Telefon" />
        <input name="access_token" placeholder="Erişim anahtarı" />
      </Form>
    </section>
  );
}

function EmailForm() {
  const { officeId, notice } = useOffice();
  const current = useData("office/imap-settings");
  return (
    <section className="glass-card">
      <h2>E-posta</h2>
      <RecordView value={current.data} />
      <Form title="Gelen kutusu" onSubmit={async (form) => {
        await officeCall("office/imap-settings", officeId, { method: "PUT", body: { host: form.get("host"), port: Number(form.get("port")), encryption: form.get("encryption"), username: form.get("username"), password: form.get("password") || null, is_active: true } });
        notice("Gelen kutusu kaydedildi.");
        current.reload();
      }}>
        <input name="host" placeholder="Sunucu" required />
        <input name="port" type="number" placeholder="Kapı" required />
        <select name="encryption" defaultValue="ssl"><option value="ssl">SSL</option><option value="tls">TLS</option><option value="none">Yok</option></select>
        <input name="username" placeholder="Kullanıcı" required />
        <PasswordInput name="password" placeholder="Şifre" autoComplete="new-password" />
      </Form>
    </section>
  );
}

function Sellers() {
  const { officeId } = useOffice();
  const list = useData(`offices/${officeId}/sahibinden-sellers`);
  return (
    <section className="glass-card" data-screen="settings-sahibinden">
      <h2>Sahibinden satıcıları</h2>
      <p className="glass-muted">Ofis Ayarları › Entegrasyonlar › Sahibinden</p>
      <RecordTable rows={rows(list.data)} loading={list.data === undefined} />
      <form onSubmit={(event) => { event.preventDefault(); officeCall(`offices/${officeId}/sahibinden-sellers/sync`, officeId, { method: "POST", body: {} }).then(() => list.reload()); }}>
        <button className="glass-btn-lite" type="submit">Satıcıları yenile</button>
      </form>
    </section>
  );
}

function Form({ title, onSubmit, children }: { title: string; onSubmit: (form: FormData) => Promise<void>; children: ReactNode }) {
  const { notice } = useOffice();
  const [pending, setPending] = useState(false);
  return (
    <form className="glass-form" onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      setPending(true);
      onSubmit(new FormData(event.currentTarget)).catch((error: Error) => notice(`Hata: ${error.message}`)).finally(() => setPending(false));
    }}>
      <h3>{title}</h3>
      {children}
      <button className="glass-btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Kaydediliyor" : "Kaydet"}</button>
    </form>
  );
}
