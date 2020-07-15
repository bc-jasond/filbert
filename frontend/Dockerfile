FROM node:12-alpine

ENV NODE_ENV=production

WORKDIR /work
COPY assets /work/assets/
COPY src /work/src/
COPY ["yarn.lock","webpack-prod.config.js","package.json",".babelrc","/work/"]

RUN yarn --prod; \
 yarn build-prod;

# serve up my lil homepage
COPY ["src/jason.html","assets/site.webmanifest","/work/dist/"]
# favicons aren't bundled by webpack...
COPY assets/favicons /work/dist/favicons/
# vanilla CSS isn't bundled by webpack...
COPY assets/*.css /work/dist/

# multi-staged builds save space!
FROM nginx:alpine

COPY --from=0 /work/dist /var/www/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
