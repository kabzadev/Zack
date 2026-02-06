# Frontend Dockerfile - uses pre-built local dist
FROM nginx:alpine

# Copy custom nginx config for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built assets from local dist folder
COPY dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]