#!/bin/bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow www
ufw allow mysql
ufw allow 3000/tcp
ufw allow 3001/tcp