# Cubetto — istruzioni per gli agenti

## Stato e ambito

Prima di intervenire leggere `docs/IMPORT.md`, verificare branch, working tree e richieste dell’utente. Il ramo di importazione conserva lavoro incompleto di OpenCode: non considerarlo una release e non distribuire automaticamente. Preservare dati, storico e stack Next.js/React/Prisma/PostgreSQL esistenti.

## Next.js

Questa versione può differire dalle API note. Prima di scrivere codice leggere la guida pertinente in `node_modules/next/dist/docs/` e rispettare gli avvisi di deprecazione.

## Verifiche e dati

Usare il lockfile con `npm ci`. Generare Prisma prima del typecheck. Eseguire lint, typecheck, test unitari e build. I test E2E eseguono un reset del database: usare esclusivamente un database temporaneo dedicato; mai quello di produzione o il dump importato. La CI dispone di un PostgreSQL usa e getta.

`.local/`, `.env`, dump, immagini caricate e cronologia OpenCode sono privati e devono restare esclusi da Git. Non pubblicare credenziali né output originali dell’agente.

## GitHub e produzione

Usare branch `codex/`, commit piccoli e PR verificabili; mai force push su main. Pubblicare una release solo quando il rilascio rientra nella richiesta dell’utente e le verifiche pertinenti sono superate. Non avviare altri agenti senza richiesta dell’utente.

Ogni modifica distribuita in produzione richiede aggiornamento GitHub e nuova versione SemVer. Mantenere allineati `package.json`, `package-lock.json`, `app/version.ts` e badge README; introdurre `app/version.ts` quando si completa il workflow di rilascio. La versione deve essere visibile nell’app. Pubblicare commit, tag annotato `vX.Y.Z` e release GitHub con note e verifiche.

Distribuire il tag esatto, con backup prima delle migrazioni, controllo del servizio e della versione attiva, e procedura di rollback. Non usare credenziali incorporate, non fare reset o seed dei dati di produzione e non usare l’incompleto script di OpenCode archiviato in `.local/import/`.
