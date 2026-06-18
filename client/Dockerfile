FROM node:26-slim as dev

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . .
EXPOSE 5173

CMD [ "npm", "run", "dev", "--", "--host" ]

FROM dev as build
RUN npm run build

FROM nginx:alpine as prod

COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
