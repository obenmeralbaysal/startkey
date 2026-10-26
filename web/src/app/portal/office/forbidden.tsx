import { SETTINGS_DENIED } from "@/components/portal/office/access";

export default function OfficeForbidden() {
  return (
    <main className="glass-login">
      <section className="glass-card">
        <h2>Ayarlar</h2>
        <p>{SETTINGS_DENIED}</p>
      </section>
    </main>
  );
}
