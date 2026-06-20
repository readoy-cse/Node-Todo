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
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["/bin/sh", "-c", "printf '{\"service\":\"frontend\",\"status\":\"online\",\"podName\":\"%s\",\"nodeName\":\"%s\",\"namespace\":\"%s\"}' \"${POD_NAME:-$HOSTNAME}\" \"${NODE_NAME:-local-machine}\" \"${POD_NAMESPACE:-local}\" > /usr/share/nginx/html/runtime.json && nginx -g 'daemon off;'"]
