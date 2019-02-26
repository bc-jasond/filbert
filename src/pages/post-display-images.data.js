import {
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_POSTLINK,
  NODE_TYPE_TEXT,
  NODE_TYPE_P,
  NODE_TYPE_OL,
  NODE_TYPE_LI,
  NODE_TYPE_LINK,
  NODE_TYPE_A,
  NODE_TYPE_CODE,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_ITALIC,
  NODE_TYPE_STRIKE,
  NODE_TYPE_ROOT,
} from '../common/constants';

export default {
  type: NODE_TYPE_ROOT,
  canonical: 'display-images',
  childNodes: [
    {
      type: NODE_TYPE_SECTION_H1,
      childNodes: [
        { type: NODE_TYPE_TEXT, content: "Images - What's the Web without 'em?" }
      ]
    },
    { type: NODE_TYPE_SECTION_SPACER },
    {
      type: NODE_TYPE_SECTION_H2,
      childNodes: [
        { type: NODE_TYPE_TEXT, content: 'How does Medium do it?' }
      ]
    },
    {
      type: NODE_TYPE_SECTION_CONTENT,
      childNodes: [
        {
          type: NODE_TYPE_P,
          childNodes: [
            { type: NODE_TYPE_TEXT, content: "Now that we've got a " },
            {
              type: NODE_TYPE_LINK,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: 'proper webserver in place' }
              ],
              content: '/posts/nginx-first-config'
            },
            {
              type: NODE_TYPE_TEXT,
              content: " it's time to display some images.  So far, I've only implemented the 'Add a new part' from Medium's ⨁ menu.  Since that's just a line it was pretty straightforward lol."
            }
          ]
        },
        {
          type: NODE_TYPE_P,
          childNodes: [
            { type: NODE_TYPE_TEXT, content: 'The most complex thing to implement from that menu is the ' },
            {
              type: NODE_TYPE_SITEINFO,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: 'Embed' }
              ]
            },
            {
              type: NODE_TYPE_TEXT,
              content: " type, by far.  There's a lot going on in the background to go from a url to a small, seamless content rich 'widget'.  Embeds will definitely merit several blog posts on their own."
            }
          ]
        },
        {
          type: NODE_TYPE_P,
          childNodes: [
            {
              type: NODE_TYPE_TEXT,
              content: "For now, we'll get images displaying and that will suffice for a first version of layout for my technical writing endeavors."
            }
          ]
        },
        {
          type: NODE_TYPE_P,
          childNodes: [
            {
              type: NODE_TYPE_A,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: 'Medium gives you 4 image layout options:' }
              ],
              content: 'https://help.medium.com/hc/en-us/articles/215679797-Images'
            }
          ]
        },
        {
          type: NODE_TYPE_OL,
          childNodes: [
            {
              type: NODE_TYPE_LI,
              childNodes: [
                {
                  type: NODE_TYPE_SITEINFO,
                  childNodes: [
                    { type: NODE_TYPE_TEXT, content: 'Outset Left' }
                  ]
                },
                {
                  type: NODE_TYPE_TEXT,
                  content: " (text 'wraps around' the image into a right column when the viewport width "
                },
                { type: NODE_TYPE_CODE, content: '> 976px' },
                { type: NODE_TYPE_TEXT, content: ')' }
              ]
            },
            {
              type: NODE_TYPE_LI,
              childNodes: [
                {
                  type: NODE_TYPE_SITEINFO,
                  childNodes: [
                    { type: NODE_TYPE_TEXT, content: 'Inset Center' }
                  ]
                },
                {
                  type: NODE_TYPE_TEXT,
                  content: ' (image is same width as text, has left/right spacing in mobile view)'
                }
              ]
            },
            {
              type: NODE_TYPE_LI,
              childNodes: [
                {
                  type: NODE_TYPE_SITEINFO,
                  childNodes: [
                    { type: NODE_TYPE_TEXT, content: 'Outset Center' }
                  ]
                },
                {
                  type: NODE_TYPE_TEXT,
                  content: ' (image is wider than text, no left/right spacing in tablet view and smaller)'
                }
              ]
            },
            {
              type: NODE_TYPE_LI,
              childNodes: [
                {
                  type: NODE_TYPE_SITEINFO,
                  childNodes: [
                    { type: NODE_TYPE_TEXT, content: 'Fill Width' }
                  ]
                },
                { type: NODE_TYPE_TEXT, content: ' (image goes 100% width of the viewport all the time)' }
              ]
            },
          ]
        },
        {
          type: NODE_TYPE_P,
          childNodes: [
            { type: NODE_TYPE_TEXT, content: 'If I had to pick only one of those layout options because ' },
            {
              type: NODE_TYPE_STRIKE,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: "I'm lazy" }
              ]
            },
            { type: NODE_TYPE_TEXT, content: " I'm " },
            {
              type: NODE_TYPE_ITALIC,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: 'highly motivated' }
              ]
            },
            { type: NODE_TYPE_TEXT, content: ' to ship - it would be ' },
            {
              type: NODE_TYPE_SITEINFO,
              childNodes: [
                { type: NODE_TYPE_TEXT, content: 'Outset Center' }
              ]
            },
            { type: NODE_TYPE_TEXT, content: ". Ok, let's do it." }
          ]
        },
        {
          type: NODE_TYPE_P,
          childNodes: [
            { type: NODE_TYPE_TEXT, content: "The Medium markup looks like this (starting from a " },
            { type: NODE_TYPE_CODE, content: '.section-inner' },
            { type: NODE_TYPE_TEXT, content: ' node AKA a row of content):' }
          ]
        }
      ]
    },
    {
      type: NODE_TYPE_SECTION_CODE,
      lines: [
        '<div className="section-inner sectionLayout--outsetColumn">',
        '  <figure',
        '    tabIndex="0"',
        '    name="a433"',
        '    className="graf graf--figure graf--layoutOutsetCenter graf-after--p is-selected"',
        '    contentEditable="false"',
        '  >',
        '    <div className="aspectRatioPlaceholder is-locked" style="max-width: 1000px; max-height: 675px;">',
        '      <div className="aspectRatioPlaceholder-fill" style="padding-bottom: 67.5%;"></div>',
        '      <img',
        '        className="graf-image"',
        '        data-image-id="1*p_Id9vQKTbE-V31yXS5MIg.jpeg"',
        '        data-width="2404"',
        '        data-height="1622"',
        '        src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"',
        '        data-delayed-src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"',
        '      />',
        '      <div className="crosshair u-ignoreBlock"></div>',
        '    </div>',
        '    <figcaption',
        '      className="imageCaption"',
        '      data-default-value="Type caption for image (optional)"',
        '      contentEditable="true"',
        '    >The high desert somewhere between Zacatecas &amp; Monterrey, Mexico',
        '    </figcaption>',
        '  </figure>',
        '</div>',
      ]
    },
    {
      type: NODE_TYPE_SECTION_CONTENT,
      childNodes: []
    },
    { type: NODE_TYPE_SECTION_SPACER },
    {
      type: NODE_TYPE_SECTION_H2,
      childNodes: []
    },
    {
      type: NODE_TYPE_SECTION_CONTENT,
      childNodes: []
    },
    {
      type: NODE_TYPE_SECTION_IMAGE,
      width: 1000,
      height: 675,
      url: 'https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg',
      caption: 'The high desert somewhere between Zacatecas & Monterrey, Mexico. © my dad'
    },
    {
      type: NODE_TYPE_SECTION_QUOTE,
      quote: 'This project is experimental and of course comes without any warranty whatsoever. However, it could start a revolution in information access. ',
      url: 'https://groups.google.com/forum/#!topic/comp.sys.next.announce/avWAjISncfw',
      author: '-Tim Berners-Lee from "WorldWideWeb wide-area hypertext app available" (19 August 1991)',
      context: ', the announcement of the first WWW hypertext browser on the Usenet newsgroup comp.sys.next.announce.'
    },
    {
      type: NODE_TYPE_SECTION_POSTLINK,
      to: '/posts/nginx-first-config',
      content: 'Basic Nginx config for a React app with React Router'
    }
  ]
}
