# Use Node.js 22 alpine for a smaller image size
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies provided in package.json
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
