---
tags: [engine, skin, monetization, cosmetics]
type: engine-spec
status: draft
updated: 2026-04-18
parent: "[[../ux/SKIN_SYSTEM]]"
---

# 🎨 Engine 23 — Skin Engine

**Propósito:** gestionar el catálogo Holy Oly Card System, inventario de skins limitadas, aplicación runtime según performance y pipeline de drops.

---

## 🎯 Responsabilidades

1. **Catálogo** — skins disponibles (free/pagas/limitadas) con metadata (rareza, precio, edición, supply).
2. **Inventario usuario** — qué skins posee cada atleta + número de edición si limitada (ej: #347/500).
3. **Aplicación runtime** — determinar variante visible (Plata/Oro/Holográfica) según performance de sesión.
4. **Drop scheduler** — activar/desactivar ventanas de compra para skins limitadas.
5. **Asset pipeline** — servir assets correctos (avatar pixel, overlay card, badge dashboard, victory screen).

---

## 📦 Catálogo inicial

| Skin | Tipo | Precio | Supply | Superficies |
|---|---|---|---|---|
| Obsidian Classic | Free default | $0 | ∞ | Victory · Viral · Avatar · Badge |
| Andes Electric | Pago | $4.99 USD | ∞ | Victory · Viral · Avatar · Badge |
| Olympic Legacy | Limitada | $9.99 USD | 500 | Victory · Viral · Avatar · Badge |

---

## 🔀 Variantes por performance

Por cada skin poseída se genera runtime una de tres variantes:

- **Plata** — sesión completada sin fallar bloques.
- **Oro** — IMR top 20% del atleta + sin fallos.
- **Holográfica** — PR roto en la sesión.

La variante se calcula en el momento de renderizar Victory Screen / Viral Card. No se persiste como dato — es función pura de `(skin_id, session_metrics)`.

---

## 🗄️ Schema sugerido (Prisma)

```prisma
model Skin {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  rarity      SkinRarity
  priceUSD    Float?
  supplyTotal Int?
  supplyLeft  Int?
  dropStart   DateTime?
  dropEnd     DateTime?
  assets      Json
  createdAt   DateTime @default(now())
}

model SkinInventory {
  id        String   @id @default(cuid())
  userId    String
  skinId    String
  edition   Int?
  acquiredAt DateTime @default(now())
  source    SkinSource
  @@unique([userId, skinId])
  @@index([skinId])
}

enum SkinRarity { FREE COMMON RARE LIMITED }
enum SkinSource { DEFAULT PURCHASE REWARD PROMO }
```

---

## 🔧 API pública (interna al monorepo)

- `skinEngine.getCatalog(userId)` → lista + owned flag + edición.
- `skinEngine.purchase(userId, skinId)` → valida supply, cobra vía Lemon Squeezy, asigna edición atómica.
- `skinEngine.resolveVariant(skinId, sessionMetrics)` → `'silver' | 'gold' | 'holo'`.
- `skinEngine.getActiveSkin(userId, surface)` → skin seleccionada por atleta para esa superficie.
- `skinEngine.setActiveSkin(userId, skinId, surface)` → cambiar skin activa.

---

## 🎟️ Drop scheduler

- Cron job consulta `dropStart/dropEnd` y habilita compra.
- Edición numerada secuencial atómica (DB lock por `skinId`).
- Cuando `supplyLeft = 0` → skin pasa a "agotada" (visible pero no comprable).
- Post-drop: owners conservan skin + número. No re-emisión.

---

## 🖼️ Asset pipeline

Assets servidos desde CDN (Cloudflare R2 o similar):

```
/skins/{slug}/{variant}/{surface}.{ext}
  variant ∈ {silver, gold, holo}
  surface ∈ {victory, viral, avatar, badge}
```

Fallback: si variant no existe → usar `silver`. Si skin no existe → `obsidian-classic`.

---

## 🔒 Restricciones

- Coach NO ve skins del atleta en C4 (ver [[../ux/ROLES_VISIBILITY]]).
- Skins solo visibles en UI propia del atleta + Viral Card compartida.
- No transferibles entre usuarios.
- No revendibles.

---

## 🧪 Pendiente validar

- Lemon Squeezy: soporte microtransacciones one-time (no solo subs).
- Chile IVA sobre compras digitales — confirmar con contador.
- Estrategia anti-fraude en edición numerada (no duplicar `#347/500`).

---

## 🔗 Docs relacionados

- [[../ux/SKIN_SYSTEM]] — especificación producto
- [[../ux/COACH_FLOW_RONDA_2]] — decisiones coach relacionadas
- [[../ux/ROLES_VISIBILITY]] — qué ve cada rol
