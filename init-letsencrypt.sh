#!/bin/bash
# copied from https://raw.githubusercontent.com/wmnnd/nginx-certbot/master/init-letsencrypt.sh

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=(filbert.xyz www.filbert.xyz api.filbert.xyz dubaniewi.cz www.dubaniewi.cz jason.dubaniewi.cz tinsey.app www.tinsey.app tinzey.app www.tinzey.app)
rsa_key_size=4096
data_path="./data/certbot"
# NOTE: cert files will be stored in a directory named by the first string in the $domains{@} array
# NOTE: $container_path is the directory referenced in nginx.conf
container_path="/etc/letsencrypt/live/${domains[0]}"
email="jason@dubaniewi.cz" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  read -p "Existing data found in $data_path. Continue and replace existing certificates? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi


if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for ${domains[@]} ..."
# NOTE: this creates ONE certificate file for all domains in the array above
mkdir -p "$data_path/conf/live/${domains[0]}"
mkdir -p "$data_path/www"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:1024 -days 1\
    -keyout '$container_path/privkey.pem' \
    -out '$container_path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo


echo "### Starting nginx ..."
docker-compose up -d --build frontend
echo

echo "### Deleting dummy certificate in /${domains[0]} ..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${domains[0]} && \
  rm -Rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -Rf /etc/letsencrypt/renewal/${domains[0]}" certbot
echo


echo "### Requesting Let's Encrypt certificate for ${domains[@]} ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot

echo
echo "### Reloading nginx ..."
docker-compose exec frontend nginx -s reload
