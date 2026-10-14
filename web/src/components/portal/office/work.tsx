"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  canApproveEarnings,
  canDeleteRecords,
  canDeleteTeam,
  canManageBadges,
  canManageCommission,
  canManageDuty,
  canManageMatchmaking,
  canManageRates,
  canManageTeam,
  canVerify,
  isManager,
  roleOf,
} from "@/components/portal/office/access";
import { officeCall, one, rows, text, type OfficeRecord } from "@/components/portal/office/api";
import { RecordTable, RecordView, useOffice } from "@/components/portal/office/ui";

export function OfficeWork({ parts }: { parts: string[] }) {
  const [head, id] = parts;
  if (!head) return <Home />;
  if (head === "contacts") return id === "new" ? <ContactForm /> : id ? <ContactDetail id={id} /> : <ContactList />;
  if (head === "portfolios") return id === "new" ? <PortfolioForm /> : id ? <PortfolioDetail id={id} /> : <PortfolioList />;
  if (head === "demands") return id === "new" ? <DemandForm /> : id ? <DemandDetail id={id} /> : <DemandList />;
  if (head === "matches") return <SimpleList title="Eşleşmeler" path="matches" />;
  if (head === "calendar") return <Calendar />;
  if (head === "earnings") return <Earnings />;
  if (head === "reports") return <SimpleList title="Kapanış raporları" path="reports/closings" />;
  if (head === "collaborations") return <Collaborations />;
  if (head === "lease") return <Lease />;
  if (head === "sahibinden") return <Sahibinden />;
  if (head === "settings") return <Settings page={id} />;
  return <p className="glass-muted">Bu bölüm yok.</p>;
}

function useData(path: string) {
  const { officeId, notice } = useOffice();
  const [data, setData] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    officeCall(path, officeId)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((error: Error) => notice(`Hata: ${error.message}`));
    return () => {
      cancelled = true;
    };
  }, [path, officeId, notice, version]);
  return { data, reload: () => setVersion((value) => value + 1) };
}

function Home() {
  const stats = useData("dashboard/stats");
  const pending = useData("dashboard/pending-approvals");
  const duty = useData("duty-roster/today");
  return (
    <div className="glass-grid">
      <section className="glass-card">
        <h2>Özet</h2>
        <RecordView value={stats.data} />
      </section>
      <section className="glass-card">
        <h2>Onay bekleyenler</h2>
        <RecordView value={pending.data} />
      </section>
      <section className="glass-card">
        <h2>Bugünün nöbeti</h2>
        <RecordView value={duty.data} />
      </section>
    </div>
  );
}

