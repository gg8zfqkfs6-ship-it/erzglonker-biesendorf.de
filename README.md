# erzglonker-biesendorf.de

Webseite Erzglonker Biesendorf

## Zugangsmodell ohne Datenbank

Die Website ist jetzt in drei Bereiche aufgeteilt:

- `index.html` und `veranstaltungen.html` sind öffentlich
- `intern/` ist passwortgeschützt für Mitglieder
- `vorstand/` ist separat passwortgeschützt nur für die Vorstandschaft

Die Serverabsicherung läuft über Apache `Basic Auth` mit `.htaccess` und `.htpasswd`.
Passwörter liegen dabei nicht im Klartext auf dem Server, sondern nur als Hash.

## OVH Deployment

1. Website auf den OVH-Webspace hochladen.
2. In `intern/.htaccess` und `vorstand/.htaccess` die Zeile `AuthUserFile` auf den echten absoluten OVH-Pfad anpassen.
3. `.htpasswd.example` in eine echte Datei `.htpasswd-erzglonker` umwandeln.
4. Diese `.htpasswd-erzglonker` außerhalb des öffentlichen Web-Ordners auf OVH ablegen.
5. Die Platzhalter-Hashes in `.htpasswd-erzglonker` durch echte Werte ersetzen, zum Beispiel lokal mit:
   - `openssl passwd -apr1`

Initiale Benutzer:

- `intern`
- `vorstand`
