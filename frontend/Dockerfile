# Use an official node image as the base image
FROM node:lts-alpine

# Define build arguments for environment variables
ARG NGINX_URL
ARG FRONTEND_PORT

# Set environment variables during the build process
ENV NGINX_URL=$NGINX_URL
ENV FRONTEND_PORT=$FRONTEND_PORT

# Set the working directory to /app inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the React app
RUN npm run build

# Expose port defined in .env to the outside world
EXPOSE $FRONTEND_PORT

# Start the application
CMD ["npm", "run", "dev"]