function ContactList() {
  const list = useData("contacts");
  return (
    <section className="glass-card">
      <div className="glass-top">
        <h2>Kişiler</h2>
        <a className="glass-btn-lite" href="/portal/office/contacts/new">Yeni kişi</a>
      </div>
      <RecordTable rows={rows(list.data)} href={(row) => `/portal/office/contacts/${row.id}`} />
    </section>
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
          <button className="glass-btn-danger" type="button" onClick={() => officeCall(`contacts/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/contacts"; }).catch((error: Error) => notice(`Hata: ${error.message}`))}>
            Sil
          </button>
        ) : null}
      </div>
    </section>
  );
}

function PortfolioList() {
  const list = useData("portfolios");
  return (
    <section className="glass-card">
      <div className="glass-top">
        <h2>Portföy</h2>
        <a className="glass-btn-lite" href="/portal/office/portfolios/new">Yeni portföy</a>
      </div>
      <RecordTable rows={rows(list.data)} href={(row) => `/portal/office/portfolios/${row.id}`} />
    </section>
  );
}

function PortfolioForm() {
  const { officeId, notice } = useOffice();
  const contacts = useData("contacts?limit=100");
  const categories = useData("categories");
  const cities = useData("locations/cities");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const districts = useData(city ? `locations/districts?city_id=${city}` : "locations/districts?city_id=0");
  const neighborhoods = useData(district ? `locations/neighborhoods?district_id=${district}` : "locations/neighborhoods?district_id=0");
  return (
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
      <input name="title" placeholder="Başlık" />
      <select name="contact_id" required defaultValue=""><option value="">Kişi</option>{rows(contacts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["first_name"])}</option>)}</select>
      <select name="category_id" required defaultValue=""><option value="">Kategori</option>{rows(categories.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="type" required defaultValue="sale"><option value="sale">Satılık</option><option value="rent">Kiralık</option></select>
      <input name="price" type="number" min="0" placeholder="Fiyat" required />
      <select name="city_id" required value={city} onChange={(event) => { setCity(event.target.value); setDistrict(""); }}><option value="">İl</option>{rows(cities.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="district_id" required value={district} onChange={(event) => setDistrict(event.target.value)}><option value="">İlçe</option>{rows(districts.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      <select name="neighborhood_id" required defaultValue=""><option value="">Mahalle</option>{rows(neighborhoods.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
    </Form>
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
  return (
    <section className="glass-card">
      <h2>Portföy</h2>
      <RecordView value={item.data} />
      <div className="glass-actions">
        {canVerify(office) ? (
          <>
            <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/approve`)}>Onayla</button>
            <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/reject`, { reason: "Eksik bilgi" })}>Geri çevir</button>
          </>
        ) : null}
        <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/generate-showcase-link`)}>Vitrin bağlantısı</button>
        <button className="glass-btn-lite" type="button" onClick={() => act(`portfolios/${id}/close`, { result: "success" })}>Kapat</button>
        {canDeleteRecords(role) ? <button className="glass-btn-danger" type="button" onClick={() => officeCall(`portfolios/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/portfolios"; }).catch((error: Error) => notice(`Hata: ${error.message}`))}>Sil</button> : null}
      </div>
      <form className="glass-stack" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        act(`portfolios/${id}/import/sahibinden/apply`, { url: form.get("url") });
      }}>
        <input name="url" placeholder="Sahibinden ilan adresi" required />
        <button className="glass-btn-lite" type="submit">Sahibinden'den doldur</button>
      </form>
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        officeCall(`portfolios/${id}/media`, officeId, { method: "POST", form }).then(() => { notice("Görsel eklendi."); item.reload(); }).catch((error: Error) => notice(`Hata: ${error.message}`));
      }}>
        <input name="files[]" type="file" accept="image/*,video/mp4,application/pdf" required />
        <button className="glass-btn-lite" type="submit">Dosya yükle</button>
      </form>
    </section>
  );
}

function DemandList() {
  const list = useData("demands");
  return (
    <section className="glass-card">
      <div className="glass-top">
        <h2>Talepler</h2>
        <a className="glass-btn-lite" href="/portal/office/demands/new">Yeni talep</a>
      </div>
      <RecordTable rows={rows(list.data)} href={(row) => `/portal/office/demands/${row.id}`} />
    </section>
  );
}

function DemandForm() {
  const { officeId, notice } = useOffice();
  const contacts = useData("contacts?limit=100");
  const categories = useData("categories");
  const cities = useData("locations/cities");
  return (
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
    </Form>
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
        {canDeleteRecords(roleOf(office)) ? <button className="glass-btn-danger" type="button" onClick={() => officeCall(`demands/${id}`, officeId, { method: "DELETE" }).then(() => { window.location.href = "/portal/office/demands"; }).catch((error: Error) => notice(`Hata: ${error.message}`))}>Sil</button> : null}
      </div>
    </section>
  );
}

function Calendar() {
  const { officeId, notice } = useOffice();
  const list = useData("appointments");
  return (
    <section className="glass-card">
      <h2>Takvim</h2>
      <RecordTable rows={rows(list.data)} />
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
    </section>
  );
}

function Earnings() {
  const { officeId, office, notice } = useOffice();
  const list = useData("earnings");
  const balance = useData("earnings/balance");
  const role = roleOf(office);
  return (
    <section className="glass-card">
      <h2>Hakediş</h2>
      <RecordView value={balance.data} />
      {rows(list.data).map((row) => (
        <article key={String(row.id)} className="glass-card">
          <RecordView value={row} />
          {canApproveEarnings(role) ? (
            <div className="glass-actions">
              <button className="glass-btn-lite" type="button" onClick={() => officeCall(`earnings/${row.id}/approve`, officeId, { method: "POST", body: {} }).then(() => list.reload()).catch((error: Error) => notice(`Hata: ${error.message}`))}>Onayla</button>
              <button className="glass-btn-lite" type="button" onClick={() => officeCall(`earnings/${row.id}/reject`, officeId, { method: "POST", body: {} }).then(() => list.reload()).catch((error: Error) => notice(`Hata: ${error.message}`))}>Reddet</button>
            </div>
          ) : null}
        </article>
      ))}
      {canManageRates(role) ? <a className="glass-link" href="/portal/office/settings/rates">Oranlar</a> : null}
    </section>
  );
}

function Collaborations() {
  const { officeId, notice } = useOffice();
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
    <section className="glass-card">
      <h2>İşbirlikleri</h2>
      {rows(list.data).map((row) => (
        <article key={String(row.id)}>
          <RecordView value={row} />
          <div className="glass-actions">
            <button className="glass-btn-lite" type="button" onClick={() => send(row.id, "accept")}>Kabul</button>
            <button className="glass-btn-lite" type="button" onClick={() => send(row.id, "reject")}>Red</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Lease() {
  const list = useData("crm/lease-radar");
  return (
    <section className="glass-card">
      <h2>Kira radarı</h2>
      <RecordTable rows={rows(list.data)} />
    </section>
  );
}

function Sahibinden() {
  const { officeId, notice } = useOffice();
  const [preview, setPreview] = useState<unknown>(null);
  return (
    <section className="glass-card">
      <h2>Sahibinden</h2>
      <Form
        title="İlan oku"
        onSubmit={async (form) => {
          const payload = await officeCall("portfolios/import/sahibinden", officeId, { method: "POST", body: { url: form.get("url") } });
          setPreview(payload);
          notice("İlan okundu. Portföy kaydı ayrıca açılır.");
        }}
      >
        <input name="url" placeholder="İlan adresi veya bağlantı" required />
      </Form>
      <RecordView value={preview} />
    </section>
  );
}

function SimpleList({ title, path }: { title: string; path: string }) {
  const list = useData(path);
  const data = rows(list.data);
  return (
    <section className="glass-card">
      <h2>{title}</h2>
      {data.length > 0 ? <RecordTable rows={data} /> : <RecordView value={list.data} />}
    </section>
  );
}

function Settings({ page }: { page?: string }) {
  const { office } = useOffice();
  const role = roleOf(office);
  if (page === "profile") return <ProfileForm />;
  if (page === "notifications") return <SimpleList title="Bildirimler" path="notifications" />;
  if (page === "duty" && canManageDuty(role)) return <DutyForm />;
  if (page === "team" && canManageTeam(role)) return <Team />;
  if (page === "office" && isManager(role)) return <OfficeForm />;
  if (page === "matchmaking" && canManageMatchmaking(role, office)) return <SimpleList title="Eşleşme kuralları" path="office/matchmaking-weights" />;
  if (page === "badges" && canManageBadges(role)) return <SimpleList title="Rozetler" path="badges" />;
  if (page === "commission" && canManageCommission(role)) return <SimpleList title="Hizmet bedeli" path="commission-policy" />;
  if (page === "rates" && canManageRates(role)) return <SimpleList title="Hakediş oranları" path="earning-rates" />;
  if (page === "subscription" && isManager(role)) return <SimpleList title="Abonelik" path="office/subscription" />;
  if (page === "whatsapp" && isManager(role)) return <WhatsappForm />;
  if (page === "email" && isManager(role)) return <EmailForm />;
  if (page === "billing" && isManager(role)) return <SimpleList title="Faturalar" path="hq/office/billing" />;
  if (page === "sellers" && isManager(role)) return <Sellers />;
  const links = [
    ["profile", "Profil"],
    ["notifications", "Bildirimler"],
    ...(canManageDuty(role) ? [["duty", "Nöbet"]] : []),
    ...(canManageTeam(role) ? [["team", "Ekip"]] : []),
    ...(isManager(role) ? [["office", "Ofis"], ["subscription", "Abonelik"], ["whatsapp", "WhatsApp"], ["email", "E-posta"], ["billing", "Faturalama"], ["sellers", "Sahibinden satıcıları"]] : []),
    ...(canManageMatchmaking(role, office) ? [["matchmaking", "Eşleşme"]] : []),
    ...(canManageBadges(role) ? [["badges", "Rozetler"]] : []),
    ...(canManageCommission(role) ? [["commission", "Hizmet bedeli"]] : []),
    ...(canManageRates(role) ? [["rates", "Hakediş oranları"]] : []),
  ];
  return (
    <section className="glass-grid">
      {links.map(([slug, label]) => (
        <a key={slug} className="glass-card" href={`/portal/office/settings/${slug}`}>{label}</a>
      ))}
    </section>
  );
}

function ProfileForm() {
  const { officeId, notice } = useOffice();
  return (
    <Form title="Profil" onSubmit={async (form) => {
      const body: OfficeRecord = { first_name: form.get("first_name"), last_name: form.get("last_name"), phone: form.get("phone") };
      const password = String(form.get("password") || "");
      if (password) body.password = password;
      await officeCall("profile", officeId, { method: "PUT", body });
      notice("Profil güncellendi.");
    }}>
      <input name="first_name" placeholder="Ad" required />
      <input name="last_name" placeholder="Soyad" required />
      <input name="phone" placeholder="Telefon" />
      <input name="password" type="password" placeholder="Yeni şifre" autoComplete="new-password" />
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

function Team() {
  const { officeId, office, notice } = useOffice();
  const team = useData("team");
  const roles = useData("roles");
  return (
    <section className="glass-card">
      <h2>Ekip</h2>
      <RecordTable rows={rows(team.data)} />
      <Form title="Üye ekle" onSubmit={async (form) => {
        await officeCall("team", officeId, { method: "POST", body: { first_name: form.get("first_name"), last_name: form.get("last_name"), email: form.get("email"), phone: form.get("phone") || null, role_id: Number(form.get("role_id")) } });
        notice("Üye eklendi.");
        team.reload();
      }}>
        <input name="first_name" placeholder="Ad" required />
        <input name="last_name" placeholder="Soyad" required />
        <input name="email" type="email" placeholder="E-posta" required />
        <input name="phone" placeholder="Telefon" />
        <select name="role_id" required defaultValue=""><option value="">Rol</option>{rows(roles.data).map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["name"])}</option>)}</select>
      </Form>
      {canDeleteTeam(roleOf(office), office) ? (
        <Form title="Üye çıkar" onSubmit={async (form) => {
          await officeCall(`team/${form.get("id")}`, officeId, { method: "DELETE" });
          notice("Üye çıkarıldı.");
          team.reload();
        }}>
          <input name="id" placeholder="Üye no" required />
        </Form>
      ) : null}
    </section>
  );
}

function OfficeForm() {
  const { officeId, notice } = useOffice();
  const current = useData(`offices/${officeId}`);
  return (
    <section className="glass-card">
      <h2>Ofis</h2>
      <RecordView value={current.data} />
      <Form title="Ofis bilgisi" onSubmit={async (form) => {
        await officeCall(`offices/${officeId}`, officeId, { method: "PUT", body: { name: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address") } });
        notice("Ofis güncellendi.");
        current.reload();
      }}>
        <input name="name" placeholder="Ofis adı" required />
        <input name="phone" placeholder="Telefon" />
        <input name="email" type="email" placeholder="E-posta" />
        <input name="address" placeholder="Adres" />
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
        <input name="password" type="password" placeholder="Şifre" autoComplete="new-password" />
      </Form>
    </section>
  );
}

function Sellers() {
  const { officeId } = useOffice();
  const list = useData(`offices/${officeId}/sahibinden-sellers`);
  return (
    <section className="glass-card">
      <h2>Sahibinden satıcıları</h2>
      <RecordTable rows={rows(list.data)} />
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
    <form className="glass-stack" onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      setPending(true);
      onSubmit(new FormData(event.currentTarget)).catch((error: Error) => notice(`Hata: ${error.message}`)).finally(() => setPending(false));
    }}>
      <h3>{title}</h3>
      {children}
      <button className="glass-btn" type="submit" disabled={pending}>{pending ? "Kaydediliyor" : "Kaydet"}</button>
    </form>
  );
}
