FROM node:22-alpine3.19

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["node", "dist/src/main.js"]

EXPOSE 4000
