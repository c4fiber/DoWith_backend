# Use an official Node.js runtime as a parent image
FROM node:20.9-alpine AS builder

WORKDIR /src
COPY package*.json .
RUN npm install

# app
FROM node:20.9-alpine

# >>> dowith default
RUN npm install -g cross-env

RUN mkdir -p /app/public/group-image
RUN mkdir -p /app/public/images
# <<< dowith default

RUN apk add --no-cache tzdata
ENV TZ Asia/Seoul

EXPOSE 3000
# execute only one time (also ENTRYPOINT, too)
CMD [ "npm", "run", "start:dev" ]

WORKDIR /app
COPY --from=builder /src/node_modules/ /app/node_modules/
COPY . /app

