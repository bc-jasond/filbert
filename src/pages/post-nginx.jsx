import React from 'react';
import {
  ContentSection,
  CodeSection,
  H1,
  H2,
  LinkStyled,
  SpacerSection,
  P,
  Pre,
  Code,
  A,
  Ol,
  Li,
  ItalicText, SiteInfo,
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>Basic nginx configuration for Single Page Apps</H1>
    <SpacerSection />
    <H2>Pass Routing Responsibilies up to the Browser (React Router) - Part 2 - Now with moar <Code>nginx</Code>™</H2>
    <ContentSection>
      <P>Building on the <LinkStyled to="/posts/react-router">last post about React Router</LinkStyled> and the rewrite configuration we used for <Code>webpack-dev-server</Code> we'll now move to using a webserver better suited for production: <A href="http://nginx.org/en/docs/">nginx</A></P>
      <P>Ok, is <Code>nginx</Code> installed on my AWS box?</P>
    </ContentSection>
    <CodeSection>
      <Pre>$ which nginx</Pre>
      <Pre>$</Pre>
    </CodeSection>
    <ContentSection>
      <P>That means no.</P>
    </ContentSection>
    <SpacerSection />
    <H2>Step 1a: Installing <Code>nginx</Code> on Ubuntu on an AWS EC2</H2>
    <ContentSection>
      <P>Ok, let's install it.  How?  I'm using Ubuntu on AWS, how do I get version information? <Code>lsb_release -a</Code></P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ lsb_release -a</Pre>
      <Pre>No LSB modules are available.</Pre>
      <Pre>Distributor ID:	Ubuntu</Pre>
      <Pre>Description:	Ubuntu 18.04.1 LTS</Pre>
      <Pre>Release:	18.04</Pre>
      <Pre>Codename:	bionic</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$</Pre>
    </CodeSection>
    <ContentSection>
      <P>Great, what's the best way to install stuff in Ubuntu?  If you said, "compile from source" then we should hang out sometime.  But, not today because I want to get this post done.</P>
      <P>In addition to hand-built <A href="https://help.ubuntu.com/lts/serverguide/package-management.html.en">we have some options</A>.  Ubuntu is a flavor of <A href="https://www.debian.org/">Debian</A> and so <Code>dpkg</Code> would be the basic local only package management tool.  Run a <Code>dpkg -l</Code> to see what's installed on your system.  I don't see <Code>nginx</Code> in that list and I don't have a <Code>nginx.deb</Code> lying around so, I'd like to use a tool that can consult repositories on the interwebs.</P>
      <P>I could download the current stable version <Code>1.14.2</Code> <A href="http://nginx.org/en/download.html">here</A> but, if it had dependencies, I'd have to go download those too.</P>
      <P><Code>apt</Code> it is.  The <Code>apt</Code> command is a <ItalicText>"powerful command-line tool, which works with Ubuntu's Advanced Packaging Tool (APT)"</ItalicText>.  Since, I like to consider myself both advanced and powerful - this is the tool for me!</P>
      <P><Code>apt help</Code> will show you the 'most used commands' and a <Code>man apt</Code> will take you to the <A href="https://linux.die.net/man/8/apt">man pages</A></P>
      <P><Code>apt search nginx</Code> will list many packages.  If you're like me, you'll be intrigued by the <Code>nginx-light</Code> package as it seems to meet all current needs of this application.  I'm going to resist temptation and just install the 'virtual' package <Code>nginx</Code> which will first look for <Code>nginx-core</Code></P>
      <P>Running <Code>sudo apt update</Code> produced a <Code>yarn</Code>:</P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ sudo apt update</Pre>
      <Pre>Get:1 https://dl.yarnpkg.com/debian stable InRelease [13.3 kB]</Pre>
      <Pre>Hit:2 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic InRelease</Pre>
      <Pre>Get:3 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic-updates InRelease [88.7 kB]</Pre>
      <Pre>Get:4 http://us-west-1.ec2.archive.ubuntu.com/ubuntu bionic-backports InRelease [74.6 kB]</Pre>
      <Pre>Err:1 https://dl.yarnpkg.com/debian stable InRelease</Pre>
      <Pre>The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E</Pre>
      <Pre>Get:5 http://security.ubuntu.com/ubuntu bionic-security InRelease [88.7 kB]</Pre>
      <Pre>Fetched 252 kB in 1s (326 kB/s)</Pre>
      <Pre>Reading package lists... Done</Pre>
      <Pre>Building dependency tree</Pre>
      <Pre>Reading state information... Done</Pre>
      <Pre>85 packages can be upgraded. Run 'apt list --upgradable' to see them.</Pre>
      <Pre>W: An error occurred during the signature verification. The repository is not updated and the previous index files will be used. GPG error: https://dl.yarnpkg.com/debian stable InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E</Pre>
      <Pre>W: Failed to fetch https://dl.yarnpkg.com/debian/dists/stable/InRelease  The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 23E7166788B63E1E</Pre>
      <Pre>W: Some index files failed to download. They have been ignored, or old ones used instead.</Pre>
    </CodeSection>
    <ContentSection>
      <P>Huh?  What does <Code>yarn</Code> have to do with <Code>apt</Code>?  Somewhere in my past I must have copy/pasted something from some random blog post like this one...</P>
      <P>If I do a <Code>cat /etc/apt/sources.list</Code> I see a bunch of ubuntu repo urls, but it also informs me of this:</P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ cat /etc/apt/sources.list</Pre>
      <Pre>## Note, this file is written by cloud-init on first boot of an instance</Pre>
      <Pre>## modifications made here will not survive a re-bundle.</Pre>
      <Pre>## if you wish to make changes you can:</Pre>
      <Pre>## a.) add 'apt_preserve_sources_list: true' to /etc/cloud/cloud.cfg</Pre>
      <Pre>##     or do the same in user-data</Pre>
      <Pre>## b.) add sources in /etc/apt/sources.list.d</Pre>
      <Pre>## c.) make changes to template file /etc/cloud/templates/sources.list.tmpl</Pre>
    </CodeSection>
    <ContentSection>
      <P>A quick <Code>ls</Code> and <Code>cat</Code> reveals...</P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ ls /etc/apt/sources.list.d/</Pre>
      <Pre>yarn.list</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ cat /etc/apt/sources.list.d/yarn.list</Pre>
      <Pre>deb https://dl.yarnpkg.com/debian/ stable main</Pre>
    </CodeSection>
    <ContentSection>
      <P>A ha. looks like we'll consult the yarn repo everytime we do anything with <Code>apt</Code>.  Good to know.  Oh yeah, I feel like I <A href="https://github.com/yarnpkg/yarn/issues/4453#issuecomment-329463752">solved this</A> locally already</P>
      <P>Now the <Code>sudo apt update</Code> has finished without complaining but, looks like we're still behind at version <Code>1.14.0</Code>  I'm not super concerned with the <A href="http://nginx.org/en/CHANGES-1.14">updates between <Code>1.14.0</Code> and <Code>1.14.2</Code></A> but, I don't like being behind either.  Let's <A href="http://nginx.org/en/linux_packages.html#stable">add the nginx ubuntu package repo</A> to our source lists.</P>
      <P>First, I'll add a <Code>nginx.list</Code> file to the <Code>/etc/apt/sources.list.d</Code> directory and then add the signing key</P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ sudo vi /etc/apt/sources.list.d/nginx.list</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ cat /etc/apt/sources.list.d/nginx.list</Pre>
      <Pre>deb http://nginx.org/packages/ubuntu/ bionic nginx</Pre>
      <Pre>deb-src http://nginx.org/packages/ubuntu/ bionic nginx</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ curl -sS http://nginx.org/keys/nginx_signing.key | sudo apt-key add -</Pre>
      <Pre>OK</Pre>
    </CodeSection>
    <ContentSection>
      <P><Code>sudo apt update</Code> worked with the <Code>nginx</Code> repo and now a <Code>apt show nginx</Code> shows we're at version <Code>1.14.2</Code></P>
      <P>Run a <Code>sudo apt install nginx</Code> and confirm with <Code>dpkg -l | grep nginx</Code></P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ sudo apt install nginx</Pre>
      <Pre>Reading package lists... Done</Pre>
      <Pre>Building dependency tree</Pre>
      <Pre>Reading state information... Done</Pre>
      <Pre>The following packages were automatically installed and are no longer required:</Pre>
      <Pre>libpython-stdlib libpython2.7-minimal libpython2.7-stdlib python python-cliapp python-markdown python-minimal python-ttystatus python-yaml python2.7 python2.7-minimal</Pre>
      <Pre>Use 'sudo apt autoremove' to remove them.</Pre>
      <Pre>The following NEW packages will be installed:</Pre>
      <Pre>nginx</Pre>
      <Pre>0 upgraded, 1 newly installed, 0 to remove and 86 not upgraded.</Pre>
      <Pre>Need to get 836 kB of archives.</Pre>
      <Pre>After this operation, 2933 kB of additional disk space will be used.</Pre>
      <Pre>Get:1 http://nginx.org/packages/ubuntu bionic/nginx amd64 nginx amd64 1.14.2-1~bionic [836 kB]</Pre>
      <Pre>Fetched 836 kB in 2s (525 kB/s)</Pre>
      <Pre>Selecting previously unselected package nginx.</Pre>
      <Pre>(Reading database ... 113267 files and directories currently installed.)</Pre>
      <Pre>Preparing to unpack .../nginx_1.14.2-1~bionic_amd64.deb ...</Pre>
      <Pre>----------------------------------------------------------------------</Pre>
      <Pre />
      <Pre>Thanks for using nginx!</Pre>
      <Pre />
      <Pre>Please find the official documentation for nginx here:</Pre>
      <Pre>* http://nginx.org/en/docs/</Pre>
      <Pre />
      <Pre>Please subscribe to nginx-announce mailing list to get</Pre>
      <Pre>the most important news about nginx:</Pre>
      <Pre>* http://nginx.org/en/support.html</Pre>
      <Pre />
      <Pre>Commercial subscriptions for nginx are available on:</Pre>
      <Pre>* http://nginx.com/products/</Pre>
      <Pre />
      <Pre>----------------------------------------------------------------------</Pre>
      <Pre>Unpacking nginx (1.14.2-1~bionic) ...</Pre>
      <Pre>Processing triggers for ureadahead (0.100.0-20) ...</Pre>
      <Pre>Setting up nginx (1.14.2-1~bionic) ...</Pre>
      <Pre>Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /lib/systemd/system/nginx.service.</Pre>
      <Pre>Processing triggers for systemd (237-3ubuntu10.11) ...</Pre>
      <Pre>Processing triggers for man-db (2.8.3-2) ...</Pre>
      <Pre>Processing triggers for ureadahead (0.100.0-20) ...</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ dpkg -l | grep nginx</Pre>
      <Pre>ii  nginx                          1.14.2-1~bionic                   amd64        high performance web server</Pre>
    </CodeSection>
    <ContentSection>
      <P>Great, version <Code>1.14.2</Code> is now installed.  It's not running yet (run a <Code>service --status-all</Code> to verify that), so <Code>sudo service nginx start</Code> should get us in business.  Fail.  But, we get some useful information about how to view logs</P>
      <Ol>
        <Li><Code>systemctl status nginx.service</Code></Li>
        <Li><Code>journalctl -xe</Code> - this is funny to see all the <Code>sshd</Code> logs of hack attempts</Li>
      </Ol>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ sudo service nginx start</Pre>
      <Pre>Job for nginx.service failed because the control process exited with error code.</Pre>
      <Pre>See "systemctl status nginx.service" and "journalctl -xe" for details.</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ systemctl status nginx.service</Pre>
      <Pre>● nginx.service - nginx - high performance web server</Pre>
      <Pre>Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)</Pre>
      <Pre>Active: failed (Result: exit-code) since Sun 2019-01-27 23:23:58 UTC; 5h 21min ago</Pre>
      <Pre>Docs: http://nginx.org/en/docs/</Pre>
      <Pre>Process: 26507 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=1/FAILURE)</Pre>
      <Pre />
      <Pre>Jan 27 23:23:56 ip-172-30-1-128 systemd[1]: Starting nginx - high performance web server...</Pre>
      <Pre>Jan 27 23:23:56 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)</Pre>
      <Pre>Jan 27 23:23:56 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)</Pre>
      <Pre>Jan 27 23:23:57 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)</Pre>
      <Pre>Jan 27 23:23:57 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)</Pre>
      <Pre>Jan 27 23:23:58 ip-172-30-1-128 nginx[26507]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)</Pre>
      <Pre>Jan 27 23:23:58 ip-172-30-1-128 nginx[26507]: nginx: [emerg] still could not bind()</Pre>
      <Pre>Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: nginx.service: Control process exited, code=exited status=1</Pre>
      <Pre>Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: nginx.service: Failed with result 'exit-code'.</Pre>
      <Pre>Jan 27 23:23:58 ip-172-30-1-128 systemd[1]: Failed to start nginx - high performance web server.</Pre>
    </CodeSection>
    <ContentSection>
      <P>Oh yeah, forgot to shutdown the <Code>webpack-dev-server</Code> which is still running as a background process attached to port 80</P>
      <P>Running a <Code>sudo kill -9 $(sudo ps -A | grep node | cut -f2 -d' ')</Code> should do the trick... There were three processes named <Code>node</Code> - I'm assuming one for main and 2 child processes.  Here's <A href="https://medium.com/@NorbertdeLangen/communicating-between-nodejs-processes-4e68be42b917">an interesting article about creating child processes in <Code>node</Code> and communicating between them using <Code>ipc</Code></A></P>
      <P>Let's try <Code>sudo service nginx start</Code> again... Get the prompt back after a short wait.  In linux no news is good news.  <Code>tail -f /var/log/nginx/access.log</Code> and visit <A href="http://dubaniewi.cz">http://dubaniewi.cz</A> and we should see an entry and get the default welcome.html...</P>
    </ContentSection>
    <CodeSection>
      <Pre>ubuntu@ip-172-30-1-128:~$ sudo service nginx start</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ tail -f /var/log/nginx/</Pre>
      <Pre>access.log  error.log</Pre>
      <Pre>ubuntu@ip-172-30-1-128:~$ tail -f /var/log/nginx/access.log</Pre>
      <Pre>108.233.248.51 - - [28/Jan/2019:06:12:42 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:64.0) Gecko/20100101 Firefox/64.0" "-"</Pre>
      <Pre>108.233.248.51 - - [28/Jan/2019:06:12:56 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:64.0) Gecko/20100101 Firefox/64.0" "-"</Pre>
    </CodeSection>
    <ContentSection>
      <P>Ok, we're in business.  Now on to configuring <Code>nginx</Code> to serve our <Code>webpack</Code></P>
    </ContentSection>
    <SpacerSection />
    <H2>Step 1b: Doing the thing this article was originally intended to be about - a basic <Code>nginx</Code> config for a SPA with HTML5 routing</H2>
    <ContentSection>
      <P></P>
    </ContentSection>
    <ContentSection>
      <P><SiteInfo>That's about enough for right now.  TODO TODO TODO</SiteInfo></P>
      <P>💡Remember: <ItalicText><A href="">// TODO: Some awesome quote here.</A></ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
    <ContentSection>
      <H2>
        <LinkStyled to="/posts">Back to all Posts</LinkStyled>
      </H2>
    </ContentSection>
  </React.Fragment>
)