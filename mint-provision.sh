#!/bin/bash
# Docker
# uninstall old versions of docker
sudo apt-get remove docker docker.io containerd runc ;
sudo apt-get update;
# Install packages to allow apt to use a repository over HTTPS:
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common;
# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - ;
# TODO: verify fingerprint
sudo apt-key fingerprint 0EBFCD88 ;
# Add Docker repository
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    focal \
   stable" ;
# update
sudo apt-get update ;
# install Docker
sudo apt-get install -y docker-ce docker-ce-cli containerd.io ;
# test
sudo docker run hello-world ;


# install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose ;
sudo chmod +x /usr/local/bin/docker-compose ;
