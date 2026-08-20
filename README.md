# Cubetto

> La lista della spesa (e non solo) che si condivide, si svuota e si aggiorna in tempo reale. Zero budget, zero fronzoli: solo quello che serve per non dimenticare nulla.

**Cubetto** è una PWA per gestire liste condivise con amici, famiglia o colleghi. Puoi creare una lista, riempirla con gli item che preferisci, assegnarli alle categorie, aggiungere foto e quantità, e condividere tutto con un semplice codice di invito.

## Funzionalità

- **Liste condivise** — inviti tramite codice, con ruoli *proprietario*, *editor* e *sola lettura*.
- **Item ricchi** — nome, quantità, categoria, note e foto dal dispositivo.
- **Categorie & Pack** — organizza le tue liste per categoria e parti da template pronti (spesa, valigia, ecc.).
- **Pallino presenza** — vedi chi è online sulla stessa lista e la pagina si aggiorna da sola quando gli altri modificano qualcosa. Niente più refresh manuale.
- **Svuota & Cassetto** — svuota la lista dei fatti e da fare in un colpo: gli item finiscono nel *cassetto* e puoi riprenderli quando ti servono.
- **Icone emoji autohostate** — 223 icone Twemoji servite localmente, senza dipendenze esterne, con un picker con ricerca.
- **PWA** — installabile su telefono e desktop, con manifest e icone.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, React 19)
- [Prisma 7](https://www.prisma.io) + PostgreSQL
- [Tailwind CSS 4](https://tailwindcss.com)
- [Vitest](https://vitest.dev) (unit) + [Playwright](https://playwright.dev) (e2e)
- PWA con [manifest](app/manifest.ts) e icone

## Sviluppo locale

```bash
npm install
cp .env.example .env          # punta al tuo PostgreSQL (es. via docker-compose)
npx prisma migrate deploy
npm run seed                  # crea utenti demo, categorie, liste e pack
npm run dev                   # http://localhost:3100
```

Test:

```bash
npm test                      # unit test (Vitest)
npm run test:e2e              # test end-to-end (Playwright)
npm run lint && npm run typecheck
```

## Utenti seed

| Nome utente | Password |
| --- | --- |
| `fabio` | `cubetto` |
| `carla` | `cubetto` |

Puoi accedere con il nome utente (o un'email) e cambiare la password dalla pagina *Impostazioni*.

## Struttura

- `app/` — pagine, Server Actions e route API (App Router)
- `app/components/` — componenti client (form aggiunta, picker icone, refresher presenza…)
- `prisma/` — schema, migrazioni e seed
- `scripts/` — build del set di icone Twemoji
- `tests/` — test unit ed e2e

## Roadmap

- [x] Liste condivise con codici di invito e ruoli
- [x] Item con foto, quantità, note e categorie
- [x] Pack pronti e categorie personalizzate
- [x] Picker di icone emoji autohostate
- [x] Cassetto e svuotamento rapido
- [x] Presenza in tempo reale e auto-aggiornamento
- [ ] Notifiche push e offline-first
- [ ] Storia / undo delle modifiche