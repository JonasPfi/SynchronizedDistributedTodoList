#!/bin/sh

# Replace placeholders in the nginx template with environment variables
envsubst '${SOCKET_IO_HOST} ${SOCKET_IO_PORT} ${FRONTEND_HOST} ${FRONTEND_PORT} ${SERVER_HOST} ${SERVER_PORT} ${NGINX_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;'
