FROM node:16.13.0

WORKDIR /src

COPY package*.json ./

RUN apt-get update
RUN apt-get install nano

RUN npm install

COPY . .

EXPOSE 3000

CMD node server.js
