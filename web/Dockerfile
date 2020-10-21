FROM node:14

WORKDIR /filbert/
# this is run from the monorepo root
COPY ./package.json /filbert/
COPY ./yarn.lock /filbert/
# copy shared code imported via @filbert/foo
COPY ./lib/ /filbert/lib/
COPY ./web/ /filbert/web/

# "build time" ENVs must be set in Dockerfile via ARGs passed from docker-compose... fun
ARG node_env
ARG google_client_id
ARG encryption_key
ENV NODE_ENV=$node_env
ENV GOOGLE_API_FILBERT_CLIENT_ID=$google_client_id
ENV ENCRYPTION_KEY=$encryption_key

# NOTE: install of both devDependencies & dependencies required
RUN yarn install --production=false; \
  yarn sapper-build;

# multi-staged builds save space!
FROM node:14-slim

WORKDIR /usr/local/filbert/
COPY --from=0 /filbert/ /usr/local/filbert/
RUN mkdir /usr/local/logs

EXPOSE 3000
CMD ["yarn", "sapper-start"]
