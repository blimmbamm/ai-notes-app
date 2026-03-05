# Allgemein
- Ziel: Eine Notes-App implementieren
- Fullstack-Ansatz mit React als SPA-Frontend und Spring Boot (Java 17) für Backend
- Datenbank: Postgres
- App-Stack dockerizen und dann per docker compose file startbar machen
- Implementierungssprache natürlich Englisch
- an übliche Framework-Konventionen halten

# Funktionalitäten im Frontend:
- Weboberfläche mit Auflistung von Notes in Form von Kacheln (Cards)
- Formular zum Hinzufügen/Bearbeiten von Notes
- Löschen von Notes 
- Seiten für Signup und Login
- Regristierung per E-mail mit Bestätigungslink per Email (hier soll STMP4DEV als Dummy-Mail-Client benutzt werden)
- Authentifizierung mit JWT und Refresh-Tokens
- Logout button

# Technik im Frontend:
- MaterialUI benutzen mit eigenem Theme 
- ingesamt responsives Design (es genügt mobile vs desktop, also ein Breakpoint)
- Fetching wrappen mit tanstack query
- Error und Loading states in UI darstellen
- die App soll dann über nginx laufen, dabei sollen die API calls über proxy an das backend gehen, so dass kein CORS notwendig ist

# Funktionalitäten im Backend:
- Endpoints für das Erstellen eines Benutzerkontos + Login (Authentifizierung)
- CRUD Endpoints für die Notes, welche dann Authentifizierung benötigen
- Benutzer sollen in postgres verwaltet werden (also keine managend Auth-Lösung sondern from scratch)
- Notes sollen auch in Postgres verwaltet werden

# Technik im Backend:
- gerne Lombok benutzen
- Validierungen einbauen
- Entities für User und Notes (falls noch was anderes benötigt wird, auch gerne)
- kein spring data rest benutzen, sondern Endpoints manuell erstellen