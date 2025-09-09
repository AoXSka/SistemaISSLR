FROM node:20-bullseye AS base

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    gcc \
    libc6-dev \
    libnss3-dev \
    libgconf-2-4 \
    libxss1 \
    libappindicator1 \
    fonts-liberation \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Wine for Windows builds (if needed)
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y wine64 wine32 && \
    rm -rf /var/lib/apt/lists/*

# Configure environment for native compilation
ENV PYTHON=/usr/bin/python3
ENV CC=gcc
ENV CXX=g++
ENV npm_config_build_from_source=true
ENV npm_config_cache=/tmp/.npm
ENV ELECTRON_CACHE=/tmp/.electron
ENV ELECTRON_BUILDER_CACHE=/tmp/.electron-builder

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY .npmrc ./

# Install dependencies with native compilation
RUN npm ci --omit=optional && \
    npm cache clean --force

# Stage for building the application
FROM base AS builder

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Verify dist directory exists
RUN ls -la dist/ && test -f dist/index.html

# Rebuild native modules for Electron
RUN npm run rebuild || echo "Rebuild failed, continuing..."

# Build Electron app for Windows
RUN npm run dist:win || echo "Electron build failed"

# List what was created
RUN ls -la release/ || echo "No release directory"

# Final stage - extract artifacts
FROM alpine:latest AS extractor
WORKDIR /output
COPY --from=builder /app/release ./
CMD ["sh", "-c", "ls -la && cp *.exe /output/ 2>/dev/null || echo 'No executables found'"]