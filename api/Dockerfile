FROM node:12

WORKDIR /api/
COPY ./api/ /api/
# copy shared library code
COPY ./common/ /common/

ENV NODE_ENV=production
RUN yarn

# multi-staged builds save space!
FROM node:12-slim

WORKDIR /usr/local/api/
COPY --from=0 /api/ /usr/local/api/
# copy shared library code
COPY --from=0 /lib /usr/local/common/
RUN mkdir /usr/local/logs

ENV NODE_ENV=production
EXPOSE 3001
CMD ["yarn", "start"]
