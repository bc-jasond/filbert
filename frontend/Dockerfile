FROM nginx

ENV NODE_ENV=production

RUN yarn && yarn build-prod

ADD ./dist /usr/local/
ADD ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
