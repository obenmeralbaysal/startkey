import { Children, cloneElement, createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

import type { FieldErrors } from "./api-error";

type FieldProps = {
  name?: unknown;
  children?: ReactNode;
};

/** Keep errors whose key, or its last segment, matches a control name on the form. */
export function matchedFieldErrors(names: readonly string[], errors: FieldErrors): FieldErrors {
  const known = new Set(names.filter((name) => name !== ""));
  const out: FieldErrors = {};
  for (const [name, message] of Object.entries(errors)) {
    if (!message) continue;
    if (known.has(name)) {
      out[name] = message;
      continue;
    }
    const tail = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
    if (tail && known.has(tail)) out[tail] = message;
  }
  return out;
}

export function fieldErrorId(name: string): string {
  return `field-error-${name.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

/** Place the first error for each matched field immediately after that control. */
export function withFieldErrors(children: ReactNode, errors: FieldErrors): ReactNode {
  if (Object.keys(errors).length === 0) return children;
  return mapChildren(children, errors);
}

function mapChildren(children: ReactNode, errors: FieldErrors): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === Fragment) {
      const fragment = child as ReactElement<{ children?: ReactNode }>;
      return createElement(Fragment, null, mapChildren(fragment.props.children, errors));
    }
    const props = child.props as FieldProps;
    const name = typeof props.name === "string" ? props.name : "";
    const message = name ? errors[name] : undefined;
    const nested = props.children !== undefined ? mapChildren(props.children, errors) : props.children;
    const patch: Record<string, unknown> = {};
    if (message) {
      patch["aria-invalid"] = true;
      patch["aria-describedby"] = fieldErrorId(name);
    }
    if (nested !== props.children) patch.children = nested;
    const next = Object.keys(patch).length > 0 ? cloneElement(child, patch) : child;
    if (!message) return next;
    return createElement(
      Fragment,
      null,
      next,
      createElement(
        "p",
        {
          id: fieldErrorId(name),
          className: "glass-notice",
          "data-tone": "error",
          "data-field-error": name,
          role: "alert",
        },
        message,
      ),
    );
  });
}
