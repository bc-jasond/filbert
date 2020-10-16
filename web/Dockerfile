FROM node:14

WORKDIR /filbert/
# this is run from the monorepo root
COPY ./package.json /filbert/
COPY ./yarn.lock /filbert/
# copy shared code imported via @filbert/foo
COPY ./lib/ /filbert/lib/
COPY ./web/ /filbert/web/

RUN yarn;
ENV NODE_ENV=production
RUN yarn sapper-build;

# multi-staged builds save space!
FROM node:14-slim

WORKDIR /usr/local/filbert/
COPY --from=0 /filbert/ /usr/local/filbert/
RUN mkdir /usr/local/logs

EXPOSE 3000
CMD ["yarn", "sapper-start"]