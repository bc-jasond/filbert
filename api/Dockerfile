FROM node:12

WORKDIR /api/
COPY . /api/

ENV NODE_ENV=production
RUN yarn

# multi-staged builds save space!
FROM node:12-slim

WORKDIR /usr/local/
COPY --from=0 /api/ /usr/local/
RUN mkdir /usr/local/logs

ENV NODE_ENV=production
EXPOSE 3001
CMD ["yarn", "start"]
