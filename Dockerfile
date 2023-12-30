FROM node:16.13.0

RUN apt-get update && apt-get install -y mongodb-clients && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY package*.json ./

RUN apt-get update

RUN npm install

COPY . .

EXPOSE 3000

CMD node server.js
