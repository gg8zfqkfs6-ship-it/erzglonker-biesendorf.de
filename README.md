# erzglonker-biesendorf.de
Webseite Erzglonker Biesendorf

## MySQL / OVH Setup

1. `config.example.php` auf dem OVH-Webspace zu `config.php` kopieren.
2. In `config.php` die MySQL-Zugangsdaten aus OVH eintragen.
3. Die komplette Website inklusive `api/`-Ordner auf den OVH-Webspace laden.
4. Beim ersten Aufruf legt die Anwendung die Tabellen an und erstellt automatisch:
   - Gruppen `Narren` und `Vorstandschaft`
   - Admin-Benutzer `admin` mit Startpasswort `1234`
5. Beim ersten Login muss das Startpasswort sofort geändert werden.

Hinweis: GitHub Pages kann kein PHP ausführen. Die MySQL-Version der Website läuft daher erst richtig auf OVH oder einem anderen PHP-Webspace.
