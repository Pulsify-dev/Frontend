
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCKS
ARG VITE_USE_MOCK
ARG VITE_USE_MOCK_API
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
