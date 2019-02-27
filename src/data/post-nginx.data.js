export default {
  "type": "root",
  "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Installing Nginx on Ubuntu in AWS",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "spacer",
      "childNodes": [],
      "content": "",
      "id": ""
    },
    {
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Pass Routing Responsibilies up to the Browser (React Router) - Part 2 - installing ",
          "id": ""
        },
        {
          "type": "code",
          "childNodes": [],
          "content": "nginx",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Building on the ",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "last post about React Router",
                  "id": ""
                }
              ],
              "content": "/posts/react-router",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and the rewrite configuration we used for ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack-dev-server",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " we'll now move to using a webserver better suited for production: ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "nginx",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/docs/",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Ok, is ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " installed on my AWS box?",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ which nginx",
        "$"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "That means no. K, we gotta do that first...",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "spacer",
      "childNodes": [],
      "content": "",
      "id": ""
    },
    {
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Installing ",
          "id": ""
        },
        {
          "type": "code",
          "childNodes": [],
          "content": "nginx",
          "id": ""
        },
        {
          "type": "text",
          "childNodes": [],
          "content": " on Ubuntu on an AWS EC2",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Ok, let's install it.  How?  I'm using Ubuntu on AWS, how do I get version information? ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "lsb_release -a",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ lsb_release -a",
        "No LSB modules are available.",
        "Distributor ID:\tUbuntu",
        "Description:\tUbuntu 18.04.1 LTS",
        "Release:\t18.04",
        "Codename:\tbionic",
        "$"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Great, what's the best way to install stuff in Ubuntu?  If you said, \"compile from source\" then we should hang out.  Not today because I want to get this post done but, seriously, let's get coffee.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "In addition to hand-built ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "we have some options",
                  "id": ""
                }
              ],
              "content": "https://help.ubuntu.com/lts/serverguide/package-management.html.en",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  Ubuntu is a flavor of ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Debian",
                  "id": ""
                }
              ],
              "content": "https://www.debian.org/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and so ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "dpkg",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " is the local-only package management tool.  Run a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "dpkg -l",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to see what's installed on your system.  I don't see ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " in that list and I don't have a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx.deb",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " lying around so, I'd like to use a tool that can consult package repositories on the interwebs.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "I could download the current stable version ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "1.14.2",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "here",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/download.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " but, if it had dependencies, I'd have to go download those too.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "code",
              "childNodes": [],
              "content": "apt",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " it is.  The ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "apt",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " command is a ",
              "id": ""
            },
            {
              "type": "italic",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "\"powerful command-line tool, which works with Ubuntu's Advanced Packaging Tool (APT)\"",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  Since I like to consider myself both advanced and powerful - this is the tool for me!",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "code",
              "childNodes": [],
              "content": "apt help",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " will show you the 'most used commands' and a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "man apt",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " will take you to the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "man pages",
                  "id": ""
                }
              ],
              "content": "https://linux.die.net/man/8/apt",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "code",
              "childNodes": [],
              "content": "apt search nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " will list many packages.  If you're like me, you'll be intrigued by the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx-light",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " package as it seems to meet all current needs of this application.  I'm going to resist the temptation to go minimalist and just install the 'virtual' package ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " which will first look for ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx-core",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Running ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo apt update",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " produced a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " error:",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ sudo apt update",
        "Get:1 https://dl.yarnpkg.com/debian stable InRelease [13.3 kB]",
        "Hit:2 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic InRelease",
        "Get:3 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic-updates InRelease [88.7 kB]",
        "Get:4 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic-backports InRelease [74.6 kB]",
        "Err:1 https://dl.yarnpkg.com/debian stable InRelease",
        "The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E",
        "Get:5 http://security.ubuntu.com/ubuntu bionic-security InRelease [88.7 kB]",
        "Fetched 252 kB in 1s (326 kB/s)",
        "Reading package lists... Done",
        "Building dependency tree",
        "Reading state information... Done",
        "85 packages can be upgraded. Run 'apt list --upgradable' to see them.",
        "W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://dl.yarnpkg.com/debian stable InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E",
        "W: Failed to fetch https://dl.yarnpkg.com/debian/dists/stable/InRelease  The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E",
        "W: Some index files failed to download. They have been ignored, or old ones used instead."
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Huh?  What does ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " have to do with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "apt",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": "?  Somewhere in my past I must have copy/pasted some code from a random blog post like this one...",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "If I do a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "cat /etc/apt/sources.list",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " I see a bunch of ubuntu repo urls, but it also informs me of this:",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ cat /etc/apt/sources.list",
        "## Note, this file is written by cloud-init on first boot of an instance",
        "## modifications made here will not survive a re-bundle.",
        "## if you wish to make changes you can:",
        "## a.) add 'apt_preserve_sources_list: true' to /etc/cloud/cloud.cfg",
        "##     or do the same in user-data",
        "## b.) add sources in /etc/apt/sources.list.d",
        "## c.) make changes to template file /etc/cloud/templates/sources.list.tmpl"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Item ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "b.)",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " looks interesting.  A quick ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "ls",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "cat",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " reveals...",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ ls /etc/apt/sources.list.d/",
        "yarn.list",
        "$ cat /etc/apt/sources.list.d/yarn.list",
        "deb https://dl.yarnpkg.com/debian/ stable main"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "A ha. looks like we'll consult the yarn repo everytime we do anything with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "apt",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  Good to know.  Oh yeah, I feel like this ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "looks familiar",
                  "id": ""
                }
              ],
              "content": "https://github.com/yarnpkg/yarn/issues/4453#issuecomment-329463752",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " from my local environment.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Now the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo apt update",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " has finished without complaining but, looks like we're still behind at version ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "1.14.0",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  I'm not super concerned with the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "updates between ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "1.14.0",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " and ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "1.14.2",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/CHANGES-1.14",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " but, I don't like starting out behind either.  Let's ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "add the nginx ubuntu package repo",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/linux_packages.html#stable",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to our source lists.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "First, I'll add a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx.list",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " file to the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/etc/apt/sources.list.d",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " directory and then add the signing key",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ sudo vi /etc/apt/sources.list.d/nginx.list",
        "$ cat /etc/apt/sources.list.d/nginx.list",
        "deb http://nginx.org/packages/ubuntu/ bionic nginx",
        "deb-src http://nginx.org/packages/ubuntu/ bionic nginx",
        "$ curl -sS http://nginx.org/keys/nginx_signing.key | sudo apt-key add -",
        "OK"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo apt update",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " worked with the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " repo and now a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "apt show nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " shows we're at version ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "1.14.2",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Run a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo apt install nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and confirm with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "dpkg -l | grep nginx",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ sudo apt install nginx",
        "Reading package lists... Done",
        "Building dependency tree",
        "Reading state information... Done",
        "The following packages were automatically installed and are no longer required:",
        "libpython-stdlib libpython2.7-minimal libpython2.7-stdlib python python-cliapp python-markdown python-minimal python-ttystatus python-yaml python2.7 python2.7-minimal",
        "Use 'sudo apt autoremove' to remove them.",
        "The following NEW packages will be installed:",
        "nginx",
        "0 upgraded, 1 newly installed, 0 to remove and 86 not upgraded.",
        "Need to get 836 kB of archives.",
        "After this operation, 2933 kB of additional disk space will be used.",
        "Get:1 http://nginx.org/packages/ubuntu bionic/nginx amd64 nginx amd64 1.14.2-1~bionic [836 kB]",
        "Fetched 836 kB in 2s (525 kB/s)",
        "Selecting previously unselected package nginx.",
        "(Reading database ... 113267 files and directories currently installed.)",
        "----------------------------------------------------------------------",
        "Thanks for using nginx!",
        "Please find the official documentation for nginx here:",
        "* http://nginx.org/en/docs/",
        "Please subscribe to nginx-announce mailing list to get",
        "the most important news about nginx:",
        "* http://nginx.org/en/support.html",
        "Commercial subscriptions for nginx are available on:",
        "* http://nginx.com/products/",
        "----------------------------------------------------------------------",
        "Unpacking nginx (1.14.2-1~bionic) ...",
        "Processing triggers for ureadahead (0.100.0-20) ...",
        "Setting up nginx (1.14.2-1~bionic) ...",
        "Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /lib/systemd/system/nginx.service.",
        "Processing triggers for systemd (237-3ubuntu10.11) ...",
        "Processing triggers for man-db (2.8.3-2) ...",
        "Processing triggers for ureadahead (0.100.0-20) ...",
        "$ dpkg -l | grep nginx",
        "ii  nginx                          1.14.2-1~bionic                   amd64        high performance web server"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Great, version ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "1.14.2",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " is now installed.  It's not running yet (run a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "service --status-all",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to verify that), so ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo service nginx start",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " should get us in business.  Fail.  But, we get some useful information about how to view logs",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "ol",
          "childNodes": [
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "systemctl status nginx.service",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "journalctl -xe",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " - this is funny to see all the ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "sshd",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " logs of hack attempts",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ sudo service nginx start",
        "Job for nginx.service failed because the control process exited with error code.",
        "See \"systemctl status nginx.service\" and \"journalctl -xe\" for details.",
        "$ systemctl status nginx.service",
        "● nginx.service - nginx - high performance web server",
        "Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)",
        "Active: failed (Result: exit-code) since Sun 2019-01-27 23:23:58 UTC; 5h 21min ago",
        "Docs: http://nginx.org/en/docs/",
        "Process: 26507 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=1/FAILURE)",
        "Jan 27 23:23:56 ip-172-30-1-128 systemd[1]: Starting nginx - high performance web server...",
        "Jan 27 23:23:56 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
        "Jan 27 23:23:56 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
        "Jan 27 23:23:57 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
        "Jan 27 23:23:57 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
        "Jan 27 23:23:58 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
        "Jan 27 23:23:58 ip-172-30-1-128 nginx[26507]: nginx: [emerg] still could not bind()",
        "Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: nginx.service: Control process exited, code=exited status=1",
        "Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: nginx.service: Failed with result 'exit-code'.",
        "Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: Failed to start nginx - high performance web server."
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Oh yeah, forgot to shutdown the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack-dev-server",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " which is still running as a background process attached to port 80",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Running ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "killall -9 node",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " should do the trick. ",
              "id": ""
            },
            {
              "type":   "a",
              "childNodes":
                [
                  {
                    "type": "text",
                    "childNodes": [],
                    "content": "Here's a good article on how to kill processes",
                    "id": ""
                  }
                ],
              "content": "https://www.thegeekstuff.com/2009/12/4-ways-to-kill-a-process-kill-killall-pkill-xkill/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ". There were three processes named ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "node",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " - I'm assuming one for the main ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack-dev-server",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and 2 child processes for change detection & rebuilding bundles for hot reloading.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "🐎 Tangent: Here's ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "an interesting article about creating child processes in ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "node",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " and communicating between them using ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "ipc",
                  "id": ""
                }
              ],
              "content": "https://medium.com/@NorbertdeLangen/communicating-between-nodejs-processes-4e68be42b917",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  If you're really interested in IPC then ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Steven's Unix Network Programming Volume 2",
                  "id": ""
                }
              ],
              "content": "https://www.amazon.com/UNIX-Network-Programming-Interprocess-Communications/dp/0132974290",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " is a great resource.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Let's try ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo service nginx start",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " again... Get the prompt back after a short wait.  In linux no news is good news.  ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "tail -f /var/log/nginx/access.log",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and visit ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "http://dubaniewi.cz",
                  "id": ""
                }
              ],
              "content": "http://dubaniewi.cz",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and we should see a log entry and get the default welcome.html...",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "$ sudo service nginx start",
        "$ tail -f /var/log/nginx/",
        "access.log  error.log",
        "$ tail -f /var/log/nginx/access.log",
        "108.233.248.51 - - [28/Jan/2019:06:12:42 +0000] \"GET / HTTP/1.1\" 200 612 \"-\" \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:64.0) Gecko/20100101 Firefox/64.0\" \"-\"",
        "108.233.248.51 - - [28/Jan/2019:06:12:56 +0000] \"GET / HTTP/1.1\" 200 612 \"-\" \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:64.0) Gecko/20100101 Firefox/64.0\" \"-\""
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Ok, we're in business.  Now on to configuring ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to serve our ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " bundled application",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "That's about enough for right now.  We learned a little more about installing stuff in Ubuntu and ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "nginx",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " packages.",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "quote",
      "childNodes": [],
      "quote": "This process of digging up the details and learning how things work leads down many side streets and to many dead ends, but is fundamental (I think) to understanding something new. ",
      "url": "http://www.kohala.com/start/rstevensfaq.html",
      "author": "-W Richard Stevens on \"Why did you write UNIX Network Programming?\"",
      "context": "",
    },
    {
      "type": 'postlink',
      "to": "/posts/nginx-first-config",
      "content": "Basic Nginx config for a React app with React Router",
    }
  ],
  "content": "",
  "id": "",
  "canonical": "nginx",
  "tags": []
}
