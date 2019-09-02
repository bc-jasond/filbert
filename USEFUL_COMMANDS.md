# Useful Commands
#### Docker
```
# DB start
docker-compose up -d db

# DB get percona container id
export PERCONA_CONTAINER_NAME="${PWD##*/}_db_1"

# DB backup
docker exec $PERCONA_CONTAINER_NAME /usr/bin/mysqldump --databases dubaniewicz -uroot -p"$MYSQL_ROOT_PASSWORD" > ~/Dropbox/mysql\ dumps/`date +'%Y-%m-%d_%H%M'`.sql

# DB restore
docker exec -i $PERCONA_CONTAINER_NAME /usr/bin/mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < ~/Dropbox/mysql\ dumps/2019-07-07_1032.sql
```
