/*
Copyright 2011 NORDUnet A/S. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY NORDUNET A/S ``AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL NORDUNET A/S OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of NORDUnet A/S.
 */

var XMPP = {
    connection: null,
    my_jid: null,
    nodes: {},
    roster: {},
    domains: [],
    notifications: 0,
    disco_nodes: {},
    pubsubservice: 'pubsub.klutt.se',
    debug: false,

    jid_to_id: function(jid) {
        return Strophe.getBareJidFromJid(jid)
        .replace(/@/g, "-")
        .replace(/\./g, "-");
    },

    jid_without_at: function(jid) {
        return Strophe.getBareJidFromJid(jid)
        .replace(/@/g, " ");
    },

    pubsub_domain: function(service) {
        return service.replace(/pubsub\./g, '');
    },

    on_pubsub_event: function(message)  {
        var service = $(message).attr('from');
        var node = $(message).find('items').attr('node');
        $(message).find('item').each(function() {
            var payload = $(this).find('event').text();
            var activity = $.parseJSON(payload);
            console.log(activity.object.hash.md5);
            $('#activities').prepend(
                '<strong>' + activity.actor + '</strong> shared<br>' +
                activity.object.hash.md5 + '<br>' +
                activity.object.hash.sha1 + '<br>' +
                activity.object.hash.sha256 + '<br><br>'
            );
        });
        return true;
    },

    on_error: function(iq) {
        if (XMPPConfig.debug === true) {
            console.log('ERROR, take a look ast the following error-stanza:');
            console.log(iq);
        }
    }
};

$(document).bind('connect', function(ev, data) {
    var conn = new Strophe.Connection("/http-bind");
    if (XMPP.debug === true) {
        conn.xmlInput = function (body) {
            console.log(body);
        };
        conn.xmlOutput = function (body) {
            console.log(body);
        };
    }
    XMPP.my_jid = data.jid;
    conn.connect(data.jid, data.password, function(status) {
        if (status === Strophe.Status.CONNECTED) {
            $(document).trigger('connected');
        } else if (status === Strophe.Status.CONNECTING) {
            $('#conn-fail').hide();
        } else if (status === Strophe.Status.AUTHFAIL) {
            $('#login-screen').show();
            $('#login-spinner').hide();
            $('#conn-fail').show();
        } else if (status === Strophe.Status.CONNFAIL) {
            $('#login-screen').show();
            $('#login-spinner').hide();
            $('#conn-fail').show();
        } else if (status === Strophe.Status.DISCONNECTED) {
            $(document).trigger('disconnected');
        }
    });
    XMPP.connection = conn;
});

$(document).bind('connected', function () {
    $('#login-spinner').hide();
    $('#main-screen').show();
    var rosterIQ = $iq({type: 'get'})
        .c('query', {xmlns: 'jabber:iq:roster'});
    XMPP.connection.addHandler(XMPP.on_pubsub_event, null, "message", "headline");
    XMPP.connection.send($pres());
});

$(document).bind('disconnected', function () {
    $('#label-online').removeClass('success').addClass('important').text("Offline");
    XMPP.connection = null;
});

$(document).ready(function() {
    $('#login-button').click(function() {
        $(document).trigger('connect', {
            jid: $('#jid').val(),
            password: $('#password').val()
        });
        $('#login-screen').hide();
        $('#login-spinner').show();
    })
});
