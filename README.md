# Welcome to pubsub in a box

Pubsub in a box is a management tool for building information sharing federations. With the help of XMPP and PubSub (XEP-0060) pubsubbox give you control over who can subscribe to your information streams.

In order to run this you will need an XMPP server capable of pubsub and BOSH.

# Get started

**1**) You need a xmpp server capable of doing BOSH and pubsub.

In ejabberd, an excelent xmpp server written in erlang you just need to load the http-module.

### ejabberd.cfg
    {5280, ejabberd_http, [
                         %%{request_handlers,
                         %% [
                         %%  {["pub", "archive"], mod_http_fileserver}
                         %% ]},
                         %%captcha,
                         http_bind,
                         http_poll
                         %%web_admin
                        ]}
    ]}.
    
    ...
    
    {modules,
    [
        ...
        {mod_http_bind, []}
    ]}.

**2**) To make it possible for pubsubbox to talk XMPP with your server, we need to handle it's connection. This can be done in several ways, one is to use a connection manager like punjab, or you can configure a local proxy that passes your traffic to your XMPP server. In the following **example** we will configure nginx to do local proxy pass to one specifik XMPP server.

### /etc/nginx/sites-enabled/default (ubuntu)
    location /http-bind {
            proxy_pass http://xmpp.example.com:5280/http-bind;
    }

**3**) Clone this repo
    git clone git://github.com/berggren/pubsubbox.git

**4**) Place the resulting html file and javascript in your webservers docroot somewhere

**5**) Enjoy!