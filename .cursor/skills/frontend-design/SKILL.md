---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
---

# Frontend Design

Source: [anthropics/skills frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated. Make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Cleanbuddy identity (locked)

- **Subject:** private COD / dropshipping till for one owner (Arabic + French).
- **World:** cash desk, thermal receipt, packing tape, Mexico COD — not spa-green fintech, not cream+gold luxury.
- **Avoid AI defaults:** cream `#F4F1EA` + serif + terracotta; near-black + acid green; newspaper hairlines.
- **Palette:** cool paper `#EEF2F6`, slate ink `#1C2430`, till mint `#00B89A`, LED `#5FF5D0`, chile `#E23D28`.
- **Type:** Readex Pro (UI, Arabic+Latin). IBM Plex Mono (money only).
- **Signature:** `.cb-till` — dark slate profit ticker with mint LED numerals. Spend boldness here only.
- **Chrome:** sidebar is always slate ink, even in light mode.

## Process

1. Ground the visual in the product world (materials, instruments).
2. Token system: 4–6 named hex values, 2 type roles, one signature.
3. If it could be any SaaS dashboard, revise before coding.
4. Quality floor: mobile, keyboard focus, `prefers-reduced-motion`.
