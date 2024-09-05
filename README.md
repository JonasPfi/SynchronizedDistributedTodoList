# ToDoList Project

Dieses Projekt verwendet Docker-Compose, um eine ToDo-Liste-Anwendung zu orchestrieren, die mehrere Microservices umfasst. Die Architektur besteht aus Backend-Servern, einem Socket-Server, einer Datenbank, Redis, einem Frontend, einem Nginx-Proxy und phpMyAdmin.

## Verzeichnisstruktur

- `./server` - Quellcode für die Backend-Server.
- `./socket-server` - Quellcode für die Socket-Server.
- `./db` - Dockerfile und Konfiguration für die MySQL-Datenbank.
- `./frontend` - Quellcode für das Frontend.
- `./nginx` - Nginx-Konfiguration.

## Dienste

- **server-1** und **server-2**: Backend-Server, die Anfragen bearbeiten und auf MySQL zugreifen.
- **socket-server-1** und **socket-server-2**: Socket.IO-Server für Echtzeit-Kommunikation.
- **todolistdb**: MySQL-Datenbank für die Anwendung.
- **phpmyadmin**: Web-Interface für die Verwaltung der MySQL-Datenbank.
- **frontend**: Frontend-Anwendung.
- **nginx**: Nginx-Proxy, der Anfragen an die Backend-Server und das Frontend weiterleitet.
- **redis**: Redis-Datenbank für die Speicherung von Echtzeit-Daten.

## Installation und Ausführung

### Voraussetzungen

- [Docker](https://www.docker.com/get-started) und [Docker Compose](https://docs.docker.com/compose/install/) müssen installiert sein.

### Schritte

1. **Repository klonen**

   ```bash
   git clone https://github.com/JonasPfi/verteilte-systeme-projekt.git
   cd verteilte-systeme-projekt
   ```

2. **.env-Datei erstellen**

   Kopiere die `.env.example`-Datei und passe die Werte an deine Umgebung an:

   ```bash
   cp .env.example .env
   ```

3. **Docker-Container starten**

   Starte die Docker-Container im Hintergrund:

   ```bash
   docker-compose up -d
   ```

4. **Überprüfen**

   - **phpMyAdmin**: [http://localhost:8085](http://localhost:8085)
   - **Nginx**: [http://localhost:80](http://localhost:80)

5. **Logs ansehen**

   Um die Logs eines bestimmten Containers zu sehen:

   ```bash
   docker-compose logs <SERVICE_NAME>
   ```

   Beispiel:

   ```bash
   docker-compose logs frontend
   ```

6. **Container stoppen**

   Um alle Container zu stoppen und zu entfernen:

   ```bash
   docker-compose down
   ```

## Umgebungsvariablen

Die `.env`-Datei enthält folgende Variablen:

- `MYSQL_DATABASE` - Name der MySQL-Datenbank.
- `MYSQL_USER` - Benutzername für die MySQL-Datenbank.
- `MYSQL_PASSWORD` - Passwort für die MySQL-Datenbank.
- `MYSQL_HOSTNAME` - Hostname für die MySQL-Datenbank.
- `FRONTEND_PORT` - Port für das Frontend.
- `FRONTEND_URL` - URL für das Frontend.
- `SERVER_PORT` - Port für die Backend-Server.
- `SERVER_URL` - URL für die Backend-Server.
- `SOCKET_IO_PORT` - Port für die Socket.IO-Server.
- `SOCKET_IO_URL` - URL für die Socket.IO-Server.
- `VITE_NGINX_URL` - URL für Nginx.
- `REDIS_PORT` - Port für Redis.

Ports müssen unter Umständen in der docker-compose.yaml & nginx.conf Datei angepasst werden!

## Mitwirkende

- Jonas Pfingstag 
- Julian Schurr
