export default {
  "type": "root",
  "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Hello World!",
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
          "content": "React Hello World",
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
              "content": "Creating a simple ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "React",
                  "id": ""
                }
              ],
              "content": "https://reactjs.org/docs/thinking-in-react.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (        + ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Babel",
                  "id": ""
                }
              ],
              "content": "https://babeljs.io/docs/en/babel-preset-react",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " + ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Webpack",
                  "id": ""
                }
              ],
              "content": "https://webpack.js.org/guides/getting-started/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " + ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "yarn",
                  "id": ""
                }
              ],
              "content": "https://yarnpkg.com/en/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ")        starter project is actually proving to be difficult        starting from the documentation. You can always        use ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "create-react-app",
                  "id": ""
                }
              ],
              "content": "https://github.com/facebook/create-react-app",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ",        or ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "TodoMVC",
                  "id": ""
                }
              ],
              "content": "http://todomvc.com/examples/react/#/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " if you want to play around with something more        opinionated        first but, I want to start from scratch.",
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
              "content": "A 'Hello World!' in React should be a matter of:",
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
                  "content": "Go to documentation",
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
                  "content": "copy / paste a simple config",
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
                  "content": "run a command in the terminal",
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
                  "content": "see Hello World",
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
              "content": "Of React/Babel/Webpack - which do I start with? Which can I do without at first and then iterate        into?",
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
                  "content": "Starting with React",
                  "id": ""
                }
              ],
              "content": "https://reactjs.org/docs/add-react-to-a-website.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " seems logical, since        that's the UI library. Yes, we can develop in ES5 ('working under constraints') but, personally I        like ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "JSX",
                  "id": ""
                }
              ],
              "content": "https://reactjs.org/docs/introducing-jsx.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and that depends on Babel. Ok, so just        throw ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "babel-standalone",
                  "id": ""
                }
              ],
              "content": "https://github.com/babel/babel-standalone",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " in        the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<head>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and call it a day. But, quickly we'll see that we        want to        use ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "modules",
                  "id": ""
                }
              ],
              "content": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and        as of this writing ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<script type=\"module\">",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " is brittle        (whitescreen with no errors if you misspell a path to any module anywhere in the tree). I guess we're going to        want ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "hot          reloading",
                  "id": ""
                }
              ],
              "content": "https://github.com/gaearon/react-hot-loader/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " too. ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "What's the difference between live and hot          reloading?",
                  "id": ""
                }
              ],
              "content": "https://stackoverflow.com/a/41429055",
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
              "content": "Before I dive into Webpack - I probably could/should have used a zero-configuration bundler        like ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Parcel",
                  "id": ""
                }
              ],
              "content": "https://parceljs.org/getting_started.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ". This        project would be perfect for it since it's so simple. But, I know webpack so I'll let momentum make my        decision Just for Now™️.",
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
              "content": "It seems counterintuitive but, I'm going to drive off of Webpack. This isn't so farfetched though; it is        the asset bundler and require runtime - basically our frontend operating system        (",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "here's a good comparison of these",
                  "id": ""
                }
              ],
              "content": "https://survivejs.com/webpack/appendices/comparison/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " - it's        cool to        see ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "make",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " as the first tool mentioned, read bottom up for newest tools).",
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
              "content": "I found ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "this little online tool",
                  "id": ""
                }
              ],
              "content": "https://webpack.jakoblind.no/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " in the Webpack documentation        which aims to make a pretty simple jump-off        point for a React project",
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
              "content": "Let's see if I can get it working in an 'impatient' amount of time…",
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
              "content": "OK, it took about 20 mins including some sips of coffee and looking out the window at Amador City. That's        acceptable.",
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
          "content": "Build and Deploy to AWS",
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
              "content": "Builds/reloads taking longer than you'd think for a 'hello world!'? This is because the 3rd party libs like        React get recompiled        every time a change is detected. Luckily, it's easy enough        to ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "add          configuration",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/blob/703bc41850ee945049f5bef265214e8fd4b9bf3e/webpack.config.js#L52",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to        the ",
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
              "content": " to split code that comes        from ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/node_modules/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " into a separate bundle.",
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
              "content": "For the sake of shipping something this week I'm going to add a temporary dev server mode to run 'in        production' on port 80 on my AWS box.",
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
              "type": "text",
              "childNodes": [],
              "content": "Now, let's build and deploy",
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
                  "content": "SSH into the AWS box",
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
                  "content": "pull down the ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "dubaniewicz-site",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/bc-jasond/dubaniewicz-site",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " repo",
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
                  "content": "install yarn - there were ",
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
                  "content": " config issues on my AWS Ubuntu 16 LTS          image ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "resolved            here:",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/yarnpkg/yarn/issues/3189",
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
        "$ sudo apt remove cmdtest",
        "$ echo \"deb https://dl.yarnpkg.com/debian/ stable main\" | sudo tee /etc/apt/sources.list.d/yarn.list",
        "$ sudo apt update && sudo apt install - no-install-recommends yarn",
        "$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -",
        "$ sudo apt update && sudo apt install - no-install-recommends yarn"
      ]
    },
    {
      "type": "content",
      "childNodes": [
        {
          "type": "ol",
          "childNodes": [
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "install dependencies ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "yarn;",
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
                  "content": "build assets. For now this is just ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "yarn start-prod",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " make sure the          webpack ",
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
                  "content": " config section serves at ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "0.0.0.0",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " instead          of the default ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "localhost",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " or you'll get Connection Refused",
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
                  "content": "Point ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "dubaniewi.cz",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " DNS to AWS box (I'm using the GoDaddy web GUI)",
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
                  "content": "See 'Hello World' at ",
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
                  "content": "Profit $$$",
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
          "content": "Basic Layout for a Blog",
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
              "content": " for 1st blog post - this will just be the homepage for now.",
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
                  "content": "Header placeholder",
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
                  "content": "Content of first blog post (this one)",
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
                  "content": "Layout (Stolen from Medium and          essentially ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Bootstrap's            xs size",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/twbs/bootstrap/blob/793b83fda84da33e07adfab467a68dc649565401/scss/mixins/_breakpoints.scss#L5",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "): I'm going to put all content sections (text,          images, code blocks, three-dot-spacer, etc.) inside ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "display: block;",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " containers. This is          mobile-first and it          Just Works™ for all screen sizes: 1 column, stacked block sections with          padding, ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "margin-bottom",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " for spacing in one direction, ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "max-width",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " for desktop. Done.          Basically, no horizontal layout = no responsive layout issues & no edge cases          (except, maybe flex layout fallbacks for older browsers if I go there).",
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
                  "content": "Medium provides some nice layout 'opinions' (constraints): no nesting indents, bullets, pretty awesome IMO.",
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
                  "content": "Footer placeholder",
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
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Nice to haves",
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
              "content": "(let's try our best to deliver these incrementally and not with the next commit AKA never lol):",
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
                  "content": "Homepage that's different from this post page",
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
                  "content": "permalinks",
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
                  "content": "posting categories",
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
                  "content": "sidebar with links to other articles",
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
                  "content": "subscribe link / timed popup",
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
                  "content": "RSS feed",
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
                  "content": "social share links",
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
                  "content": "this list will grow…",
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
              "content": "I like ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "CSS-in-JS",
                  "id": ""
                }
              ],
              "content": "https://github.com/MicheleBertoli/css-in-js",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and I've been        using ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "styled-components",
                  "id": ""
                }
              ],
              "content": "https://www.styled-components.com/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to much satisfaction. I'll also use        a ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "CSS reset",
                  "id": ""
                }
              ],
              "content": "https://meyerweb.com/eric/tools/css/reset/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " global        sheet. ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "What's that?",
                  "id": ""
                }
              ],
              "content": "https://bitsofco.de/a-look-at-css-resets-in-2018/",
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
              "content": "I had an issue with ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "yarn add -D styled-components",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (probably because of        a ",
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
              "content": " version update from ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "nvm",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": "). Do a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "sudo rm -rf node_modules/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to fix        this error:",
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
        "jd@local ~/dev/dubaniewicz-site (master)*$ yarn add -D styled-components",
        "yarn add v1.12.3",
        "[1/4] 🔍 Resolving packages…",
        "warning styled-components >",
        " memoize-one@4.1.0: New custom equality api does not play well with all equality helpers. Please use v5.x",
        "[2/4] 🚚 Fetching packages…",
        "[3/4] 🔗 Linking dependencies…",
        "error An unexpected error occurred: \"EACCES: permission denied, rmdir '/Users/jd/dev/dubaniewicz-site/node_modules/.cache/terser-webpack-plugin/index-v5/67/b1'\".",
        "info If you think this is a bug, please open a bug report with the information provided in \"/Users/jd/dev/dubaniewicz-site/yarn-error.log\"."
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
              "content": "I'm aiming to use semantic markup where possible        i.e. ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<header>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " vs ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<div class=\"header\">",
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
              "content": "I'd like to pick a font: 1 serif for content, 1 sans serif for Titles - just like mama (read: Medium) used to        make! Here's an example of one of        Medium's ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "font style          sheets",
                  "id": ""
                }
              ],
              "content": "https://glyph.medium.com/css/e/sr/latin/e/ssr/latin/e/ssb/latin/m2.css",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ": 'latin'",
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
              "content": "Woah, there are way more fonts and variations than I expected in that file! There's also great CSS tricks in        Medium's CSS in general:",
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
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "rgba          black",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/bc-jasond/dubaniewicz-site/blob/d644e5b5897666d3d6fba2d57489539fcff85fde/src/reset.css.js#L27",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (partially transparent)",
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
                      "content": "font          smoothing",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/bc-jasond/dubaniewicz-site/blob/d644e5b5897666d3d6fba2d57489539fcff85fde/src/reset.css.js#L32",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " CSS rules - looks great!",
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
                  "content": "serif ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "'Kievit'",
                      "id": ""
                    }
                  ],
                  "content": "https://github.com/lcdvirgo/bootstrap/tree/master/assets/fonts/%5BFontFont%5D%20Kievit",
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
                  "content": "sans serif ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "'Charter'",
                      "id": ""
                    }
                  ],
                  "content": "https://practicaltypography.com/charter.html",
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
                  "content": "Not from Medium but great - ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "(iLike) => 'source code with === ligatures'",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " so ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "'Fira          Mono'",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " for my code please",
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
              "content": "💡Remember: in your browser developer tools there's a fonts tab to verify loaded fonts (it's a sub-tab under        the Inspector in Firefox)",
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
              "content": "webpack-dev-server",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " was not loading fonts because my config was missing a loader. I added        a ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "loader          + options",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/commit/b228decb7e76668d5375123b7d6d368ff85784a8#diff-11e9f7f953edc64ba14b0cc350ae7b9dR21",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " style config to ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "file-loader",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to specify a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/fonts/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " dir as ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "outputPath",
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
              "content": "🤦Facepalm: a typo in a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "@font-face",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " declaration can prevent the browser from loading a font! Can you spot the typo?...",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "url(${importName}",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " I        forgot a closing ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": ")",
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
              "content": "url()",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " statement… lost an hour there :)",
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
              "content": "I have a basic layout now but, I'm going to add a couple more cleanup items",
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
                  "content": "use a ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "css.js",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " to house reusable CSS constants",
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
                  "content": "use a ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "shared-styled.jsx",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " to house a base set of styled components - although styled-components          makes for          easy duplication of commonly used elements. I want          to ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "standardize my UI with a style            guide.",
                      "id": ""
                    }
                  ],
                  "content": "https://www.toptal.com/designers/ui/ui-styleguide-better-ux",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " This essentially decouples design development from individual page development; improving UX          consistency and code maintainability. Just 'pick from the catalog' when laying out pages and ignore custom          designs that arent in the style guide (sorry designers).",
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
              "content": "Tweaking sections - adding and styling a pseudo element in styled-components        thanks ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "worc          on github",
                  "id": ""
                }
              ],
              "content": "https://github.com/styled-components/styled-components/issues/388#issuecomment-397132040",
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
                  "content": "Adrift on Stack Overflow",
                  "id": ""
                }
              ],
              "content": "https://stackoverflow.com/a/20858630",
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
        "const SomeElement = styled.div`",
        "  &::after {",
        "    display: block; // width/height won't work without this because Pseudo elements default to display: inline;",
        "    content: '\\\\00a0'; // won't render without content",
        "  }",
        "`;"
      ]
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
                  "content": "There's more to do and more detail to fill in but, I'm out of time.",
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
      "quote": 'If you\'re not embarrassed, then you shipped too late. ',
      "url": 'https://twitter.com/reidhoffman/status/847142924240379904?lang=en',
      "author": '-Reid Hoffman',
      "context": '',
    },
    {
      "type": 'postlink',
      "to": '/posts/react-router',
      "content": 'Intro to React Router'
    }
  ],
  "content": "",
  "id": "",
  "canonical": "display-images",
  "tags": []
}