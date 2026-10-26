import { SECTION_DENIED_TEXT } from "@/lib/portal-ux";

export default function OfficeForbidden() {
  return (
    <main className="glass-login">
      <section className="glass-card">
        <h2>Ayarlar</h2>
        <p>{SECTION_DENIED_TEXT}</p>
      </section>
    </main>
  );
}
