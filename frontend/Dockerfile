# Dockerfile
# Use an official node image as the base image
FROM node:lts-alpine

# Define build arguments for environment variables
ARG VITE_NGINX_URL
ARG VITE_FRONTEND_PORT

# Set environment variables during the build process
ENV VITE_NGINX_URL=$VITE_NGINX_URL
ENV VITE_FRONTEND_PORT=$VITE_FRONTEND_PORT

# Set the working directory to /app inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port defined in .env to the outside world
EXPOSE $VITE_FRONTEND_PORT

# Build the React app
RUN npm run build

# Start the application
CMD ["npm", "run", "dev"]
