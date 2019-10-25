FROM node:12-alpine

ENV NODE_ENV=production

WORKDIR /work
COPY assets /work/assets/
COPY src /work/src/
COPY ["yarn.lock","webpack.config.js","package.json",".babelrc","/work/"]

RUN yarn; \
 yarn build-prod;

# serve up my lil homepage
COPY src/jason.html /work/dist/

# multi-staged builds save space!
FROM nginx:alpine

COPY --from=0 /work/dist /var/www
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
