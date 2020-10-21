# multi-staged builds save space!
FROM nginx:alpine

# serve up my lil homepage
COPY ["src/jason.html","/var/www/"]
# copy any other one-off static assets here

# put nginx.conf in place
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443
