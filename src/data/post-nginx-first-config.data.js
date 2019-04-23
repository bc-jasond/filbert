export default {
  "type": "root",
  "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Basic Nginx config for a React app with React Router",
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
          "content": "Pass Routing Responsibilies up to the Browser (React Router) - Part 3 - replace ",
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
          "content": " with ",
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
              "content": "Last time we ",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "installed Nginx on our Ubuntu AWS EC2",
                  "id": ""
                }
              ],
              "content": "/posts/nginx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and we fired it up to see the test page.  In this post, we'll take a look at how to serve our webpack bundles and other static assets.",
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
              "content": "First, let's get some info about ",
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
              "content": " by running a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "service nginx status",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ":",
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
        "$ service nginx status",
        "● nginx.service - nginx - high performance web server",
        "Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)",
        "Active: active (running) since Thu 2019-02-21 20:06:34 UTC; 4min 18s ago",
        "Docs: http://nginx.org/en/docs/",
        "Process: 26712 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)",
        "Main PID: 26713 (nginx)",
        "Tasks: 2 (limit: 547)",
        "CGroup: /system.slice/nginx.service",
        "├─26713 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf",
        "└─26714 nginx: worker process",
        "Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: Starting nginx - high performance web server...",
        "Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: nginx.service: Can't open PID file /var/run/nginx.pid (yet?) after start: No such file or directory",
        "Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: Started nginx - high performance web server."
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
              "content": "Lots of great info here: uptime, number of processes (workers), start command, documentation.  All of this looks good for now, let's have a look at the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/etc/nginx/nginx.conf",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " which will be our entrypoint into ",
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
              "content": " configuration",
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
              "content": "Incidentally, ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "htop",
                  "id": ""
                }
              ],
              "content": "http://hisham.hm/htop/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " which was already available on my AWS EC2 box is a great tool for process viewing & management",
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
              "content": "Here's what's in my ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/etc/nginx/nginx.conf",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " by default:",
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
        "user  nginx;",
        "worker_processes  1;",
        "error_log  /var/log/nginx/error.log warn;",
        "pid        /var/run/nginx.pid;",
        "events {",
        "    worker_connections  1024;",
        "}",
        "http {",
        "    include       /etc/nginx/mime.types;",
        "    default_type  application/octet-stream;",
        "    log_format  main  '$remote_addr - $remote_user [$time_local] \"$request\" '",
        "    '$status $body_bytes_sent \"$http_referer\" '",
        "    '\"$http_user_agent\" \"$http_x_forwarded_for\"';",
        "    access_log  /var/log/nginx/access.log  main;",
        "    sendfile        on;",
        "    #tcp_nopush     on;",
        "    keepalive_timeout  65;",
        "    #gzip  on;",
        "    include /etc/nginx/conf.d/*.conf;",
        "}"
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
              "content": "Here we can configure 'global' settings for all ",
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
              "content": " processes: how many workers, how many connections per worker, what user the processes run as, the log format and more.",
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
              "content": "For our 'up and running' purposes, the interesting part is that this main config will include anything in the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/etc/nginx/conf.d",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " directory that has a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "*.conf",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " suffix.  So this is where we can include our specific ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "server {}",
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
              "content": "location {}",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " directives for specific routing or 'reverse proxying' of ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "HTTP",
                  "id": ""
                }
              ],
              "content": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " requests to files in our filesystem or even to other network locations.",
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
              "content": "Looks like there's already a starter ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/etc/nginx/conf.d/default.conf",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  Here's the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "beginner's guide",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/docs/beginners_guide.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " I bet that will get us in business.  Another useful link is ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "How ",
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
                  "content": " processes requests",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/docs/http/request_processing.html",
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
              "content": "With just one change to the existing ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "default.conf",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", serving the root route ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "index.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " or ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "http://dubaniewi.cz/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " is working.  For my project the config looks like this:",
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
        "server {",
        "  listen       80;",
        "  server_name  *.dubaniewi.cz;",
        "  location / {",
        "    root   /home/ubuntu/dubaniewicz-site/dist;",
        "    index  index.html index.htm;",
        "  }",
        "}"
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
              "content": "All that I changed was the filesystem document root to the directory containing my ",
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
              "content": " build artifacts, in this case it's ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/home/ubuntu/dubaniewicz-site/dist",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  This works for routing to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and clicking around on React ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Link>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": "s but, if I try to reload the page ",
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
              "content": " sends a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "404",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".",
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
              "content": "Why is that?  If we recall, React Router is listening for changes to the History object and then rendering components based on the new location.  That means we're not actually hitting the server, because we've loaded all pages for the application up front and now we just render them using JS to 'rebuild' the DOM.  When we do a hard refresh it sends the current URL back to the server and ",
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
              "content": " will look for files that don't exist.",
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
              "content": "If we do a refresh at ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "http://dubaniewi.cz/posts/hello-world",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " we'll see the following entry in the Nginx ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/var/log/nginx/error.log",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ":",
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
        "2019/02/21 22:01:19 [error] 27935#27935: *1 open() \"/home/ubuntu/dubaniewicz-site/dist/posts/hello-world\" failed (2: No such file or directory), client: 52.119.126.134, server: *.dubaniewi.cz, request: \"GET /posts/hello-world HTTP/1.1\", host: \"dubaniewi.cz\""
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
              "content": "Nginx took the root ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/home/ubuntu/dubaniewicz-site/dist",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and concatenated the URI ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/posts/hello-world",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and then looked for that file in the filesystem, didn't find it and returned the 404 response",
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
              "content": "This sounds familiar from the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack-dev-server",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "configuration step",
                  "id": ""
                }
              ],
              "content": "/posts/react-router",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  That was for Express.  Similarily, we'll need to configure Nginx to first look for files in the filesystem and then just pass it forward to React Router AKA ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "index.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".",
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
              "content": "  We can accomplish this task with one more line of configuration in the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "location {}",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " block directive using the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "try_files",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " directive",
                  "id": ""
                }
              ],
              "content": "http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  We'll just replace the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "index",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " directive with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "try_files",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " like so:",
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
        "server {",
        "  listen       80;",
        "  server_name  *.dubaniewi.cz;",
        "  location / {",
        "    root   /home/ubuntu/dubaniewicz-site/dist;",
        "    #index  index.html index.htm;",
        "    try_files $uri /index.html;",
        "  }",
        "}"
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
              "content": "So, now nginx will look at the filesystem and directly serve our JS & font files like ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "main.9f4344101576a79cdce0.js",
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
              "content": "/fonts/charter-italic-webfont.woff",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " otherwise it will just serve ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "index.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and React Router will try to find a match or serve it's 404",
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
              "content": "Great, now we can decommission the production version of ",
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
              "content": " in favor of our brand new iron-clad-1-worker-1024-max-connections Nginx production system!  Massive scale.  I wonder where the box falls over?  Probably under 1024 simultaneous connections...  Kill all ",
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
              "content": " processes and run a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo service nginx restart",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (this is needed everytime we make a change to a config file - not however, for updating files being served i.e. copying new files to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/dist",
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
              "content": "Here's what the build / deploy steps look like now:",
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
                  "content": "ssh ubuntu@dubaniewi.cz",
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
                  "content": "cd dubaniewicz-site",
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
                  "content": "git checkout master ; git pull",
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
                  "content": "yarn ; yarn build-prod",
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
                  "type": "text",
                  "childNodes": [],
                  "content": "visit ",
                  "id": ""
                },
                {
                  "type": "link",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "http://dubaniewi.cz",
                      "id": ""
                    }
                  ],
                  "content": "/",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " in your favorite world wide web browser",
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
                  "type": "text",
                  "childNodes": [],
                  "content": "profit 💵💵💵",
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
                  "content": "We got a basic Nginx config up and running and it only required 2 changes to the starter config.  Now there's a basic manual develop / build / deploy workflow in place.  Next, I think it's time to serve some images.",
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
      ]
    },
    {
      "type": "quote",
      "childNodes": [],
      "quote": "The real problem is that programmers have spent far too much time worrying about efficiency in the wrong places and at the wrong times; premature optimization is the root of all evil (or at least most of it) in programming. ",
      "url": "https://dl.acm.org/citation.cfm?id=361612",
      "author": "-Donald Knuth",
      "context": " from \"Computer programming as an art\" p. 671 of CACM Dec 1974"
    },
    {
      "type": "postlink",
      "to": "/posts/display-images",
      "content": "Images - What's the Web without 'em?"
    }
  ],
  "content": "",
  "id": "",
  "canonical": "nginx-first-config",
  "tags": []
}