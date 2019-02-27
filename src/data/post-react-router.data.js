import { CodeSection } from '../common/shared-styled-components';

export default {
  "type": "root",
  "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Adding React Router",
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
          "content": "Pass Routing Responsibilies up to the Browser (React Router)",
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
              "content": "In order to ship ",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "my first blog post",
                  "id": ""
                }
              ],
              "content": "/posts/hello-world",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", I put all the content directly into ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "app.jsx",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  This essentially gave me only one route: ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/",
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
              "content": "Note: if you go to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "http://dubaniewi.cz/some/other/route",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "as of this commit",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/commit/faff0ffcda6b674e9483ce35af2dbae5500a8742",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " you'll see ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "Cannot GET /some/other/route",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ". This response is coming from Express via the ",
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
              "content": " (notice the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "X-Powered-By: Express",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " response header).  In a single-page app (SPA) we'll want to pass routing responsibilities up to the browser so we can use ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "React Router",
                  "id": ""
                }
              ],
              "content": "https://reacttraining.com/react-router/web/guides/quick-start",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " or any other javascript routing library that uses the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "HTML5 History API",
                  "id": ""
                }
              ],
              "content": "https://developer.mozilla.org/en-US/docs/Web/API/History",
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
              "content": "Fortunately, this makes for a pretty easy ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "devServer",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " config - forward all requests to one route.  This will also be a pretty easy ",
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
              "content": " config later on.",
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
              "content": "In ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack.config.js",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " we just need to add the following line to the existing ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "devServer",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " config: ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "historyApiFallback: true",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (there are more ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "devServer",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " options available ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "link to documentation",
                  "id": ""
                }
              ],
              "content": "https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ")",
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
              "content": "💡Remember: changes to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack.config.js",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " require a restart of the ",
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
              "content": "; they won't be detected",
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
        "module.exports = (env, argv) => {",
        "  const config = {",
        "    entry: ...,",
        "    output: ...,",
        "    module: ...,",
        "    devServer: }",
        "      contentBase: './dist',",
        "      host: '0.0.0.0',",
        "      disableHostCheck: true,",
        "      historyApiFallback: true, // this will pass all subroutes to the default 'index.html'",
        "      port: isProduction ? 80 : 8080,",
        "    },",
        "  }",
        "  return config;",
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
              "content": "You can confirm your configuration by looking for ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "ℹ ｢wds｣: 404s will fallback to /index.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " in the logs of ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn start",
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
        "jd@local ~/dev/dubaniewicz-site (post-react-router)*$ yarn start",
        "yarn run v1.12.3",
        "$ webpack-dev-server --hot --mode development",
        "ℹ ｢wds｣: Project is running at http://0.0.0.0:8080/",
        "ℹ ｢wds｣: webpack output is served from /",
        "ℹ ｢wds｣: Content not from webpack is served from ./dist",
        "ℹ ｢wds｣: 404s will fallback to /index.html",
        "ℹ ｢wdm｣: Hash: da8d74963faaef9b955b",
        "Version: webpack 4.28.2"
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
              "content": "But it still doesn't work. Now I'm getting 404s for the webpack bundles: ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "Loading failed for the <script> with source \“http://localhost:8080/some/other/main.da8d74963faaef9b955b.js\”",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": "  Looks like a zero-configuration ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "devServer",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " didn't work for us today and we'll need to add a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "rewrites",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " section",
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
              "content": "If you run ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn build-prod",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", you'll see there are currently three types of build artifacts: ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "*.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "*.woff",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", and ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "*.js",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  It makes sense to have routing rules for each type of file (and later images, too).  Yes, we could have one routing rule and let the filesystem (directory structure) organize the different types of files but, it doesn't hurt to be explicit.",
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
              "content": "The ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "node connect library that ",
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
                  "content": " uses",
                  "id": ""
                }
              ],
              "content": "https://github.com/bripkens/connect-history-api-fallback",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " allows a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "function",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to be passed as a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "to",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " parameter of a rewrite object.  This has access to the request and the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "parsedUrl",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  We'll use the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "parsedUrl",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to get the filename and then do a manual rewrite.",
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
              "content": "Once we have ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "rewrites for JS, fonts and, a default",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/commit/e53622f3f63b0e97e19299f49fdafef368688032",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " for all other routes - we can successfully load our SPA and then handle additional routing with React Router",
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
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Split Content into Page Components",
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
              "content": "Now it's time to split out content into pages.  The first version of this will be to have a page for this React Router post, the Hello World post and, an About page.",
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
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Here's the commit",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/commit/62135405685f5b4eacaad08a3eed3a7298ff3482",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " that demonstrates a way to do that",
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
              "content": "For now, I just imported ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "PostHelloWorld",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " into ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "App",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and hard coded it.  Currently, ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "About",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " isn't routable.",
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
          "content": "Install React Router",
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
              "content": "Installing React Router is straightforward from ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "the documentation",
                  "id": ""
                }
              ],
              "content": "https://reacttraining.com/react-router/web/guides/quick-start",
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
              "content": "For this project it's just ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn add react-router-dom",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (which will also install the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "react-router",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " base package.",
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
              "content": "So far, this project has the following routes:",
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
                  "type": "text",
                  "childNodes": [],
                  "content": "Homepage ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "/",
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
                  "content": "About ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "/about",
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
                  "content": "Blog Post: Hello World ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "/posts/hello-world",
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
                  "content": "Blog Post: React Router ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "/posts/react-router",
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
                  "content": "Not Found ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "/404",
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
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "What about the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/posts",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " base route?  Good question.  I think that would be a great place to list all blog posts in reverse chronological order... Before I do that I'd like to get blog content modelled, data persistence, a proper web server, etc.  But, I suppose I could just create a quick layout and hardcode it for now.  Ok, that's more 'ship it' like.",
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
              "content": "With routes defined it's now just a matter of wrapping the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "App",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " component in a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "BrowserRouter",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " component and filling it with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "Route",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " components",
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
              "content": "What? I know, this ",
              "id": ""
            },
            {
              "type": "italic",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Declarative",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " routing is strange if you're used to assigning strings to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "window.location",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " or ui-router from angular.js 1.x.  Rendering DOM elements to manipulate the History API is strange at first but, it's actually quite clean and elegant!",
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
              "type": "text",
              "childNodes": [],
              "content": "Of course there were some issues with our refactor.",
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
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "(Re)using a Layout Component",
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
              "content": "Motivation: Error: can't use ",
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
              "content": " outside of a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Router>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  I wanted to put ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Route>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " inside my styled ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Article>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " component because I had a basic layout with a header and footer that I didn't want to cut-n-paste into each page.  But, I also wanted to put a link to ",
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
              "content": " in the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Header>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " logo.  Error.  ",
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
              "content": " takes props passed down from ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<Router>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and it complained that no props were found...",
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
              "content": "Hmm, so how do I share markup down to child components so I can:",
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
                  "type": "text",
                  "childNodes": [],
                  "content": "Wrap a ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "Page",
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
                  "content": "Layout",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "; so I can then",
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
                  "content": "Wrap the ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "PageWithLayout",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " with the ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "BrowserRouter",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "; so I can then",
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
                  "content": "use the React Router components anywhere on the page.",
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
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "So far, I know of three ways to do it:",
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
                  "content": "props.children",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " - or just any old ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "props",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": ". Render some markup, then inside of a container(s) render the props like: ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "{props.children}",
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
                  "content": "{props.someOtherPropName}",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": ".  Here's an explanation ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "from the React documentation",
                      "id": ""
                    }
                  ],
                  "content": "https://reactjs.org/docs/composition-vs-inheritance.html",
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
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Higher Order Components",
                      "id": ""
                    }
                  ],
                  "content": "https://reactjs.org/docs/higher-order-components.html",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (HOCs for short) - or Components that 'wrap' other components and add (decorate) functionality by passing props to the inner component.  As an exercise, we'll use this pattern next. ",
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
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Render Props",
                      "id": ""
                    }
                  ],
                  "content": "https://reactjs.org/docs/render-props.html",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " - a component that takes it's ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "render()",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " function as a ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "prop",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " instead of defining it's own.  This is arguably the most confusing pattern to the newcomer because each component with a Render prop creates another ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Layer of Indirection (or abstraction)",
                      "id": ""
                    }
                  ],
                  "content": "https://en.wikipedia.org/wiki/Indirection",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": ".  But, it's a powerful patter that I'll explore after HOCs",
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
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Right now, there's no state to share just some markup.  This is easily achieved with the first pattern of passing child components as ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "props",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  So, that's what we'll do!",
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
              "content": "💡Remember: In the beginning, all of your problems will come from overusing code-sharing concepts like HOCs and Render props.  So, if you can stick to props and ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "follow this exercise to identify 'The Minimal (but complete) Representation of state'",
                  "id": ""
                }
              ],
              "content": "https://reactjs.org/docs/thinking-in-react.html#step-3-identify-the-minimal-but-complete-representation-of-ui-state",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " you can avoid problems created by solving problems that you don't have.",
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
              "content": "If you're used to an Imperative mental model of programming like me, React, Functional Programming and the Declarative model will take some time to get used to.  I believe that Imperative programming is easier to think about because it's more direct and less abstract.  But, it's also what I know - maybe that's why it's easier 🤷.",
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
              "content": "Be that as it may, React is not designed around the Imperative programming model and so let's not fight it.  The new concepts can be introduced slowly while still getting things done.  ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "props",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Event Handlers",
                  "id": ""
                }
              ],
              "content": "https://reactjs.org/docs/handling-events.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " will take us far.  The biggest trade-off will be writing more 'boilerplate' code to communicate between components.  That code is easy to reason about though, and if it stays consistent it will be easy to refactor with slick functional techniques later on.",
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
              "content": "Here's what ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "App",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " JSX looks like now:",
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
      "lines": [
      'const App = () => (',
      '  <React.Fragment>',
      '    <BrowserRouter>',
      '      <Switch>',
      '        <Redirect push exact from="/" to="/posts/hello-world" />',
      '        <Route',
      '          path="/about"',
      '          render={() => (',
      '            <PageLayout>',
      '              <About />',
      '            </PageLayout>',
      '          )}',
      '        />',
      '        <Route',
      '          path="/posts/hello-world"',
      '          render={() => (',
      '            <PageLayout>',
      '              <PostHelloWorld />',
      '            </PageLayout>',
      '          )}',
      '        />',
      '        <Route',
      '          path="/posts/react-router"',
      '          render={() => (',
      '            <PageLayout>',
      '              <PostReactRouter />',
      '            </PageLayout>',
      '          )}',
      '        />',
      '        <Route component={Page404} />',
      '      </Switch>',
      '    </BrowserRouter>',
      '    <CssReset />',
      '    <CssBase />',
      '  </React.Fragment>',
      ');',
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
              "content": "Hey, looks like React Router uses Render props... yep, those are render props up there.  ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "here's a link to the source if you're interested",
                  "id": ""
                }
              ],
              "content": "https://github.com/ReactTraining/react-router/blob/3d233bf0b6dd5bf68d9bac9c94273ae25646b207/packages/react-router/modules/Route.js#L113",
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
              "content": "💡Remember: Woah!  I just noticed that Hot Module Reloading wasn't working.  I thought it was related to the new React Router implementation or my ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "webpack.config.js",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " but, a quick search yielded this gem of wisdom:",
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
              "content": " of my index.html!!!-->",
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
              "content": "Thanks a lot ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "lekhnath",
                  "id": ""
                }
              ],
              "content": "https://github.com/lekhnath",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " for posting ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "this in an issue on github",
                  "id": ""
                }
              ],
              "content": "https://github.com/gaearon/react-hot-loader/issues/620#issuecomment-321729281",
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
                  "content": "That feels like a pretty clean break point.  The app now supports multiple routes and reusable markup and we only needed to add one library: React Router",
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
      "quote": "Before you commit to a framework, make sure you could write it. ",
      "url": "https://blog.cleancoder.com/uncle-bob/2015/08/06/LetTheMagicDie.html",
      "author": "-Uncle Bob",
      "context": "",
    },
    {
      "type": 'postlink',
      "to": '/posts/nginx',
      "content": 'Installing Nginx on Ubuntu in AWS'
    }
  ],
  "content": "",
  "id": "",
  "canonical": "react-router",
  "tags": []
}
