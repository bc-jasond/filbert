# Useful Commands
#### Docker
```
# Rebuild/Restart frontend & api (not db)
# needs the following env vars set:
export MYSQL_ROOT_PASSWORD=example                       # <-- set for prod!
export ENCRYPTION_KEY="a41c6ce9ba97c0bfb50c3d67b8a81f9d" # <-- set for prod! rotate! must be 32 characters
docker-compose up --detach --build frontend api          # <-- note, this doesn't rebuild the db container

# DB start
docker-compose up -d db

# DB get percona container id
export PERCONA_CONTAINER_NAME="${PWD##*/}_db_1"

# DB backup
docker exec $PERCONA_CONTAINER_NAME /usr/bin/mysqldump --default-character-set=utf8mb4 --databases filbert -uroot -p"$MYSQL_ROOT_PASSWORD" > ~/Dropbox/mysql\ dumps/`date +'%Y-%m-%d_%H%M'`.sql

# DB restore
docker exec -i $PERCONA_CONTAINER_NAME /usr/bin/mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < ~/Dropbox/mysql\ dumps/2019-07-07_1032.sql
```
