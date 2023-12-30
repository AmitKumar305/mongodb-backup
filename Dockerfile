FROM node:16.13.0

WORKDIR /usr/src

COPY package*.json ./

RUN yum update -y && \
    yum install -y nano

RUN npm install

COPY . .

EXPOSE 3000

CMD node server.js
