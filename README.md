# ToDoList Project

This project uses Docker-Compose to orchestrate a ToDo list application that encompasses several microservices. The architecture consists of backend servers, a socket server, a database, Redis, a frontend, an Nginx proxy, and phpMyAdmin.

## Directory Structure

- `./server` - Source code for the backend servers.
- `./socket-server` - Source code for the socket servers.
- `./db` - Dockerfile and configuration for the MySQL database.
- `./frontend` - Source code for the frontend.
- `./nginx` - Nginx configuration.

## Services

- **server-1**: Backend servers that handle requests and access MySQL.
- **socket-server-1**: Socket.IO server for real-time communication.
- **todolistdb**: MySQL database for the application.
- **phpmyadmin**: Web interface for managing the MySQL database.
- **frontend**: Frontend application.
- **nginx**: Nginx proxy that forwards requests to the backend servers and frontend.
- **redis**: Redis database for real-time data storage.

## Installation and Running

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) must be installed.

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/JonasPfi/SynchronizedDistributedTodoList.git
   ```

2. **Create .env File**

   Copy the `.env.example` file and adjust the values for your environment:

   ```bash
   cp .env.example .env
   ```

3. **Start Docker Containers**

   Start the Docker containers in the background:

   ```bash
   docker-compose up -d
   ```

4. **Check**

   - **phpMyAdmin**: [http://localhost:8085](http://localhost:8085)
   - **Nginx**: [http://localhost:80](http://localhost:80)

5. **View Logs**

   To view the logs of a specific container:

   ```bash
   docker-compose logs <SERVICE_NAME>
   ```

   Example:

   ```bash
   docker-compose logs frontend
   ```

6. **Stop Containers**

   To stop and remove all containers:

   ```bash
   docker-compose down
   ```

## Environment Variables

The `.env` file contains the following variables:

- `MYSQL_DATABASE` - Name of the MySQL database.
- `MYSQL_USER` - Username for the MySQL database.
- `MYSQL_PASSWORD` - Password for the MySQL database.
- `MYSQL_HOSTNAME` - Hostname for the MySQL database.
- `FRONTEND_PORT` - Port for the frontend.
- `FRONTEND_URL` - URL for the frontend.
- `SERVER_PORT` - Port for the backend servers.
- `SERVER_URL` - URL for the backend servers.
- `SOCKET_IO_PORT` - Port for the Socket.IO servers.
- `SOCKET_IO_URL` - URL for the Socket.IO servers.
- `VITE_NGINX_URL` - URL for Nginx.
- `REDIS_PORT` - Port for Redis.

Ports may need to be adjusted in the docker-compose.yaml & nginx.conf files!

## Contributors

- Jonas Pfingstag 
- Julian Schurr