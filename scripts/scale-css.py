#!/usr/bin/env python3
"""
Scales every CSS length of the site to 80% on desktop and tablet, keeping phones as
they are.

Each px/rem length in a declaration becomes `calc(<length> * var(--sk-scale, 1))`.
`--sk-scale` is set in web/src/lib/scale.ts: 1 below 768px, 0.8 from 768px. Media query
conditions are not touched, so breakpoints still follow the real viewport width.

Lengths of 1px or less (hairline borders and shadows) are kept, and so are the flag and
icon sprites: their background offsets only line up at the sprite's own pixel size.
The root font size is never scaled, because rem lengths are already scaled one by one;
when it comes from a variable that is scaled elsewhere, it is divided back.

The files are rewritten in place. Run it again after re-fetching the reference
stylesheets (fetch-reference-static.py), the critical CSS (extract-reference-content.py)
and after writing new lengths by hand: lengths that are already scaled are left alone,
so a second run changes nothing.

    python3 scripts/scale-css.py           # rewrite the files
    python3 scripts/scale-css.py --check   # list files with unscaled lengths, exit 1 if any
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STYLESHEETS = (
    "web/public/themes/fela/css/*.css",
    "web/public/lib/**/*.css",
    "web/public/css/*.css",
    "web/src/app/portal/portal.css",
)
CRITICAL_CSS = ("web/src/content/critical-css.ts",)

SPRITE_SELECTOR = re.compile(r"\.iti__flag(?![\w-])|\.ui-icon", re.I)
ROOT_SELECTOR = re.compile(r"\s*(?:html|:root)\s*", re.I)

# At-rules whose body holds rules rather than declarations.
GROUPING_AT_RULES = {
    "media",
    "supports",
    "layer",
    "container",
    "document",
    "-moz-document",
    "scope",
    "starting-style",
}
# At-rules whose declarations are descriptors, not lengths of the page.
DESCRIPTOR_AT_RULES = {
    "font-face",
    "page",
    "property",
    "counter-style",
    "font-feature-values",
    "font-palette-values",
}

TOKEN = re.compile(
    r"""
      (?P<comment>/\*.*?\*/)
    | (?P<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')
    | (?P<url>url\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^)]*?)\s*\))
    | (?P<open>\{)
    | (?P<close>\})
    | (?P<semi>;)
    | (?P<text>(?:[^{};"'/u]|/(?!\*)|u(?!rl\())+)
    | (?P<other>.)
    """,
    re.S | re.X | re.I,
)

LENGTH = re.compile(
    r"(?<![\w.#+-])([-+]?(?:\d+\.\d+|\d+|\.\d+))(px|rem)(?![\w-])(?!\s*\*\s*var\(--sk-scale)",
    re.I,
)

CRITICAL_CSS_LITERAL = re.compile(r"(export const criticalCss = `)(.*)(`;\s*)$", re.S)


def scale_lengths(text, counter):
    def replace(match):
        number, unit = match.group(1), match.group(2)
        pixels = abs(float(number)) * (16 if unit.lower() == "rem" else 1)
        if pixels <= 1:
            return match.group(0)
        counter[0] += 1
        return f"calc({match.group(0)} * var(--sk-scale, 1))"

    return LENGTH.sub(replace, text)


def unscale_root_font_size(declaration, counter):
    before, value = declaration.split(":", 1)
    important = re.search(r"\s*!important\s*$", value, re.I)
    core = value[: important.start()] if important else value
    if "var(" not in core or "var(--sk-scale" in core:
        return declaration
    counter[0] += 1
    leading = core[: len(core) - len(core.lstrip())]
    trailing = core[len(core.rstrip()) :]
    compensated = f"{leading}calc({core.strip()} / var(--sk-scale, 1)){trailing}"
    return before + ":" + compensated + (important.group(0) if important else "")


def scale_declaration(tokens, counter, root=False):
    out = []
    name = []
    in_value = False
    for kind, value in tokens:
        if in_value:
            out.append(scale_lengths(value, counter) if kind == "text" else value)
        elif kind == "text" and ":" in value:
            before, after = value.split(":", 1)
            name.append(before)
            prop = "".join(name).strip().lower()
            if prop.startswith("--") and "breakpoint" in prop:
                return "".join(v for _, v in tokens)
            if root and prop in ("font", "font-size"):
                original = "".join(v for _, v in tokens)
                return unscale_root_font_size(original, counter) if prop == "font-size" else original
            out.append(before + ":" + scale_lengths(after, counter))
            in_value = True
        else:
            if kind == "text":
                name.append(value)
            out.append(value)
    return "".join(out)


def block_kind(prelude_tokens, parent):
    if parent == "keep":
        return "keep"
    prelude = "".join(v for k, v in prelude_tokens if k != "comment").strip()
    if prelude.startswith("@"):
        match = re.match(r"@([\w-]+)", prelude)
        name = match.group(1).lower() if match else ""
        if name in GROUPING_AT_RULES or name.endswith("keyframes"):
            return "rules"
        return "keep" if name in DESCRIPTOR_AT_RULES else "decls"
    if SPRITE_SELECTOR.search(prelude):
        return "keep"
    return "decls"


def property_name(tokens):
    for kind, value in tokens:
        if kind == "text" and ":" in value:
            return value.split(":", 1)[0].strip().lower()
    return ""


def block_sets_font(tokens, start):
    declaration = []
    for kind, value in tokens[start + 1 :]:
        if kind in ("open", "close", "semi"):
            if property_name(declaration) in ("font", "font-size"):
                return True
            if kind != "semi":
                return False
            declaration = []
        else:
            declaration.append((kind, value))
    return False


def scale_stylesheet(css, counter, kind="rules"):
    """`kind` is "rules" for a stylesheet and "decls" for a style attribute."""
    tokens = [(match.lastgroup, match.group()) for match in TOKEN.finditer(css)]
    root = False
    # A rule like `body, html { font-size: … }` is split so that only the root keeps
    # its unscaled font size: [root selectors, declarations so far].
    root_rule = None

    def flush(declaration):
        if kind != "decls":
            return "".join(v for _, v in declaration)
        if root_rule is not None:
            root_rule[1].append(scale_declaration(declaration, [0], True))
        return scale_declaration(declaration, counter, root)

    out = []
    stack = []
    pending = []
    for index, token in enumerate(tokens):
        if token[0] == "open":
            stack.append((kind, root, root_rule))
            kind = block_kind(pending, kind)
            selectors = "".join(v for k, v in pending if k != "comment").split(",")
            roots = [s for s in selectors if ROOT_SELECTOR.fullmatch(s)]
            root = kind == "decls" and len(roots) == len(selectors)
            root_rule = None
            if kind == "decls" and roots and not root and block_sets_font(tokens, index):
                others = [s for s in selectors if not ROOT_SELECTOR.fullmatch(s)]
                out.append(",".join(others) + "{")
                root_rule = [",".join(s.strip() for s in roots), []]
                counter[0] += 1
            else:
                out.append("".join(v for _, v in pending) + "{")
            pending = []
        elif token[0] == "close":
            out.append(flush(pending) + "}")
            if root_rule is not None:
                out.append(root_rule[0] + "{" + ";".join(root_rule[1]) + "}")
            pending = []
            kind, root, root_rule = stack.pop() if stack else ("rules", False, None)
        elif token[0] == "semi":
            out.append(flush(pending) + ";")
            pending = []
        else:
            pending.append(token)
    out.append(flush(pending))
    return "".join(out)


def scale_critical_css(source, counter):
    match = CRITICAL_CSS_LITERAL.search(source)
    if not match:
        raise SystemExit("criticalCss template literal not found")
    return source[: match.start(2)] + scale_stylesheet(match.group(2), counter) + source[match.end(2) :]


def main():
    check = "--check" in sys.argv[1:]
    targets = (
        (STYLESHEETS, scale_stylesheet),
        (CRITICAL_CSS, scale_critical_css),
    )
    seen = set()
    changed = []
    for patterns, transform in targets:
        for pattern in patterns:
            for path in sorted(ROOT.glob(pattern)):
                if path in seen or not path.is_file():
                    continue
                seen.add(path)
                original = path.read_bytes().decode("utf-8", "surrogateescape")
                counter = [0]
                scaled = transform(original, counter)
                if scaled != original:
                    changed.append((path.relative_to(ROOT), counter[0]))
                    if not check:
                        path.write_bytes(scaled.encode("utf-8", "surrogateescape"))

    for path, count in changed:
        print(f"{count:7d}  {path}")
    total = sum(count for _, count in changed)
    verb = "unscaled" if check else "scaled"
    print(f"{total} lengths {verb} in {len(changed)} of {len(seen)} files")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
