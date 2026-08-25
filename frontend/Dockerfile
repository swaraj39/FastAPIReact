# ============================================================
# Frontend production image (multi-stage build).
#
# Stage 1 "build": Node compiles React+TS -> static files in dist/.
# Stage 2 "serve": tiny nginx image serves ONLY those static files.
# The final image contains no Node, no source, no node_modules.
# ============================================================

# ---------- Stage 1: build the SPA ----------
FROM node:20-alpine AS build

WORKDIR /app

# Manifests first for layer caching: npm ci re-runs only when
# package.json / package-lock.json change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# `tsc -b && vite build`. Vite auto-loads .env.production here,
# so axios gets VITE_API_BASE_URL=/api baked into the bundle.
RUN npm run build


# ---------- Stage 2: serve with nginx ----------
FROM nginx:alpine

# Our server block: static serving + /api proxy + SPA fallback + gzip.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static output of the build stage. Nothing else comes along.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
