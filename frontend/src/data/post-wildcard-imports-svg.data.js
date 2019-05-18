export default {
  "type": "root", "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Using Wildcard Imports for Blog Post Data, add SVG Support",
          "id": ""
        }
      ],
      "content": "",
      "id": ""
    },
    {
      "type": "image",
      "childNodes": [],
      "content": "",
      "id": "",
      "width": "4032",
      "height": "3024",
      "url": "https://cdn-images-1.medium.com/max/1200/1*c0cp269M6pP9gVqyIgJH0A.jpeg",
      "caption": "The 'Piramide del Sol' from our recent trip to Mexico City"
    },
    {
      "type": "content", "childNodes": [
        {
          "type": "h2",
          "childNodes": [
            {
              "type": "text",
              "childNodes": [],
              "content": "The Problem: Repetitive Routing Code",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            { "type": "text", "childNodes": [], "content": "Now with ", "id": "" },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "a Data Model for Blog Post Content",
                  "id": ""
                }
              ],
              "content": "/posts/blog-post-content-model",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", it would be nice to move toward a more dynamic routing scheme based on a blog post ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "id", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " or permalink. Since there's no backend yet, I found myself saving the blog post JSON data into separate files for now. This created a need to ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "import", "id": "" },
            { "type": "text", "childNodes": [], "content": " each post and then create a static ", "id": "" },
            { "type": "code", "childNodes": [], "content": "<Route>", "id": "" },
            { "type": "text", "childNodes": [], "content": " for each import.", "id": "" }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            { "type": "text", "childNodes": [], "content": "Turns out, there's a handy ", "id": "" },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "little plugin for Babel called 'wildcard'",
                  "id": ""
                }
              ],
              "content": "https://github.com/vihanb/babel-plugin-wildcard",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " that makes this pretty easy. The idea is to import a whole directory of files into an object keyed on file name. Each blog post has a unique human-readable id called ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "canonical", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " that can be used in the URL. Now when we add new post data files to that directory, routing will Just Work™.",
              "id": ""
            }
          ],
          "content": "",
          "id": ""
        },
        {
          "type": "p",
          "childNodes": [
            { "type": "text", "childNodes": [], "content": "Even though this temporary ", "id": "" },
            {
              "type": "siteinfo",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "pre-backend", "id": "" }],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " solution will get removed in the near term, I think this is a useful workflow tool for prototyping and it also could come in handy for importing fixture data for testing.",
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
              "content": "Here's a condensed version of the dynamic routing code (",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "full commit here", "id": "" }],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/commit/3d31db52e5c10b4117bb7a3fb9ce5642b2736839",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": "):", "id": "" }
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
            "<Route path=\"/posts/:id\" component=\"{ PageLayout }\" />",
            "...",
            "import * as postData from '../data';",
            "...",
            "render() {",
            "  const {",
            "    match: {",
            "      params: {",
            "        id",
            "      }",
            "    }",
            "  } = this.props;",
            " ",
            "  const values = Object.values(postData);",
            "  const data = values.reduce(",
            "    (acc, current) => acc || (current.canonical === id ? current : null),",
            "    null",
            "  );",
            "  const pageContent = data ? pageContentFromJson(data) : data;",
            "  ",
            "  return !pageContent",
            "    ? (<Page404 />)",
            "    : (",
            "      <React.Fragment>",
            "      ..."
          ]
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
              "content": "The Problem: No Contact Info Anywhere on the Site",
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
              "content": "My first step is to add social links to the footer. See 'em down there? This was a good opportunity to add the ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "svg-react-loader", "id": "" }],
              "content": "https://github.com/jhamlet/svg-react-loader",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to the Webpack tool chain. The workflow is great: ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "import", "id": "" },
            {
              "type": "text",
              "childNodes": [],
              "content": " an SVG file and the plugin automatically wraps it in a React component which can then be ",
              "id": ""
            },
            { "type": "code", "childNodes": [], "content": "styled()", "id": "" },
            { "type": "text", "childNodes": [], "content": ". ", "id": "" }
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
              "content": "Here's a condensed version of the SVG workflow (",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [{ "type": "text", "childNodes": [], "content": "full commit here", "id": "" }],
              "content": "https://github.com/bc-jasond/dubaniewicz-site/pull/10/commits/f149aab0945705e076de045a3f640092077ae813",
              "id": ""
            },
            { "type": "text", "childNodes": [], "content": "):", "id": "" }
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
        "// the *.svg extension will match on the svg-react-loader",
        "// GitHubSvg is now a React.Component",
        "import GitHubSvg from '../../assets/github-mark.svg';",
        "// add styles",
        "const GitHubStyled = styled(GitHubSvg)`",
        "  display: block;",
        "  ...",
        "  fill: ${grey};",
        "  &:hover {",
        "    transition: fill .375s;",
        "    fill: ${darkGrey};",
        "  }",
        "`;",
        "// use like any other React.Component!",
        "...",
        "render() {",
        "  return (",
        "    ...",
        "    <SocialLinksContainer>",
        "      <A href=\"\">",
        "        <GitHubStyled />",
        "      </A>",
        "    </SocialLinksContainer>",
        "  )",
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
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Just a couple of quick topics today. The next post will cover the beginnings of Editor Experience v0.0.1 - the first step toward the seamless edit-in-place functionality we've all grown to love. ",
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
          "quote": "How do we convince people that in programming simplicity and clarity —in short: what mathematicians call \"elegance\"— are not a dispensable luxury, but a crucial matter that decides between success and failure? ",
          "author": "-Edsger W. Dijkstra",
          "url": "http://www.cs.utexas.edu/users/EWD/ewd06xx/EWD648.PDF",
          "context": " \"Why is software so expensive?\""
        },
        { "type": "postlink", "childNodes": [], "id": "" }
      ],
      "content": "",
      "id": ""
    }
  ], "content": "", "id": [], "canonical": "blog-post-wildcard-imports", "tags": []}