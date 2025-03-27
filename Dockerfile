# xrpl-evm-website.Dockerfile

# --- Build Stage ---
    FROM node:18-alpine AS builder
    WORKDIR /app
    
    # Copy package files and install dependencies.
    COPY package*.json pnpm-lock.yaml ./
    RUN npm install -g pnpm
    RUN pnpm install
    
    # Copy the entire website source.
    COPY . .
    
    # Build the Next.js app.
    RUN pnpm build
    
    # Export the site as static files (assumes your next.config.js is set for export).
    RUN pnpm export
    
    # --- Release Stage ---
    FROM nginx:latest AS release
    # Remove default Nginx content.
    RUN rm -rf /usr/share/nginx/html/*
    # Copy the exported static files.
    # (Assuming Next.js exported static files to the "out" directory.)
    COPY --from=builder /app/out /usr/share/nginx/html
    
    # Provide a custom Nginx configuration.
    COPY <<EOF /etc/nginx/conf.d/default.conf
    server {
        listen       80;
        server_name  localhost;
        root         /usr/share/nginx/html;
        index        index.html;
        location / {
            try_files \$uri \$uri/ /index.html;
        }
    }
    EOF
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    