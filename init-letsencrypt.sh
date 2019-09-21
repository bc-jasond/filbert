#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

rsa_key_size=4096
data_path="./data/certbot"
email="jasondebo@gmail.com" # Adding a valid address is strongly recommended
staging=1 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  read -p "Existing data found. Continue and replace existing certificate? (y/N) " decision
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

#echo "### Deleting dummy certificate for dubaniewi.cz ..."
#docker-compose run --rm --entrypoint "\
#  rm -Rf /etc/letsencrypt/live/dubaniewi.cz && \
#  rm -Rf /etc/letsencrypt/archive/dubaniewi.cz && \
#  rm -Rf /etc/letsencrypt/renewal/dubaniewi.cz.conf" certbot
#echo


# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly \
    --manual \
    --preferred-challenges=dns
    $staging_arg \
    $email_arg \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    -d dubaniewi.cz \
    -d *.dubaniewi.cz" certbot
echo

#echo "### Reloading nginx ..."
#docker-compose exec frontend nginx -s reload