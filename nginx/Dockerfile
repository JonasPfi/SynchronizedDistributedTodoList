# Use the latest nginx image as the base
FROM nginx:latest

# Copy the nginx configuration template and startup script into the image
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY start-nginx.sh /docker-entrypoint.d/start-nginx.sh

# Make the startup script executable
RUN chmod +x /docker-entrypoint.d/start-nginx.sh

# Set the entry point to the startup script
ENTRYPOINT ["sh", "/docker-entrypoint.d/start-nginx.sh"]
