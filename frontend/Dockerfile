# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --maxsockets 1 --no-audit

# Copy source code
COPY . .

# Build the application with memory limit and reduced optimization
ENV NODE_OPTIONS="--max_old_space_size=1024"
RUN npm run build -- --configuration production --source-map=false

# Stage 2: Runtime
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist/skillhub-frontend /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
