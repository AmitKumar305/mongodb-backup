FROM node:16.13.0

RUN apt-get update \
    && apt-get install -y gnupg \
    && apt-get install -y wget \
    && wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
    && echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/5.0 main" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY package*.json ./

RUN apt-get update

RUN npm install

COPY . .

EXPOSE 3000

CMD node server.js
