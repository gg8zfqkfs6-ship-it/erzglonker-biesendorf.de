# erzglonker-biesendorf.de

Webseite Erzglonker Biesendorf

## Zugangsmodell ohne Zusatzhosting

Die Website nutzt jetzt wieder einen einfachen clientseitigen Passwortschutz
mit mehreren Rollen.

- Login-Seite: `mitglieder.html`
- Zugänge:
  - `open` / `open1234`
  - `narren` / `narren1234`
  - `vorstand` / `vorstand1234`
  - `admin` / `admin1234`
- `open` sieht nur die offenen Seiten
- `narren` sieht zusätzlich den internen Bereich
- `vorstand` sieht zusätzlich den Vorstandsbereich
- `admin` hat denselben Vollzugriff

Hinweis: Diese Variante funktioniert ohne zusätzliche OVH-Produkte und ohne Datenbank,
ist aber kein echter serverseitiger Sicherheitsmechanismus.
