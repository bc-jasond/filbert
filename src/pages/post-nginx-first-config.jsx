import React from 'react';
import { Link } from 'react-router-dom';
import {
  A,
  LinkStyled,
  Code,
  CodeSection,
  ContentSection,
  H1,
  H2,
  Li,
  Ol,
  P,
  Pre,
  SpacerSection,
  ItalicText, SiteInfo,
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>Basic Nginx config for a React app with React Router</H1>
    <SpacerSection />
    <H2>Pass Routing Responsibilies up to the Browser (React Router) - Part 3 - replace <Code>webpack-dev-server</Code>with <Code>nginx</Code></H2>
    <ContentSection>
      <P>Last time we <LinkStyled to="/posts/nginx">installed Nginx on our Ubuntu AWS EC2</LinkStyled> and we fired it up to see the test page.  In this post, we'll take a look at how to serve our webpack bundles and other static assets.</P>
      <P>First, let's get some info about <Code>nginx</Code> by running a <Code>service nginx status</Code>:</P>
    </ContentSection>
    <CodeSection>
      <Pre>$ service nginx status</Pre>
      <Pre>● nginx.service - nginx - high performance web server</Pre>
      <Pre>Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)</Pre>
      <Pre>Active: active (running) since Thu 2019-02-21 20:06:34 UTC; 4min 18s ago</Pre>
      <Pre>Docs: http://nginx.org/en/docs/</Pre>
      <Pre>Process: 26712 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)</Pre>
      <Pre>Main PID: 26713 (nginx)</Pre>
      <Pre>Tasks: 2 (limit: 547)</Pre>
      <Pre>CGroup: /system.slice/nginx.service</Pre>
      <Pre>├─26713 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf</Pre>
      <Pre>└─26714 nginx: worker process</Pre>
      <Pre/>
      <Pre>Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: Starting nginx - high performance web server...</Pre>
      <Pre>Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: nginx.service: Can't open PID file /var/run/nginx.pid (yet?) after start: No such file or directory</Pre>
      <Pre>Feb 21 20:06:34 ip-172-30-1-128 systemd[1]: Started nginx - high performance web server.</Pre>
    </CodeSection>
    <ContentSection>
      <P>Lots of great info here: uptime, number of processes (workers), start command, documentation.  All of this looks good for now, let's have a look at the <Code>/etc/nginx/nginx.conf</Code> which will be our entrypoint into <Code>nginx</Code> configuration</P>
      <P>Incidentally, <A href="http://hisham.hm/htop/"><Code>htop</Code></A> which was already available on my AWS EC2 box is a great tool for process viewing & management</P>
      <P>Here's what's in my <Code>/etc/nginx/nginx.conf</Code> by default:</P>
    </ContentSection>
    <CodeSection>
      <Pre>user  nginx;</Pre>
      <Pre>worker_processes  1;</Pre>
      <Pre>error_log  /var/log/nginx/error.log warn;</Pre>
      <Pre>pid        /var/run/nginx.pid;</Pre>
      <Pre>events {'{'}</Pre>
      <Pre>    worker_connections  1024;</Pre>
      <Pre>{'}'}</Pre>
      <Pre>http {'{'}</Pre>
      <Pre>    include       /etc/nginx/mime.types;</Pre>
      <Pre>    default_type  application/octet-stream;</Pre>
      <Pre>    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '</Pre>
      <Pre>    '$status $body_bytes_sent "$http_referer" '</Pre>
      <Pre>    '"$http_user_agent" "$http_x_forwarded_for"';</Pre>
      <Pre>    access_log  /var/log/nginx/access.log  main;</Pre>
      <Pre>    sendfile        on;</Pre>
      <Pre>    #tcp_nopush     on;</Pre>
      <Pre>    keepalive_timeout  65;</Pre>
      <Pre>    #gzip  on;</Pre>
      <Pre>    {'include /etc/nginx/conf.d/*.conf;'}</Pre>
      <Pre>{'}'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>Here we can configure 'global' settings for all <Code>nginx</Code> processes: how many workers, how many connections per worker, what user the processes run as, the log format and more.</P>
      <P>For our 'up and running' purposes, the interesting part is that this main config will include anything in the <Code>/etc/nginx/conf.d</Code> directory that has a <Code>*.conf</Code> suffix.  So this is where we can include our specific <Code>server {}</Code> and <Code>location {}</Code> directives for specific routing or 'reverse proxying' of <A href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview">HTTP</A> requests to files in our filesystem or even to other network locations.</P>
      <P>Looks like there's already a starter <Code>/etc/nginx/conf.d/default.conf</Code>.  Here's the <A href="http://nginx.org/en/docs/beginners_guide.html">beginner's guide</A> I bet that will get us in business.  Another useful link is <A href="http://nginx.org/en/docs/http/request_processing.html">How <Code>nginx</Code> processes requests</A></P>
      <P>With just one change to the existing <Code>default.conf</Code>, serving the root route <Code>index.html</Code> or <Code>http://dubaniewi.cz/</Code> is working.  For my project the config looks like this:</P>
    </ContentSection>
    <CodeSection>
      <Pre>server {'{'}</Pre>
      <Pre>  listen       80;</Pre>
      <Pre>  server_name  *.dubaniewi.cz;</Pre>
      <Pre>  location / {'{'}</Pre>
      <Pre>    root   /home/ubuntu/dubaniewicz-site/dist;</Pre>
      <Pre>    index  index.html index.htm;</Pre>
      <Pre>  {'}'}</Pre>
      <Pre>{'}'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>All that I changed was the filesystem document root to the directory containing my <Code>webpack</Code> build artifacts, in this case it's <Code>/home/ubuntu/dubaniewicz-site/dist</Code>.  This works for routing to <Code>/</Code> and clicking around on React <Code>{'<Link>'}</Code>s but, if I try to reload the page <Code>nginx</Code> sends a <Code>404</Code>.</P>
      <P>Why is that?  If we recall, React Router is listening for changes to the History object and then rendering components based on the new location.  That means we're not actually hitting the server, because we've loaded all pages for the application up front and now we just render them using JS to 'rebuild' the DOM.  When we do a hard refresh it sends the current URL back to the server and <Code>nginx</Code> will look for files that don't exist.</P>
      <P>If we do a refresh at <Code>http://dubaniewi.cz/posts/hello-world</Code> we'll see the following entry in the Nginx <Code>/var/log/nginx/error.log</Code>:</P>
    </ContentSection>
    <CodeSection>
      <Pre>2019/02/21 22:01:19 [error] 27935#27935: *1 open() "/home/ubuntu/dubaniewicz-site/dist/posts/hello-world" failed (2: No such file or directory), client: 52.119.126.134, server: *.dubaniewi.cz, request: "GET /posts/hello-world HTTP/1.1", host: "dubaniewi.cz"</Pre>
    </CodeSection>
    <ContentSection>
      <P>Nginx took the root <Code>/home/ubuntu/dubaniewicz-site/dist</Code> and concatenated the URI <Code>/posts/hello-world</Code> and then looked for that file in the filesystem, didn't find it and returned the 404 response</P>
      <P>This sounds familiar from the <Code>webpack-dev-server</Code><Link to="/posts/react-router">configuration step</Link>.  That was for Express.  Similarily, we'll need to configure Nginx to first look for files in the filesystem and then just pass it forward to React Router AKA <Code>index.html</Code>.</P>
      <P>  We can accomplish this task with one more line of configuration in the <Code>location {}</Code> block directive using the <A href="http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files"><Code>try_files</Code> directive</A>.  We'll just replace the <Code>index</Code> directive with <Code>try_files</Code> like so:</P>
    </ContentSection>
    <CodeSection>
      <Pre>server {'{'}</Pre>
      <Pre>  listen       80;</Pre>
      <Pre>  server_name  *.dubaniewi.cz;</Pre>
      <Pre>  location / {'{'}</Pre>
      <Pre>    root   /home/ubuntu/dubaniewicz-site/dist;</Pre>
      <Pre>    #index  index.html index.htm;</Pre>
      <Pre>    try_files $uri /index.html;</Pre>
      <Pre>  {'}'}</Pre>
      <Pre>{'}'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>So, now nginx will look at the filesystem and directly serve our JS & font files like <Code>main.9f4344101576a79cdce0.js</Code> and <Code>/fonts/charter-italic-webfont.woff</Code> otherwise it will just serve <Code>index.html</Code> and React Router will try to find a match or serve it's 404</P>
      <P>Great, now we can decommission the production version of <Code>webpack-dev-server</Code> in favor of our brand new iron-clad-1-worker-1024-max-connections Nginx production system!  Massive scale.  I wonder where the box falls over?  Probably under 1024 simultaneous connections...  Kill all <Code>node</Code> processes and run a <Code>sudo service nginx restart</Code> (this is needed everytime we make a change to a config file - not however, for updating files being served i.e. copying new files to <Code>/dist</Code></P>
      <P>Here's what the build / deploy steps look like now:</P>
      <Ol>
        <Li><Code>ssh ubuntu@dubaniewi.cz</Code></Li>
        <Li><Code>cd dubaniewicz-site</Code></Li>
        <Li><Code>git checkout master ; git pull</Code></Li>
        <Li><Code>yarn ; yarn build-prod</Code></Li>
        <Li>visit <Link to="/">http://dubaniewi.cz</Link> in your favorite world wide web browser</Li>
        <Li>profit 💵💵💵</Li>
      </Ol>
    </ContentSection>
    <ContentSection>
      <P><SiteInfo>We got a basic Nginx config up and running and it only required 2 changes to the starter config.  Now there's a basic manual develop / build / deploy workflow in place.  Next, I think it's time to serve some images.</SiteInfo></P>
      <P>💡Remember: <ItalicText>The real problem is that programmers have spent far too much time worrying about efficiency in the wrong places and at the wrong times; premature optimization is the root of all evil (or at least most of it) in programming. <A href="https://dl.acm.org/citation.cfm?id=361612">-Donald Knuth</A> from "Computer programming as an art" p. 671 of CACM Dec 1974</ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
    <ContentSection>
      <H2>
        <LinkStyled to="/posts/display-images">Next Post: Images - What's the Web without 'em?</LinkStyled>
      </H2>
    </ContentSection>
  </React.Fragment>
)