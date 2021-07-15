FROM node:alpine

WORKDIR /app

COPY ./package.json ./package-lock.json* /app/ 

RUN npm install

COPY ./ /app 

CMD ["node","backend/db/queue/worker"]