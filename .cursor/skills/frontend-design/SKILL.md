---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
---

# Frontend Design

Source: [anthropics/skills frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated. Make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Cleanbuddy identity (locked) — Entrepôt

- **Subject:** private COD / dropshipping till for one owner (Arabic + French).
- **World:** warehouse floor, packing tape, thermal LED, Mexico COD — not spa-green fintech, not cream+gold luxury, not navy Linear clone.
- **Avoid AI defaults:** cream `#F4F1EA` + serif + terracotta; near-black + acid green; newspaper hairlines; pure `#000`/`#111` chrome.
- **Palette (tokens in `src/app/tokens.css` + `src/design/tokens.ts`):**
  - Light paper `#EFF1EE`, ink `#17211C`, mint `#00A888`, LED `#5FF5D0`, tape amber `#D4890B`, chile `#D42B1A`
  - Dark: `#0C1210` / `#151C18` / mint `#3DCFB0` / amber `#E5A83A`
- **Type:** Readex Pro (UI, Arabic+Latin). IBM Plex Mono (money only). Page titles ≥ 1.75× body, bold.
- **Signature:** `.cb-till` — ink profit ticker, amber tape strip on top, mint LED numerals. Spend boldness here only. Mint is the single primary action per screen.
- **Chrome:** sidebar is always warehouse ink, even in light mode. Radius 12px everywhere.
- **RTL:** `dir` on `<html>`, logical CSS (`start`/`end`, `ps`/`pe`), flip directional icons.

## Process

1. Ground the visual in the product world (materials, instruments).
2. Token system: named hex values in tokens.css, 2 type roles, one signature.
3. If it could be any SaaS dashboard, revise before coding.
4. Quality floor: mobile, keyboard focus, `prefers-reduced-motion`, WCAG AA (mint buttons use `--on-accent`, never white on teal).
