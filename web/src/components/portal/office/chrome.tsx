"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PORTAL_UX_COPY } from "@/content/portal-ux";
import { officeCall } from "@/components/portal/office/api";
import { useOffice } from "@/components/portal/office/ui";
import { Icon, initials } from "@/components/portal/shell";
import { notificationBadge, notificationLines, officeRoleBadge, withLang } from "@/lib/portal-ux";
import type { Locale } from "@/lib/locales";

export function PortalSearch({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="ux-search">
      <span className="ux-sr">{label}</span>
      {/* TODO(TD-023): global-search is allowlisted but has no query or response contract in this repo. */}
      <input type="search" disabled placeholder={placeholder} aria-disabled="true" />
    </label>
  );
}

export function UserChip({ first, last, role, locale }: { first: string; last: string; role: string; locale: Locale }) {
  const name = `${first} ${last}`.trim();
  const badge = officeRoleBadge(role, locale);
  return (
    <div className="ux-user">
      <span className="glass-avatar">{initials(first, last)}</span>
      {name ? <span className="ux-user-name">{name}</span> : null}
      {badge ? <span className="ux-role">{badge}</span> : null}
    </div>
  );
}

export function NotificationBell() {
  const { officeId, locale } = useOffice();
  const copy = PORTAL_UX_COPY[locale];
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    officeCall("notifications", officeId)
      .then((body) => {
        if (!cancelled) setPayload(body);
      })
      .catch(() => {
        if (!cancelled) setPayload(null);
      });
    return () => {
      cancelled = true;
    };
  }, [officeId]);

  const badge = notificationBadge(payload);
  const lines = notificationLines(payload);

  return (
    <div className="ux-bell-wrap">
      <button className="ux-bell" type="button" aria-label={copy.notificationsTitle} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Icon name="bell" />
        {badge != null && badge > 0 ? <span className="ux-bell-count">{badge > 9 ? "9+" : badge}</span> : null}
      </button>
      {open ? (
        <div className="ux-note">
          <header>
            <h2>{copy.notificationsTitle}</h2>
          </header>
          {lines.length === 0 ? <p className="ux-muted">{copy.noNotifications}</p> : (
            <ul>
              {lines.slice(0, 6).map((line) => (
                <li key={line.id}>
                  <strong>{line.title}</strong>
                  {line.meta ? <small className="ux-muted">{line.meta}</small> : null}
                </li>
              ))}
            </ul>
          )}
          <Link href={withLang("/portal/office/settings/notifications", locale)} onClick={() => setOpen(false)}>{copy.allNotifications}</Link>
        </div>
      ) : null}
    </div>
  );
}
