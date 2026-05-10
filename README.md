# erzglonker-biesendorf.de

Webseite Erzglonker Biesendorf

## Zugangsmodell ohne Datenbank

Die komplette Website ist jetzt einheitlich geschützt.

- die Absicherung liegt auf Wurzelebene in `.htaccess`
- die Zugangsdaten liegen als Hash in `.htpasswd`
- alle Seiten der Website werden vor dem Laden durch den Webserver geschützt

Die Serverabsicherung läuft über Apache `Basic Auth` mit `.htaccess` und `.htpasswd`.
Passwörter liegen dabei nicht im Klartext auf dem Server, sondern nur als Hash.

## OVH Deployment

1. Website auf den OVH-Webspace hochladen.
2. In `.htaccess` die Zeile `AuthUserFile` auf den echten absoluten OVH-Pfad anpassen.
3. `.htpasswd.example` in eine echte Datei `.htpasswd-erzglonker` umwandeln.
4. Diese `.htpasswd-erzglonker` außerhalb des öffentlichen Web-Ordners auf OVH ablegen.

Initialer Zugang:

- Benutzer `zugang`
- Passwort `1234`
