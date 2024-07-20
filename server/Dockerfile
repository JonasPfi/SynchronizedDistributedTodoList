FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE $SERVER_PORT

# Workaround - wait for db to start about 30 sec.
# Fast PCs should be done in less than 20 sec.
# Increase number if it does not work on your PC.
# When the database is already created it should be 5 seconds.
CMD sleep 10; node server.js
