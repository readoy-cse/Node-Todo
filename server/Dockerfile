FROM node:26-slim as dev

WORKDIR /server

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5000
CMD [ "npm", "run", "dev", "--", "--host" ]

FROM node:26-slim as prod

WORKDIR /server

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=dev /server/src ./src
EXPOSE 5000
CMD [ "npm", "run", "build" ]
