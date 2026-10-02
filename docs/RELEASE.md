# Rilasci di Cubetto

Il repository resta `fabiomacri84-code/cubetto`. L'importazione OpenCode non è una release. I comandi seguenti richiedono Node 22, Git, GitHub CLI autenticata e accesso SSH configurato tramite chiavi/agent; non contengono password. Le credenziali restano fuori da Git.

## Preparare e pubblicare

1. Lavorare su un branch `codex/`, completare le modifiche e committarle. La working tree deve essere pulita, compresi file non tracciati. Configurare un database di sviluppo; mai quello di produzione per i test.
2. Eseguire `npm run release:prepare -- patch` (oppure `minor`). Lo script aggiorna package, lockfile, `app/version.ts` e badge README, reinstalla dal lockfile, genera Prisma ed esegue lint, typecheck, test unitari e build. Solo dopo il successo crea il commit della versione e pubblica il branch. Un errore lascia i cambiamenti locali visibili per la correzione; non li elimina.
3. Aprire/aggiornare la PR sul repository originale. La CI esegue anche gli E2E su un PostgreSQL temporaneo. Revisionare e unire soltanto dopo il successo.
4. Aggiornare il checkout di `main`, creare un file di note con cambiamenti e verifiche e attendere la CI `push` sull'esatto commit di `main`.
5. Eseguire `npm run release:publish -- --notes /percorso/note.md`. Lo script richiede `main` allineato a `origin/main`, tutte le versioni coerenti e l'ultima CI dell'esatto commit superata. Crea un tag annotato, lo pubblica e crea la release GitHub. Non distribuisce implicitamente.
6. Per distribuire nello stesso passaggio: aggiungere `--deploy --host cubetto-production`, dove l'alias SSH è già configurato. Il comando trasferisce lo script di deploy via standard input. In alternativa eseguire lo script separatamente sul server per il tag già pubblicato. Se la release GitHub esiste già, non rieseguire `publish`: usare il deploy separato.

Gli E2E non vengono lanciati da `prepare`, perché resettano il database: sono obbligatori nella CI isolata. La directory `.local/`, `.env`, upload e dump rimangono esclusi dal repository.

## Distribuire sul container esistente

Lo script `scripts/deploy-production.sh vX.Y.Z` richiede root, Node 22, npm, Git, PostgreSQL client, runuser, curl, flock e systemd, oltre all’utente locale `postgres`. Il servizio esistente è `cubetto.service`; l'installazione originale è `/opt/cubetto`. Prima del primo uso controllare che `ExecStart` esegua `npm start` nella `WorkingDirectory`, senza riferimenti assoluti a una build precedente. La directory originale e la sua configurazione restano disponibili.

- Acquisisce un lock esclusivo per impedire deploy contemporanei.
- Verifica l'origine GitHub originale, recupera il tag annotato e registra l'esatto commit.
- Estrae il commit in `/opt/cubetto-releases/vX.Y.Z`. Una directory già esistente arresta il deploy per richiedere un'ispezione del tentativo precedente.
- Collega `.env` e `uploads` alla configurazione e ai dati già presenti in `/opt/cubetto`; installa dal lockfile e compila prima di toccare il servizio.
- Salva database PostgreSQL in formato custom, upload, configurazione e stato del servizio in una directory privata `/opt/cubetto-backups/…`. Il dump viene controllato con `pg_restore --list` e ripristinato completamente in un database locale usa e getta, creato con nome univoco `cubetto_restore_…`, poi eliminato. Qualsiasi errore ferma il deploy prima delle migrazioni.
- Applica soltanto `prisma migrate deploy`: non esegue reset o seed. La connessione del dump viene trasformata in variabili libpq, senza password negli argomenti di processo.
- Imposta la nuova `WorkingDirectory` tramite l'override `90-cubetto-release.conf`, riavvia e verifica servizio, versione e commit esatto tramite `/api/version` fino a un minuto. L'endpoint predefinito è `http://127.0.0.1:3000/api/version`; impostare `CUBETTO_HEALTH_URL` sul server se la porta è diversa.

Le migrazioni devono essere compatibili anche con la versione precedente: rivederle prima del rilascio. La build precedente può continuare a ricevere scritture durante il backup; per migrazioni incompatibili programmare manutenzione e bloccare le scritture, invece di usare questo flusso senza adattamenti.

## Rollback

Se il controllo dopo lo switch fallisce, lo script ripristina l'override precedente e riavvia il servizio. Mantiene backup e nuova directory per l'ispezione. Il rollback del servizio non annulla le migrazioni: non ripristina automaticamente un dump, per non cancellare scritture successive al backup.

Per tornare manualmente alla release precedente, recuperare la directory registrata nel file `working-directory-before.txt`, ripristinare `override-before.conf` nella posizione indicata (oppure rimuovere `90-cubetto-release.conf` se prima non esisteva), eseguire `systemctl daemon-reload` e riavviare `cubetto.service`. Controllare servizio, accesso utente e versione. Prima di un rollback del database, fermare le scritture, salvare anche lo stato corrente e verificare il dump in un database temporaneo. Stabilire esplicitamente come conservare le modifiche intervenute dopo il backup.

## Versione e PWA

`app/version.ts` è il riferimento per la UI e per `/api/version`, che restituisce `Cache-Control: no-store` e il commit configurato tramite `CUBETTO_BUILD_SHA` nell’override del servizio. La versione è visibile sul desktop e sul telefono. Il browser controlla la versione all'apertura, al ritorno sulla pagina e ogni minuto mentre è visibile; evita il refresh durante la compilazione di un campo e consente al massimo un aggiornamento per versione nella sessione.

Il service worker memorizza soltanto icone pubbliche e asset immutabili Next.js. HTML, payload React, API, upload e dati personali usano la rete; le precedenti cache Cubetto vengono eliminate. Il nome tecnico della cache non viene più confrontato con la versione SemVer dell'app. L'app non fornisce una copia offline delle liste personali.
