FROM node:alpine

EXPOSE 3000

WORKDIR /app

COPY ./package.json ./package-lock.json* /app/ 

RUN npm install

COPY ./ /app 

WORKDIR frontend

RUN npm install

RUN npm build

WORKDIR /app

CMD ["node","backend/server/www"]