FROM node:10

COPY * /usr/local/

WORKDIR /usr/local/
RUN mkdir /usr/local/logs

ENV NODE_ENV=production
RUN yarn
EXPOSE 3001

CMD ["yarn", "start"]
