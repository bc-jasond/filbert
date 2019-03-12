export default {
  "type": "root", "childNodes": [
    {
      "type": "h1",
      "childNodes": [{ "type": "text", "childNodes": [], "content": "A Data Model for Blog Post Content", "id": "" }],
      "content": "",
      "id": ""
    },
    {
      "type": "image",
      "childNodes": [],
      "content": "",
      "id": "",
      "width": "1000",
      "height": "491",
      "url": "https://cdn-images-1.medium.com/max/1000/1*V5zAxYD_BTjZ6cRNd4_pOQ.jpeg",
      "caption": "The branches and leaves of a big 'ol live oak"
    },
    {
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "I'm happy with my start but, I need a better writing/publishing workflow",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "content", "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "Last time, ",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "we got images displaying",
                  "id": ""
                }
              ],
              "content": "/posts/display-images",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ". That's cool. But, so far, I've just been hand-coding React Components as my content, using a set of shared ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "styled-components", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " as my building blocks and just manually enforcing layout consistency.",
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
              "type": "siteinfo",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "🐎 Tangent:", "id": "" }],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " Despite my careful efforts, the 'coding standards' drifted slightly between posts. This just goes to show how manually maintaining consistency in a codebase is like playing a game of telephone - and this codebase has only one contributor and a few files!",
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
              "content": "Following a basic page layout and saving each post as a separate file was a great way to get the first few posts up but, it's starting to get tedious. At first, I just liked how Medium does layout with a restricted set of options but, the ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "edit-in-place", "id": "" }],
              "content": "",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " functionality is quite pleasant. 🏖", "id": "" }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p", "childNodes": [
            { "type": "text", "childNodes": [], "content": "At this point I've ruled out a ", "id": "" },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "WYSIWYG editor", "id": "" }],
              "content": "https://ckeditor.com/blog/best-wysiwyg-editor-for-angular-react/",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " because I don't want to render React ", "id": "" },
            {
              "type": "italic",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "and", "id": "" }],
              "content": "",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " rando HTML a la: ", "id": "" },
            {
              "type": "code",
              "childNodes": [],
              "content": "<HackMeContainer dangerouslySetInnerHTML={thisIsGross}>",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " because it's gross, it's unsafe (", "id": "" },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "XSS attacks", "id": "" }],
              "content": "https://en.wikipedia.org/wiki/Cross-site_scripting",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": ") and because I really like the idea of ", "id": "" },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "constraint-based workflows", "id": "" }],
              "content": "https://medium.com/stanford-d-school/want-some-creativity-crank-up-the-constraints-5728a988a635",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " and ", "id": "" },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Nick Santos' original post about the subject.",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            }
          ], "content": "", "id": ""
        },
        {
          "type": "p",
          "childNodes": [{ "type": "text", "childNodes": [], "content": "So, here's my plan:", "id": "" }],
          "content": "",
          "id": ""
        },
        {
          "type": "ol", "childNodes": [
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Use JSON to model blog post content. (a simple ",
                  "id": ""
                },
                {
                  "type": "a",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "DOM", "id": "" }],
                  "content": "https://en.wikipedia.org/wiki/Document_Object_Model",
                  "id": ""
                },
                { "type": "text", "childNodes": [], "content": ")", "id": "" }
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
                  "content": "Create a set of React Components that know how to render this JSON",
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
                  "content": "Create a quick script to convert my existing React JSX post pages into JSON",
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
                  "content": "Figure out a way to edit the JSON (not ",
                  "id": ""
                },
                {
                  "type": "siteinfo",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "edit-in-place", "id": "" }],
                  "content": "",
                  "id": ""
                },
                { "type": "text", "childNodes": [], "content": " yet but, something better than raw JSON)", "id": "" }
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
                  "content": "Preview the blog post while I'm editing",
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
                  "content": "Store the JSON locally while editing. Manually paste into a js file and push to github for now",
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
                  "content": "Dynamically route to posts with ",
                  "id": ""
                }, { "type": "code", "childNodes": [], "content": "/posts/:id", "id": "" }
              ],
              "content": "",
              "id": ""
            }
          ], "content": "", "id": ""
        }
      ], "content": "", "id": ""
    },
    { "type": "spacer", "childNodes": [], "content": "", "id": "" },
    {
      "type": "h2",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Given my current React Components & props for post content - what would objects and properties look like? ",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "content", "childNodes": [
        {
          "type": "p", "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "My first pass at this was just to create some POJOs for this simple DOM. ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "That was pretty easy.", "id": "" }],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/pull/6/commits/d5c1211f076e8b186f77ef3ab6334929ad610af1",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " Then, I decided that these objects should be classes and that they should have ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "render()", "id": "" },
            { "type": "text", "childNodes": [], "content": " 'helper' methods that returned JSX. ", "id": "" },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Here's a POC with just a few nodes as an example.",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/pull/6/commits/7d8be76df38213c1db14b143e496f735e679a61a",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " That works and is simple enough, now I need to support all node types",
              "id": ""
            }
          ], "content": "", "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "After having sat with this for a couple days, it's still unclear how I should decouple the Content Model (data) classes from the React Components (presentation). It doesn't feel right yet but, it's a working implementation that I can move forward with. Here's what it looks like:",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ], "content": "", "id": ""
    },
    {
      "type": "codesection",
      "childNodes": [],
      "content": "",
      "id": "",
      "lines": [
        "class BlogPostNode {",
        " constructor(type, childNodes = [], content = '', id = '') {",
        " this.type = type;",
        " this.childNodes = childNodes;",
        " this.content = content;",
        " this.id = id;",
        " }",
        "}",
        ""
      ]
    },
    { "type": "h2", "childNodes": [], "content": "", "id": "" },
    {
      "type": "content", "childNodes": [
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "It's kind of amazing that those 4 properties is all the information that you need to create, save & display a blog post. ",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "h2",
          "childNodes": [{ "type": "code", "childNodes": [], "content": "id", "id": "" }],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "will be useful finding nodes, moving pieces of the DOM around (attaching a node to different parent), and possibly saving / doing a diff of nodes.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "h2",
          "childNodes": [{ "type": "code", "childNodes": [], "content": "content", "id": "" }],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            { "type": "text", "childNodes": [], "content": "essentially identifies a ", "id": "" },
            {
              "type": "siteinfo",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "Leaf Node", "id": "" }],
              "content": "",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " or a node that doesn't have any ", "id": "" },
            { "type": "code", "childNodes": [], "content": "childNodes", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": ". This field is also overloaded for links to store the URL. The link will then have a childNode(s) for display text i.e. ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<A href>display text here <OrEven>other tags</OrEven></A>",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "h2",
          "childNodes": [{ "type": "code", "childNodes": [], "content": "type", "id": "" }],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": " will inform the factory of which Node Type class to instantiate from JSON. Each Node Type has a class and a ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "render()", "id": "" },
            { "type": "text", "childNodes": [], "content": " function that knows which ", "id": "" },
            { "type": "code", "childNodes": [], "content": "styled-components", "id": "" },
            { "type": "text", "childNodes": [], "content": " to render. Later each class will have a ", "id": "" },
            { "type": "code", "childNodes": [], "content": "validate()", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " and any other integrity related code specific to each kind of node.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "h2",
          "childNodes": [{ "type": "code", "childNodes": [], "content": "childNodes", "id": "" }],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "are the recursive part - some Nodes can have other Nodes as children. Not having much experience with graph data, it's amazing how even the most simple implementation of this took some time for me to grok. But, what's great is you can start small and then add other features one by one.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p", "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "With basic classes in place for generic nodes like ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "<P>", "id": "" },
            { "type": "text", "childNodes": [], "content": " and ", "id": "" },
            { "type": "code", "childNodes": [], "content": "<ContentSection>, etc", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " that either take other nodes as children or render content - 80% of the post can be rendered. That leaves only the custom 'opinionated' types that don't follow convention like: ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "<ImageSection>", "id": "" },
            { "type": "text", "childNodes": [], "content": ", ", "id": "" },
            { "type": "code", "childNodes": [], "content": "<CodeSection>", "id": "" },
            { "type": "text", "childNodes": [], "content": " and my currently worst named Component: ", "id": "" },
            { "type": "code", "childNodes": [], "content": "<PostLink>", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " which is a standard footer that links to all posts and optionally to the next post.",
              "id": ""
            }
          ], "content": "", "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            { "type": "text", "childNodes": [], "content": "In order to test all of the ", "id": "" },
            { "type": "code", "childNodes": [], "content": "Node", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " helper classes, I hand-ported JSX to JSON from the ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "/display-images", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": "post because it had an example of all types of layout. I also added a test route that loaded data from the JSON file in addition to the original React Component data files in order to do a visual QA effort. ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Here's the commit that demos the full POC",
                  "id": ""
                }
              ],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/pull/6/commits/592f2dd045ea5e7c44c0b05de3dab1eb5604068b",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": ".", "id": "" }
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
              "content": "Man, hand-writing JSON sucks. Looking at this commit, it was only ~220 lines but, it felt like 2000. Originally, I thought that I could just port over the 5 existing posts by hand but, dude, there's no way. I needed a quick 'n dirty script to turn the existing JSX into JSON. ",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ], "content": "", "id": ""
    },
    { "type": "spacer", "childNodes": [], "content": "", "id": "" },
    {
      "type": "content", "childNodes": [
        {
          "type": "h2",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "A kinda quick, very dirty JSX -> JSON script that Works Enough™",
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
              "content": "I'll admit that I have an abnormally large capacity for mundane clerical tasks but, not even I could muscle through that JSX->JSON exercise. My initial thinking was, ",
              "id": ""
            },
            {
              "type": "italic",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "\"Don't go down the rabbit hole of writing a parsing script for just a few posts - it won't be worth the time investment.\"",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " But, then the pain was such that there quickly became no alternative.",
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
              "content": "As it turns out, it wasn't that hard. Why all the fear? 🤷🏻‍♀️ ",
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
              "content": "Not sure if it can be useful to anyone else but, ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "here's the commit", "id": "" }],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/pull/6/commits/73ffe61ce650fba4c091dbcd86126bcaff47fd72",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": " and Here's a quick breakdown of how it works:", "id": "" }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "ol", "childNodes": [
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Read the contents of the JSX file using ",
                  "id": ""
                }, { "type": "code", "childNodes": [], "content": "fs.readFile()", "id": "" }
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
                  "content": "Get rid of all newlines using ",
                  "id": ""
                }, { "type": "code", "childNodes": [], "content": "fileData.split('\\n').join('')", "id": "" }
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
                  "content": "'trim' all JS before/after (i.e. ",
                  "id": ""
                },
                { "type": "code", "childNodes": [], "content": "import", "id": "" },
                { "type": "text", "childNodes": [], "content": ", ", "id": "" },
                { "type": "code", "childNodes": [], "content": "class", "id": "" },
                { "type": "text", "childNodes": [], "content": ", etc.) the JSX in the ", "id": "" },
                { "type": "code", "childNodes": [], "content": "render()", "id": "" },
                { "type": "text", "childNodes": [], "content": " method", "id": "" }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                { "type": "text", "childNodes": [], "content": "Tokenize the JSX. ", "id": "" },
                {
                  "type": "a",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "Oh My!", "id": "" }],
                  "content": "http://w3c.github.io/html/syntax.html#tokenization",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " This is a flattened top-down representation of the markup in an Array - about ",
                  "id": ""
                },
                {
                  "type": "siteinfo",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "1 / 1000th", "id": "" }],
                  "content": "",
                  "id": ""
                },
                { "type": "text", "childNodes": [], "content": " of that spec...", "id": "" }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                { "type": "text", "childNodes": [], "content": "Instantiate a ", "id": "" },
                { "type": "code", "childNodes": [], "content": "new BlogPost('blog-post-id-here')", "id": "" },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " model and add it to a stack. This stack will keep track of the currently 'open' tag.",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                { "type": "code", "childNodes": [], "content": "tokens.forEach()", "id": "" },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " - walk through every token in the list, instantiate the corresponding JS model ",
                  "id": ""
                },
                { "type": "code", "childNodes": [], "content": "class", "id": "" },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " and add it to last-element-in-the-stack's ",
                  "id": ""
                },
                { "type": "code", "childNodes": [], "content": "childNodes", "id": "" }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "siteinfo",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "Opening Tag", "id": "" }],
                  "content": "",
                  "id": ""
                }, { "type": "text", "childNodes": [], "content": " - push it onto the stack.", "id": "" }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "siteinfo",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "Closing Tag", "id": "" }],
                  "content": "",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " - pop the stack and push that item into the parent node's ",
                  "id": ""
                },
                { "type": "code", "childNodes": [], "content": "childNodes", "id": "" }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "li",
              "childNodes": [
                {
                  "type": "siteinfo",
                  "childNodes": [{ "type": "text", "childNodes": [], "content": "Opinionated Tag", "id": "" }],
                  "content": "",
                  "id": ""
                },
                { "type": "text", "childNodes": [], "content": " - only the custom non-recursive ", "id": "" },
                { "type": "code", "childNodes": [], "content": "CodeSection", "id": "" },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " tag was supported since there were so many line of code in the post content. All others were handcrafted using traditions handed down from generation to generation",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            }
          ], "content": "", "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "💥 and with that basic script, I was able to pretty quickly port over the rest of the post data to JSON.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        }
      ], "content": "", "id": ""
    },
    {
      "type": "image",
      "childNodes": [],
      "content": "",
      "id": "",
      "width": "400",
      "height": "225",
      "url": "https://cdn-images-1.medium.com/max/800/1*rD11mS59UYLRre-pv7G27w.gif",
      "caption": "Lou Reed doin' some Coke"
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
                  "content": "Feelin' pretty good about this DOM-like model of the blog post content. With a few node types (some that can recurse and others that cannot) we can craft a decent looking post and inform all the peoples. I'm glad I gave a time-boxed effort to automate the JSX->JSON task, as it proved to be less difficult than I had anticipated. Next time, I'm going to do a quick fly-over of how I used wildcard imports to refactor my React Router ",
                  "id": ""
                },
                { "type": "code", "childNodes": [], "content": "Route", "id": "" },
                { "type": "text", "childNodes": [], "content": "definitions.", "id": "" }
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
      "content": "",
      "id": "",
      "quote": "At the end, if you fail, at least you did something interesting, rather than doing something boring and also failing... Or doing something boring and then forgetting how to do something interesting. ",
      "author": "-Barbara Liskov",
      "url": "http://www.drdobbs.com/architecture-and-design/barbara-liskov-on-inventing-language/221601214",
      "context": " during the first lecture of the 2009/2010 Dertouzos Lecturer Series MIT"
    },
    { "type": "postlink", "childNodes": [], "id": "" }
  ], "content": "", "id": [], "canonical": "blog-post-content-model", "tags": []
}