# Importazione di Cubetto

## Provenienza

Importazione del 2 ottobre 2026 dalla cartella Cubetto sul laptop Linux. Repository: https://github.com/fabiomacri84-code/cubetto. Base Git: `0070073` su `main`, versione ereditata `0.1.0`. Il branch `codex/import-opencode` conserva le modifiche locali sopra questa base, senza cambiare la produzione.

OpenCode 1.18.18 risultava ancora aperto, ma l’ultimo messaggio dell’assistente era interrotto (`MessageAbortedError`) alle 11:43, ora italiana. Il prompt più recente era una richiesta di stato. Non è presente una risposta finale che confermi il completamento dell’ultimo incarico.

## Lavoro importato e punti aperti

Le modifiche non committate rimuovono categorie dall’interfaccia e aggiungono suggerimenti di icone tramite parole chiave e ricerca di luoghi. Sono state importate senza completare né riscrivere la funzionalità. La ricerca restituisce emoji secondo il tipo di luogo; non equivale a un catalogo di immagini specifiche per città. La rimozione delle categorie riguarda l’interfaccia e alcune azioni: lo schema conserva ancora categorie e relazioni.

Resta da verificare il suggerimento automatico nelle liste e nei pack, compresi richieste concorrenti, chiusura del modulo, selezione manuale e indisponibilità del servizio remoto. Prima della pubblicazione va verificata anche la politica d’uso del servizio di geocodifica.

Lo script di rilascio originale era incompleto e conteneva una credenziale incorporata. È stato preservato solo nell’archivio locale privato, escluso da Git. Non va eseguito. Il workflow definitivo dovrà allineare versione, lockfile, `app/version.ts` e badge, pubblicare tag e release, distribuire il tag esatto e verificare la produzione.

## Archivi locali privati

La directory `.local/import/`, esclusa da Git, contiene:

- `source.tar.gz`: snapshot del codice sorgente Linux, incluso lo script originale; esclusi dipendenze, build, dati e `.git`.
- `opencode-session.json`: esportazione nativa completa della sessione CUBETTO, in formato OpenCode.
- `opencode-session-records.json`: snapshot in lettura delle righe della sessione nel database OpenCode.
- `prompts.md`: 94 messaggi utente registrati, in ordine cronologico.
- `operations.md`: indice delle 1.709 operazioni registrate; input e output sono nei JSON.
- `cubetto.dump`: dump PostgreSQL del database di sviluppo del laptop.
- `uploads.tar.gz`: immagini caricate, copiate anche nella cartella locale `uploads/`.
- `source.env` e `release.opencode.ts`: configurazione e script originali, da trattare come dati riservati.
- `SHA256SUMS`: impronte degli archivi acquisiti.

Le compattazioni già avvenute in OpenCode possono influire su quanto dettaglio è rimasto; gli archivi conservano tutto ciò che era presente nella sessione al momento dell’esportazione. La cronologia non è convertita in una chat Codex, ma può essere letta per riprendere il progetto. L’export nativo permette inoltre il trasferimento della sessione ad OpenCode.

Questi file contengono dati e credenziali: non allegarli alla PR e non pubblicarli. Il dump ha un indice leggibile con `pg_restore --list`; il ripristino completo e la corrispondenza con un eventuale database di produzione non sono stati verificati. La produzione non è stata copiata o modificata.

## Ambiente di sviluppo

Il laptop usa Node 22.23.1; `.nvmrc` mantiene questa scelta. Le verifiche iniziali sul Mac sono state eseguite con Node 26.3.0 disponibile. La CI usa Node 22.23.1.

Per avviare da zero un database di sviluppo vuoto, con Docker Compose disponibile:

```bash
nvm use
npm ci
cp .env.example .env
docker compose up -d db
npm run prisma:generate
npx prisma migrate deploy
npm run dev -- --port 3100
```

Nel checkout importato `.env` è già presente con i valori dimostrativi dell’esempio; non contiene una connessione attiva alla produzione. Il Mac non ha attualmente Docker o Podman disponibili. Il server di sviluppo non è stato avviato.

Il seed è facoltativo e va usato soltanto su un database vuoto di prova. Per riprendere i dati originali, ripristinare invece il dump in un database locale separato e configurare `.env` per quel database; non eseguire il seed sopra il ripristino senza verificarne gli effetti. Non trasferire `node_modules` Linux al Mac: le dipendenze sono state reinstallate dal lockfile.

## Verifiche iniziali

- Installazione da lockfile e generazione Prisma: completate.
- TypeScript: superato.
- Test unitari: 5 su 5 superati.
- Lint: nessun errore, due avvisi preesistenti nelle modifiche importate (`cn` e `classType` inutilizzati).
- Build Next.js: superata.
- E2E: non eseguiti sul Mac; la cronologia Linux registra una precedente esecuzione con 16 test superati e 4 falliti, seguita da correzioni e test parziali ancora falliti. Non considerarli superati dopo l’importazione.
- Audit dipendenze al momento dell’importazione: 11 segnalazioni (10 alte, una critica). Nessun aggiornamento automatico o cambio di major è stato applicato. Esaminare Next.js e le dipendenze segnalate prima del prossimo rilascio. Il rapporto integrale è conservato privatamente.

La CI aggiunta ripete i controlli e gli E2E su PostgreSQL temporaneo. Il ramo rimane una bozza finché problemi e verifiche non sono risolti. Non sono stati creati tag, release o deploy per questa importazione.
