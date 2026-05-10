# Gesprächsnotizen 2026-05-02

Diese Datei fasst die bisherige Zusammenarbeit zur Website `erzglonker-biesendorf.de` zusammen.
Sie ist eine Projekt-Notiz und kein wortwörtliches Protokoll.

## Projektverlauf

- Die Website-Dateien wurden in den Projektordner übernommen.
- Das lokale Git-Repository wurde mit GitHub verbunden.
- Der erste Commit wurde erstellt und anschließend nach GitHub gepusht.
- GitHub Pages wurde eingerichtet und mit der Domain bei OVH verbunden.
- DNS-Einträge und SSL wurden mehrfach geprüft und angepasst.

## Wichtige Website-Änderungen aus der Zusammenarbeit

- Impressum wurde angelegt und später als kleiner Link ans Seitenende verschoben.
- Die Startseite wurde mehrfach für mobile Darstellung und Layout angepasst.
- Öffentliche und interne Termine wurden auf einer gemeinsamen Veranstaltungsseite strukturiert.
- Bildergalerie und Mitgliederbereich wurden ergänzt.
- Ein interner Login-Bereich wurde zunächst clientseitig aufgebaut.
- Danach wurde eine MySQL/PHP-Lösung vorbereitet.
- Anschließend wurde die Entscheidung getroffen, die Datenbank-Lösung wieder zu verwerfen und stattdessen auf einen einfacheren OVH-Webserver-Schutz umzusteigen.

## Aktueller technischer Stand

Die Website ist jetzt in drei Bereiche aufgeteilt:

- `index.html` und `veranstaltungen.html` sind öffentlich
- `intern/` ist für Mitglieder vorgesehen
- `vorstand/` ist separat für die Vorstandschaft vorgesehen

Die Zugangstrennung ist aktuell für OVH mit Apache-Basic-Auth vorbereitet:

- `intern/.htaccess`
- `vorstand/.htaccess`
- `.htpasswd.example`

## Noch wichtige To-dos

- In `intern/.htaccess` und `vorstand/.htaccess` den echten OVH-Pfad bei `AuthUserFile` eintragen.
- Aus `.htpasswd.example` eine echte `.htpasswd-erzglonker` erstellen.
- Echte Passwort-Hashes für `intern` und `vorstand` erzeugen.
- Die `.htpasswd-erzglonker` außerhalb des öffentlichen Webordners auf OVH ablegen.
- Danach die Zugänge live auf OVH testen.

## Zugangsmodell-Entscheidung

Die zuletzt gewählte Richtung war:

- keine MySQL-Datenbank
- keine Passwörter im Browser speichern
- keine Klartext-Passwörter im öffentlichen Projekt
- stattdessen serverseitiger Schutz über `.htaccess` und `.htpasswd`

## Hinweise

- Die Datei dient als Erinnerungs- und Übergabestand im Projekt.
- Falls gewünscht, kann später noch ein ausführlicheres Änderungsprotokoll oder eine echte technische Doku daraus gemacht werden.
