import React from 'react';
import {
  A,
  LinkStyled,
  Code,
  CodeSection,
  ContentSection,
  ImageSection,
  H1,
  H2,
  Li,
  Ol,
  P,
  Pre,
  SpacerSection,
  ItalicText,
  SiteInfo,
  StrikeText,
  Figure,
  FigureCaption,
  ImagePlaceholderContainer,
  ImagePlaceholderFill,
  Img,
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>Images - What's the Web without 'em?</H1>
    <SpacerSection />
    <H2>How does Medium do it?</H2>
    <ContentSection>
      <P>Now that we've got a <LinkStyled to="/posts/nginx-first-config">proper webserver in place</LinkStyled> it's time to display some images.  So far, I've only implemented the 'Add a new part' from Medium's ⨁ menu.  Since that's just a line it was pretty straightforward lol.</P>
      <P>The most complex thing to implement from that menu is the <SiteInfo>Embed</SiteInfo> type, by far.  There's a lot going on in the background to go from a url to a small, seamless content rich 'widget'.  Embeds will definitely merit several blog posts on their own.</P>
      <P>For now, we'll get images displaying and that will suffice for a first version of layout for my technical writing endeavors.</P>
      <P>Medium gives you 4 image layout options:</P>
      <Ol>
        <Li><SiteInfo>Outset Left</SiteInfo> (text 'wraps around' the image into a right column when the viewport width <Code>{'>'} 976px</Code>)</Li>
        <Li><SiteInfo>Inset Center</SiteInfo> (image is same width as text, has left/right spacing in mobile view)</Li>
        <Li><SiteInfo>Outset Center</SiteInfo> (image is wider than text, no left/right spacing in tablet view and smaller)</Li>
        <Li><SiteInfo>Fill Width</SiteInfo> (image goes 100% width of the viewport all the time)</Li>
      </Ol>
      <P>If I had to pick only one of those layout options because <StrikeText>I'm lazy</StrikeText> I'm <ItalicText>highly motivated</ItalicText> to ship - it would be <SiteInfo>Outset Center</SiteInfo>.  Ok, let's do it.</P>
      <P>The Medium markup looks like this (starting from a <Code>.section-inner</Code> node AKA a row of content):</P>
    </ContentSection>
    <CodeSection>
      <Pre>{'<div className="section-inner sectionLayout--outsetColumn">'}</Pre>
      <Pre>  {'<figure'}</Pre>
      <Pre>    {'tabIndex="0"'}</Pre>
      <Pre>    {'name="a433"'}</Pre>
      <Pre>    {'className="graf graf--figure graf--layoutOutsetCenter graf-after--p is-selected"'}</Pre>
      <Pre>    {'contentEditable="false"'}</Pre>
      <Pre>  {'>'}</Pre>
      <Pre>    {'<div className="aspectRatioPlaceholder is-locked" style="max-width: 1000px; max-height: 675px;">'}</Pre>
      <Pre>      {'<div className="aspectRatioPlaceholder-fill" style="padding-bottom: 67.5%;"></div>'}</Pre>
      <Pre>      {'<img'}</Pre>
      <Pre>        {'className="graf-image"'}</Pre>
      <Pre>        {'data-image-id="1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>        {'data-width="2404"'}</Pre>
      <Pre>        {'data-height="1622"'}</Pre>
      <Pre>        {'src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>        {'data-delayed-src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg"'}</Pre>
      <Pre>      {'/>'}</Pre>
      <Pre>      {'<div className="crosshair u-ignoreBlock"></div>'}</Pre>
      <Pre>    {'</div>'}</Pre>
      <Pre>    {'<figcaption'}</Pre>
      <Pre>      {'className="imageCaption"'}</Pre>
      <Pre>      {'data-default-value="Type caption for image (optional)"'}</Pre>
      <Pre>      {'contentEditable="true"'}</Pre>
      <Pre>    {'>The high desert somewhere between Zacatecas &amp; Monterrey, Mexico'}</Pre>
      <Pre>    {'</figcaption>'}</Pre>
      <Pre>  {'</figure>'}</Pre>
      <Pre>{'</div>'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>First thing I notice is the use of the <Code>{'<figure>'}</Code> and <Code>{'<figcaption>'}</Code> tags. 👏 for using semantic tags.  It's not everyday that you get to you use them, you know?</P>
      <P>The second thing I notice, and especially when using <A href="https://css-tricks.com/throttling-the-network/">throttling in the network tab</A>, is the use of a grey placeholder the same size as the image.  Using placeholders definitely provides a better UX - the page won't jump around as the assets load.</P>
      <P>Medium does image resizing, fingerprinting and probably initial (small) + deferred (full-size) image swaps.  My image is pretty small at <Code>140k</Code> but, I'd imagine above a certain threshold they'll load a preview image.  I'm going to punt on that for now.</P>
      <P>🧐 It's interesting to see how they use a CDN path prefix to route to assets by size <Code>/max/1000</Code>.  <A href="https://cdn-images-1.medium.com/">Go directly to the CDN base route for a warm welcome</A></P>
      <P>The image has it's original dimensions as <Code>data-</Code> attributes on the <Code>{'<img>'}</Code> tag.  These can be used to scale the <Code>aspectRatioPlaceholder</Code> container before the asset loads.  The <SiteInfo>Outset Center</SiteInfo> layout option comes with a <Code>max-width: 1000px;</Code> constraint.  Use that to find a scale factor <Code>2404 / 1000 = 2.404</Code> and then find our new height <Code>Math.ceil(1622 / 2.404) = 675</Code></P>
    </ContentSection>
    <SpacerSection />
    <H2>Where should I store these images?</H2>
    <ContentSection>
      <P>Ok, I'm ready to start incorporating images into my posts.  I'll need this basic functionality:</P>
      <Ol>
        <Li>Upload - add new images</Li>
        <Li>Serve - get public facing URLs to these images</Li>
        <Li>Meta - get at least the original height / width to preserve the aspect ratio and maybe other info about the image</Li>
      </Ol>
      <P><SiteInfo>Option 1:</SiteInfo> Here in the github repo and <A href="https://webpack.js.org/guides/asset-management/#loading-images">bundle/load with</A> <Code>webpack</Code>.  It's easy enough right now while I'm editing the blog post content code by hand but, not a good long-term solution once I bring editing into the app.</P>
      <P><SiteInfo>Option 2:</SiteInfo> <A href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonS3.html">S3</A> or <A href="https://cloud.google.com/storage/">GCP</A> was the next thing that came to mind.  Do a manual upload for now, get the URL and drop it in here as I write the posts.  For some reason, I just don't want to do that.  I guess I'm just weary about going full-cloud with my toy project.  It kind of defeats the purpose of building to learn.</P>
      <P><SiteInfo>Option 3:</SiteInfo> <Code>nginx</Code> - add an <Code>/images/</Code> <Code>location {}</Code> block directive to my config and then just <A href="http://www.hypexr.org/linux_scp_help.php"><Code>scp</Code></A> them directly into my <A href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html">EC2</A> box and serve it up (<A href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonEBS.html">EBS volume</A> or GCP storage - I think I'm going to migrate over to GCP to snag my <A href="https://console.cloud.google.com/freetrial">$300 in credits</A> and to see what it's like to stay vendor agnostic. Hi <A href="https://www.terraform.io/">Terraform</A> 👋, i c u over there...).  I can add upload/delete endpoints once I get to the service layer.  I can also put a CDN in front of it.</P>
      <P><SiteInfo>Option 4:</SiteInfo> Store the files in a database.  I had thought about putting them in a database but, then my friend Mitch added the idea of filesystem caching on first request and sold me.  I'm going to have a DB for my blog post content, why not just keep it all together?</P>
      <P>I'm going with <SiteInfo>Option 4</SiteInfo> but, setting up a DB is beyond the scope of this post.  For now, I'll just use a Medium CDN hack (open a new Medium story, add an image, grab the CDN url) and throw up my test image for layout purposes.  Let's see how that looks... 👀</P>
    </ContentSection>
    <ImageSection>
      <Figure>
        <ImagePlaceholderContainer w="1000" h="675">
          <ImagePlaceholderFill w="1000" h="675" />
          <Img src="https://cdn-images-1.medium.com/max/1000/1*p_Id9vQKTbE-V31yXS5MIg.jpeg" />
        </ImagePlaceholderContainer>
        <FigureCaption>The high desert somewhere between Zacatecas & Monterrey, Mexico. © my dad</FigureCaption>
      </Figure>
    </ImageSection>
    <ContentSection>
      <P>Ok, that's a pretty landscape.  The interesting thing here is the aspect ratio computation and placeholder container sizing.  This is mostly hard-coded for now.  I'm not exactly sure how I will fully automate this yet but, it will likely involve saving some metadata with the image id in the blog content and then passing that as props.  Since <Code>styled-components</Code> are Just React Components™ we can pass them props and conditionally render CSS rules.  It's pretty slick.  Here's what I have:</P>
    </ContentSection>
    <CodeSection>
      <Pre>{'export const ImagePlaceholderContainer = styled.div`'}</Pre>
      <Pre>{'  position: relative;'}</Pre>
      <Pre>{'  width: 100%;'}</Pre>
      <Pre>{'  margin: 0 auto;'}</Pre>
      <Pre>{'  ${p => `'}</Pre>
      <Pre>{'    max-width: ${p.w}px;'}</Pre>
      <Pre>{'    max-height: ${p.h}px;'}</Pre>
      <Pre>{'  `}'}</Pre>
      <Pre>{'`;'}</Pre>
      <Pre>{'export const ImagePlaceholderFill = styled.div`'}</Pre>
      <Pre>{'  ${p => `padding-bottom: ${(p.h / p.w) * 100}%;`}'}</Pre>
      <Pre>{'`;'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>Layout looks good.  Currently images are blocking and on slow connections we don't get the nice <SiteInfo>text + placeholders</SiteInfo> initial view.  That will have to follow in another post.  Also, I'm sure I'll have to tweak this implementation further to make it a fully reusable component.</P>
    </ContentSection>
    <ImageSection>
      <Figure>
        <ImagePlaceholderContainer w="500" h="213">
          <ImagePlaceholderFill w="500" h="213" />
          <Img src="https://cdn-images-1.medium.com/max/800/1*lgJU6ClOFXUcVT9X_lwh0g.gif" />
        </ImagePlaceholderContainer>
        <FigureCaption>Another blog post in the bag...</FigureCaption>
      </Figure>
    </ImageSection>
    <ContentSection>
      <P><SiteInfo>Today we got an image to display. This is big, people.  Almost as big as the quote below.  Next, I think it's time to start thinking about how to CRUD these blog posts: modelling the data, rendering the model, storing the data, serving the data, routing to posts, an admin view, aaaaand looks like there's plenty to write about for a while... 🤔</SiteInfo></P>
    </ContentSection>
    <ContentSection>
      <P>💡Remember: <ItalicText>This project is experimental and of course comes without any warranty whatsoever. However, it could start a revolution in information access. <A href="https://groups.google.com/forum/#!topic/comp.sys.next.announce/avWAjISncfw">-Tim Berners-Lee from "WorldWideWeb wide-area hypertext app available" (19 August 1991)</A>, the announcement of the first WWW hypertext browser on the Usenet newsgroup comp.sys.next.announce.</ItalicText></P>
    </ContentSection>
    <ContentSection>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
    <H2>
      <LinkStyled to="/posts">Back to all Posts</LinkStyled>
    </H2>
  </React.Fragment>
)