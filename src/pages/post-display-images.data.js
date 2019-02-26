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
  NODE_TYPE_PRE,
  NODE_TYPE_OL,
  NODE_TYPE_LI,
  NODE_TYPE_A,
  NODE_TYPE_LINK,
  NODE_TYPE_CODE,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_ITALIC,
  NODE_TYPE_STRIKE,
} from '../common/constants';

export default {
  canonical: 'display-images',
  sections: [
    {
      type: NODE_TYPE_SECTION_H1,
      childNodes: [
        {
          type: NODE_TYPE_TEXT,
          content: "Images - What's the Web without 'em?",
        }
      ]
    },
    { type: NODE_TYPE_SECTION_SPACER },
    {
      type: NODE_TYPE_SECTION_H2,
      childNodes: [
        {
          type: NODE_TYPE_TEXT,
          content: 'How does Medium do it?',
        }
      ]
    }
  ]
}


    // new BlogPostNode(NODE_TYPE_SECTION_CONTENT,
    //   [
    //     new BlogPostNode(NODE_TYPE_P,
    //       [
    //         new BlogPostNode(NODE_TYPE_TEXT, [], "Now that we've got a "),
    //         new BlogPostNode(NODE_TYPE_LINK,
    //           [
    //             new BlogPostNode(NODE_TYPE_TEXT, [], 'proper webserver in place'),
    //           ],
    //           '/posts/nginx', // overload content to support 1 attribute
    //         ),
    //         new BlogPostNode(NODE_TYPE_TEXT, [], " it's time to display some images.  So far, I've only implemented the 'Add a new part' from Medium's ⨁ menu.  Since that's just a line it was pretty straightforward lol."),
    //       ],
    //     ),
    //   ],
    // ),
