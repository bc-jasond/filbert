export default {
  "type": "root",
  "childNodes": [
    {
      "type": "h1",
      "childNodes": [
        {
          "type": "text",
          "childNodes": [],
          "content": "Images - What's the Web without 'em?",
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
          "content": "How does Medium do it?",
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
              "content": "Now that we've got a ",
              "id": ""
            },
            {
              "type": "link",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "proper webserver in place",
                  "id": ""
                }
              ],
              "content": "/posts/nginx-first-config",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " it's time to display some images.  So far, I've only implemented the 'Add a new part' from Medium's ⨁ menu.  Since that's just a line it was pretty straightforward lol.",
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
              "content": "The most complex thing to implement from that menu is the ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Embed",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " type, by far.  There's a lot going on in the background to go from a url to a small, seamless content rich 'widget'.  Embeds will definitely merit several blog posts on their own.",
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
              "content": "For now, we'll get images displaying and that will suffice for a first version of layout for my technical writing endeavors.",
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
              "content": "Medium gives you 4 image layout options:",
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
                  "type": "siteinfo",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Outset Left",
                      "id": ""
                    }
                  ],
                  "content": "",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (text 'wraps around' the image into a right column when the viewport width ",
                  "id": ""
                },
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "> 976px",
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
              "type": "li",
              "childNodes": [
                {
                  "type": "siteinfo",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Inset Center",
                      "id": ""
                    }
                  ],
                  "content": "",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (image is same width as text, has left/right spacing in mobile view)",
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
                  "type": "siteinfo",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Outset Center",
                      "id": ""
                    }
                  ],
                  "content": "",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (image is wider than text, no left/right spacing in tablet view and smaller)",
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
                  "type": "siteinfo",
                  "childNodes": [
                    {
                      "type": "text",
                      "childNodes": [],
                      "content": "Fill Width",
                      "id": ""
                    }
                  ],
                  "content": "",
                  "id": ""
                },
                {
                  "type": "text",
                  "childNodes": [],
                  "content": " (image goes 100% width of the viewport all the time)",
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
              "content": "If I had to pick only one of those layout options because ",
              "id": ""
            },
            {
              "type": "strike",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "I'm lazy",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " I'm ",
              "id": ""
            },
            {
              "type": "italic",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "highly motivated",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " to ship - it would be ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Outset Center",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  Ok, let's do it.",
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
              "content": "The Medium markup looks like this (starting from a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": ".section-inner",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " node AKA a row of content):",
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
        "<div className=\"section-inner sectionLayout--outsetColumn\">",
        "<figure",
        "    tabIndex=\"0\"",
        "    name=\"a433\"",
        "    className=\"graf graf--figure graf--layoutOutsetCenter graf-after--p is-selected\"",
        "    contentEditable=\"false\"",
        "  >",
        "<div className=\"aspectRatioPlaceholder is-locked\" style=\"max-width: 1000px; max-height: 675px;\">",
        "<div className=\"aspectRatioPlaceholder-fill\" style=\"padding-bottom: 67.5%;\">",
        "</div>",
        "<img",
        "        className=\"graf-image\"",
        "        data-image-id=\"1*p_Id9vQKTbE-V31yXS5MIg.jpeg\"",
        "        data-width=\"2404\"",
        "        data-height=\"1622\"",
        "        src=\"https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg\"",
        "        data-delayed-src=\"https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg\"",
        "      />",
        "<div className=\"crosshair u-ignoreBlock\">",
        "</div>",
        "</div>",
        "<figcaption",
        "      className=\"imageCaption\"",
        "      data-default-value=\"Type caption for image (optional)\"",
        "      contentEditable=\"true\"",
        "    >",
        "The high desert somewhere between Zacatecas &amp; Monterrey, Mexico",
        "</figcaption>",
        "</figure>",
        "</div>"
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
              "content": "First thing I notice is the use of the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<figure>",
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
              "content": "<figcaption>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " tags. 👏 for using semantic tags.  It's not everyday that you get to you use them, you know?",
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
              "content": "The second thing I notice, and especially when using ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "throttling in the network tab",
                  "id": ""
                }
              ],
              "content": "https://css-tricks.com/throttling-the-network/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ", is the use of a grey placeholder the same size as the image.  Using placeholders definitely provides a better UX - the page won't jump around as the assets load.",
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
              "content": "Medium does image resizing, fingerprinting and probably initial load (small) + deferred (full-size) image swaps.  My image is pretty small at ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "140k",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " but, I'd imagine above a certain threshold they'll load a preview image.  I'm going to punt on that for now.",
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
              "content": "🧐 It's interesting to see how they use a CDN path prefix to route to assets by size ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/max/1000",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": ".  ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Go directly to the CDN base route for a warm welcome",
                  "id": ""
                }
              ],
              "content": "https://cdn-images-1.medium.com/",
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
              "content": "The image has it's original dimensions as ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "data-",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " attributes on the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "<img>",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " tag.  These can be used to scale the ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "aspectRatioPlaceholder",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " container before the asset loads.  The ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Outset Center",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " layout option comes with a ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "max-width: 1000px;",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " constraint.  Use that to find a scale factor ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "2404 / 1000 = 2.404",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and then find our new height ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "Math.ceil(1622 / 2.404) = 675",
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
          "content": "Where should I store these images?",
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
              "content": "Ok, I'm ready to start incorporating images into my posts.  I'll need this basic functionality:",
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
                  "content": "Upload - add new images",
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
                  "content": "Serve - get public facing URLs to these images",
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
                  "content": "Meta - get at least the original height / width to preserve the aspect ratio and maybe other info about the image",
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
                  "content": "Manage - be able to replace & delete",
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
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Option 1:",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " Here in the github repo and ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "bundle/load with",
                  "id": ""
                }
              ],
              "content": "https://webpack.js.org/guides/asset-management/#loading-images",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " ",
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
              "content": ".  It's easy enough right now while I'm editing the blog post content code by hand but, not a good long-term solution once I bring editing into the app.",
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
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Option 2:",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "S3",
                  "id": ""
                }
              ],
              "content": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonS3.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " or ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "GCP",
                  "id": ""
                }
              ],
              "content": "https://cloud.google.com/storage/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " was the next thing that came to mind.  Do a manual upload for now, get the URL and drop it in here as I write the posts.  I'll need an API in front of this eventually and so cloud storage can always be the backend but, it's not very interesting from a learning perspective.",
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
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Option 3:",
                  "id": ""
                }
              ],
              "content": "",
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
              "content": " - add an ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "/images/",
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
              "content": " block directive to my config and then just ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "code",
                  "childNodes": [],
                  "content": "scp",
                  "id": ""
                }
              ],
              "content": "http://www.hypexr.org/linux_scp_help.php",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " them directly into my ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "EC2",
                  "id": ""
                }
              ],
              "content": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " box and serve it up (",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "EBS volume",
                  "id": ""
                }
              ],
              "content": "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonEBS.html",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " or GCP storage - I think I'm going to migrate over to GCP to snag my ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "$300 in credits",
                  "id": ""
                }
              ],
              "content": "https://console.cloud.google.com/freetrial",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " and to see what it's like to stay vendor agnostic. Hi ",
              "id": ""
            },
            {
              "type": "a",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Terraform",
                  "id": ""
                }
              ],
              "content": "https://www.terraform.io/",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " 👋, i c u over there...).  I can add upload/delete endpoints once I get to the service layer.  I can also put a CDN in front of it.",
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
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Option 4:",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " Store the files in a database.  I had thought about putting them in a database but, then my friend Mitch added the idea of filesystem caching (not sure I need this in addition to CDN caching) on first request and sold me.  I'm going to have a DB for my blog post content, why not just keep it all together?",
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
              "content": "I'm going with ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "Option 4",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " but, setting up a DB and a service layer is beyond the scope of this post.  For now, I'll just use a Medium CDN ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "// HACK:",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " (open a new Medium story, add an image, grab the CDN url) and throw up my test image for layout purposes.  Let's see how that looks... 👀",
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
      "type": "image",
      "childNodes": [],
      "content": "",
      "id": "",
      "width": 1000,
      "height": 675,
      "url": "https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg",
      "caption": "The high desert somewhere between Zacatecas & Monterrey, Mexico. © my dad"
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
              "content": "Ok, that's a pretty landscape.  The interesting thing here is the aspect ratio computation and placeholder container sizing.  This is mostly hard-coded for now.  I'm not exactly sure how I will fully automate this yet but, it will likely involve saving some metadata with the image id in the blog content and then passing that as props.  Since ",
              "id": ""
            },
            {
              "type": "code",
              "childNodes": [],
              "content": "styled-components",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " are Just React Components™ we can pass them props and conditionally render CSS rules.  It's pretty slick.  Here's what I have:",
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
        "export const ImagePlaceholderContainer = styled.div`",
        "  position: relative;",
        "  width: 100%;",
        "  margin: 0 auto;",
        "  ${p => `",
        "    max-width: ${p.w}px;",
        "    max-height: ${p.h}px;",
        "  `}",
        "`;",
        "export const ImagePlaceholderFill = styled.div`",
        "  ${p => `padding-bottom: ${(p.h / p.w) * 100}%;`}",
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
              "type": "text",
              "childNodes": [],
              "content": "Layout looks good.  Currently images are blocking and on slow connections we don't get the nice ",
              "id": ""
            },
            {
              "type": "siteinfo",
              "childNodes": [
                {
                  "type": "text",
                  "childNodes": [],
                  "content": "text + placeholders",
                  "id": ""
                }
              ],
              "content": "",
              "id": ""
            },
            {
              "type": "text",
              "childNodes": [],
              "content": " initial view.  That will have to follow in another post.  Also, I'm sure I'll have to tweak this implementation further to make it a fully reusable component.",
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
      "type": "image",
      "childNodes": [],
      "content": "",
      "id": "",
      "width": 500,
      "height": 213,
      "url": "https://cdn-images-1.medium.com/max/800/1*lgJU6ClOFXUcVT9X_lwh0g.gif",
      "caption": "Another blog post in the bag..."
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
                  "content": "Today we got an image to display. This is big, people.  Almost as big as the quote below.  Next, I think it's time to start thinking about how to CRUD these blog posts: modelling the data, rendering the model, storing the data, serving the data, routing to posts, an admin view, aaaaand looks like there's plenty to write about for a while... 🤔",
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
      "quote": "This project is experimental and of course comes without any warranty whatsoever. However, it could start a revolution in information access. ",
      "url": "https://groups.google.com/forum/#!topic/comp.sys.next.announce/avWAjISncfw",
      "author": "-Tim Berners-Lee from \"WorldWideWeb wide-area hypertext app available\" (19 August 1991)",
      "context": ", the announcement of the first WWW hypertext browser on the Usenet newsgroup comp.sys.next.announce."
    },
    {
      "type": "postlink",
      "to": "",
      "content": ""
    }
  ],
  "content": "",
  "id": "",
  "canonical": "display-images",
  "tags": []
}