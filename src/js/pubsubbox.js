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
    /* Set the relative path to the configuration file */
    CONFIG_FILE: 'js/klutt_config.js',
    connection: null,
    my_jid: null,
    nodes: {},
    roster: {},

    jid_to_id: function(jid) {
        return Strophe.getBareJidFromJid(jid)
        .replace(/@/g, "-")
        .replace(/\./g, "-");
    },

    jid_without_at: function(jid) {
        return Strophe.getBareJidFromJid(jid)
        .replace(/@/g, " ");
    },

    on_add_to_whitelist: function(nodeID, jid) {
        var iq = $iq({to:XMPP.pubsubservice, type:'set'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
            .c('affiliations', {node:nodeID})
            .c('affiliation', {jid:jid, affiliation:'member' });
        XMPP.connection.sendIQ(iq);
    },

    remove_from_whitelist: function(nodeID, jid) {
        var iq = $iq({to:XMPP.pubsubservice, type:'set'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
            .c('affiliations', {node:nodeID})
            .c('affiliation', {jid:jid, affiliation:'outcast'});
        XMPP.connection.sendIQ(iq, XMPP.on_remove_from_whitelist(nodeID));
    },

    on_remove_from_whitelist: function(nodeID) {
        setTimeout(function(){
            $(document).trigger('node_update_subscriber_count', {id: nodeID});
        }, 50);
    },

    on_error: function(iq) {
        console.log("ERROR: " + iq);
    },

    delete_node: function(nodeID) {
        console.log("delete node " + nodeID)
        var iq = $iq({to:XMPP.pubsubservice, type:'set'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
            .c('delete', {node:nodeID});
        $('#' + nodeID).remove();
        XMPP.connection.sendIQ(iq, XMPP.on_whitelist);
    },

    on_roster: function(iq) {
        $(iq).find('item').each(function() {
            var jid = $(this).attr('jid');
            var id = XMPP.jid_to_id(jid);
            var name = $(this).attr('name') || XMPP.jid_without_at(jid);
            XMPP.roster[jid] = name;
            var splitName = name.split(" ");
            var name1 = splitName[0] || '';
            var name2 = splitName[1] || '';
            var elem = $('<div class="drag box_roster left" jid="' + jid + '" id="' + id + '">' +
                '<span class="' + id + '-canvas"' + '></span>' +
                '<span>' + name1 + '<br>' + name2 + '</span></div>');
            $('#roster').append(elem);
            var vCardIQ = $iq({to: jid, type: 'get'})
                .c('vCard', {xmlns: 'vcard-temp'});
            var foo = "hejsan";
            XMPP.connection.sendIQ(vCardIQ, XMPP.on_vcard, XMPP.on_error);
        });
    },

    on_vcard: function(iq) {
        var vCard = $(iq).find("vCard");
        var jid = $(iq).attr('from');
        var id = XMPP.jid_to_id(jid);
        var idAvatar = id + '-avatar';
        $('.' + id + '-canvas').append('<canvas id="' + idAvatar + '" width="48" height="48"></canvas><br>');
        var img = vCard.find('BINVAL').text();
        var type = vCard.find('TYPE').text();
        var img_src = 'data:'+type+';base64,'+img;
        var ctx = $('#'+idAvatar).get(0).getContext('2d');
        var image = new Image();
        image.onload = function() {
            ctx.drawImage(image,0,0, 48, 48);
        };
        image.src = img_src;
        $('.drag').draggable({
                                 helper: "clone",
                                 appendTo: "body",
                                 containment: "html",
                                 opacity: "0.85",
                                 revert: false,
                                 revertDuration: 100,
                                 stack: ".drag",
                                 cursor: "move",
                                 scroll: false
                             });
    },

    on_vcard_node_info: function(iq) {
        var vCard = $(iq).find("vCard");
        var jid = $(iq).attr('from');
        var id = XMPP.jid_to_id(jid) + '-node_info';
        var idAvatar = id + '-avatar';
        $('.' + id + '-canvas').append('<canvas id="' + idAvatar + '" width="48" height="48"></canvas><br>');
        var img = vCard.find('BINVAL').text();
        var type = vCard.find('TYPE').text();
        var img_src = 'data:'+type+';base64,'+img;
        var ctx = $('#'+idAvatar).get(0).getContext('2d');
        var image = new Image();
        image.onload = function() {
            ctx.drawImage(image,0,0, 48, 48);
        };
        image.src = img_src;
        $('.drag').draggable({
            helper: "clone",
            appendTo: "body",
            containment: "html",
            opacity: "0.85",
            revert: false,
            revertDuration: 100,
            stack: ".drag",
            cursor: "move",
            scroll: false
        });
    },


    on_my_vcard: function(iq) {
        var vCard = $(iq).find("vCard");
        var base64Image = vCard.find('BINVAL').text();
        var type = vCard.find('TYPE').text();
        var img_src = 'data:'+type+';base64,'+base64Image;
        var ctx = $('#avatar').get(0).getContext('2d');
        var image = new Image();
        image.onload = function() {
            ctx.drawImage(image,0,0,90,90)
        };
        image.src = img_src;
        var jid = $(iq).attr('from');
        var name = vCard.find('FN').text() || jid;
        $("#fullname").text(name);
    },

    on_pubsub_item: function(iq) {
        $(iq).find('item').each(function() {
            if ($(this).attr('node') != "/home") {
                XMPP.nodes[$(this).attr('node')] = $(this).attr('name');
            }
        });
        var affiliationIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
            .c('affiliations');
        XMPP.connection.sendIQ(affiliationIQ, XMPP.on_affiliation, XMPP.on_error);
    },

    on_affiliation: function(iq) {
        $(iq).find('affiliation').each(function() {
            if ($(this).attr('affiliation') === "owner" && $(this).attr('affiliation') != 'outcast') {
                if (XMPP.nodes[$(this).attr('node')]) {
                    var elem = $('<div class="box_node drop left" id="' +
                                    $(this).attr('node') +
                                    '""><strong>' + XMPP.nodes[$(this).attr('node')] +
                                    '</strong><br><br></div>');
                    $("#" + $(this).attr('node')).remove();
                    $(document).trigger('node_subscriber_count', {id: $(elem).attr('id')});
                    $('#pubsub').append(elem);
                    $(elem).click(function() {
                        $('.box_node').removeClass('highlight');
                        $(elem).addClass('highlight');
                        $(document).trigger('node_info', {id: $(elem).attr('id')});
                    });
                    $(".drop").droppable({
                        drop: function(event, ui) {
                            var jid = ui.draggable.attr('jid');
                            var nodeID = $(this).attr('id');
                            XMPP.on_add_to_whitelist(nodeID, jid);
                            $(document).trigger('node_update_subscriber_count', {id: nodeID});
                        }
                    });
                }
            }
        });
    },

    on_node_affiliation: function(iq) {
        $("#spinner").hide();
        $(iq).find('affiliation').each(function() {
            if ($(this).attr('affiliation') != 'owner' && $(this).attr('affiliation') != 'outcast') {
                var jid = $(this).attr('jid');
                var id = XMPP.jid_to_id(jid) + '-node_info';
                var name = XMPP.roster[jid];
                var splitName = name.split(" ");
                var name1 = splitName[0] || '';
                var name2 = splitName[1] || '';
                var elem = $('<div class="box_roster left" id="' + id + '-node_info">' +
                    '<span class="' + id + '-canvas"' + '></span>' +
                    '<span>' + name1 + '<br>' + name2 + '</span>' +
                    '<a class="delete hidden" id="remove_from_whitelist" href="#">X</a>' + '</div>')
                $('#node_info_whitelist').append(elem);
                $(elem).mouseenter(function() {
                    $(elem).find('#remove_from_whitelist').show()
                });
                $(elem).mouseleave(function() {
                    $(elem).find('#remove_from_whitelist').hide()
                });
                $(elem).find('#remove_from_whitelist').click(function() {
                    nodeID = $(iq).find('affiliations').attr('node');
                    XMPP.remove_from_whitelist(nodeID, jid);
                    $(this).parent().empty().hide();
                });
                var vCardIQ = $iq({to: jid, type: 'get'})
                    .c('vCard', {xmlns: 'vcard-temp'});
                XMPP.connection.sendIQ(vCardIQ, XMPP.on_vcard_node_info, XMPP.on_error);

            }
        });
    },

    on_node_subscriber_count: function(iq) {
        var subscribers = 0;
        var node = $(iq).find('affiliations').attr('node')
        $(iq).find('affiliation').each(function() {
            if ($(this).attr('affiliation') != 'owner'&& $(this).attr('affiliation') != 'outcast') {
                subscribers =  subscribers + 1;
            }
        });
        $("#" + node).append('<h1 class="count">' + subscribers + '</h1>');
    },

    on_node_update_subscriber_count: function(iq) {
        var subscribers = 0;
        var node = $(iq).find('affiliations').attr('node')
        $(iq).find('affiliation').each(function() {
            if ($(this).attr('affiliation') != 'owner' && $(this).attr('affiliation') != 'outcast') {
                subscribers =  subscribers + 1;
            }
        });
        $("#" + node).find('h1').replaceWith('<h1 class="count">' + subscribers + '</h1>');
    },

    on_create_node_whitelist: function(iq) {
        var pubSubIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
            .c('query', {xmlns: 'http://jabber.org/protocol/disco#items'});
        XMPP.connection.sendIQ(pubSubIQ, XMPP.on_pubsub_item, XMPP.on_error);
        node = $(iq).find('create').attr('node')
    }

};

$(document).bind('connect', function(ev, data) {
    var conn = new Strophe.Connection("/http-bind");

    //conn.xmlInput = function (body) {
    //    console.log(body);
    //};

    //conn.xmlOutput = function (body) {
    //    console.log(body);
    //};

    XMPP.my_jid = data.jid;
    XMPP.pubsubservice = data.pubsubservice;
    conn.connect(data.jid, data.password, function(status) {
        if (status === Strophe.Status.CONNECTED) {
            $(document).trigger('connected');
        } else if (status === Strophe.Status.DISCONNECTED) {
            $(document).trigger('disconnected');
        }
    });
    XMPP.connection = conn;
});

$(document).bind('connected', function () {
    $('#login_spinner').hide();
    $('#main-screen').toggle("fast");
    $('#label-online').toggle("fast");
    var rosterIQ = $iq({type: 'get'})
        .c('query', {xmlns: 'jabber:iq:roster'});
    var pubSubIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
        .c('query', {xmlns: 'http://jabber.org/protocol/disco#items'});
    var affiliationIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
        .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
        .c('affiliations');
    var vCardIQ = $iq({type: 'get'})
        .c('query', {xmlns: 'vcard-temp'});
    XMPP.connection.sendIQ(rosterIQ, XMPP.on_roster);
    XMPP.connection.sendIQ(pubSubIQ, XMPP.on_pubsub_item, XMPP.on_error);
    XMPP.connection.sendIQ(vCardIQ, XMPP.on_my_vcard, XMPP.on_error);
});

$(document).bind('disconnected', function () {
    $('#label-online').removeClass('success').addClass('important').text("Offline");
    XMPP.connection = null;
});

$(document).bind('create_node_whitelist', function(event, data) {
    var iq = $iq({to:XMPP.pubsubservice, type:'set'})
        .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
        .c('create')
        .up()
        .c('configure')
        .c('x', {xmlns: 'jabber:x:data', type: "submit"})
        .c('field', {"var": "FORM_TYPE", type: "hidden"})
        .c('value').t('http://jabber.org/protocol/pubsub#node_config')
        .up().up()
        .c('field', {"var": 'pubsub#access_model'})
        .c('value').t("whitelist")
        .up().up()
        .c('field', {"var": 'pubsub#title'})
        .c('value').t(data.node);
    XMPP.connection.sendIQ(iq, XMPP.on_create_node_whitelist);
});

$(document).bind('node_subscriber_count', function(event, data) {
    var nodeCountIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
        .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
        .c('affiliations', {node: data.id});
    XMPP.connection.sendIQ(nodeCountIQ, XMPP.on_node_subscriber_count, XMPP.on_error)
});

$(document).bind('node_update_subscriber_count', function(event, data) {
    var nodeCountIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
        .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
        .c('affiliations', {node: data.id});
    XMPP.connection.sendIQ(nodeCountIQ, XMPP.on_node_update_subscriber_count, XMPP.on_error)
});

$(document).bind('node_info', function(event, data) {
    $("#roster").hide();
    $('#node_info_whitelist').empty().show();
    $("#node_info_buttonlist").empty().show().append('<button id="button_close_node_info" class="btn">&laquo; Back to roster</button>')
    $("#node_info_buttonlist").append('<button id="button_delete_node" class="btn error right">Delete node</button><br><br>');
    $('#button_delete_node').click(function() {
        XMPP.delete_node(data.id);
        $('#node_info').empty().hide();
        $('#node_info_whitelist').empty().hide();
        $('#node_info_buttonlist').empty().hide();
        $('.box_node').removeClass('highlight');
        $("#roster").fadeIn();
    });
    $('#button_close_node_info').click(function() {
        $('#node_info').empty().hide();
        $('#node_info_whitelist').empty().hide();
        $('#node_info_buttonlist').empty().hide();
        $('.box_node').removeClass('highlight');
        $("#roster").fadeIn();
    });
    var nodeAffiliationIQ = $iq({to: XMPP.pubsubservice, type: 'get'})
        .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub#owner'})
        .c('affiliations', {node: data.id});
    XMPP.connection.sendIQ(nodeAffiliationIQ, XMPP.on_node_affiliation)
});

$(document).ready(function() {
    $('#connect-button').click(function() {
        $("#login-form").fadeIn();
    });

    $('#login-button').click(function() {
        $(document).trigger('connect', {
                jid: $('#jid').val().toLowerCase(),
                password: $('#password').val()
        });
        $('#login-screen').hide();
        $('#login_spinner').show();
    });

    $('#create-node-button').click(function () {
        $("#my-modal").modal('hide');
        $(document).trigger('create_node_whitelist', {
                node: $('#node').val()
        });
    });

    $('#login-screen').hide();
    $('#login_spinner').show();
    $.getScript(XMPP.CONFIG_FILE, function(){
        $(document).trigger('connect', {
            jid: XMPPConfig.jid,
            password: XMPPConfig.password,
            pubsubservice: XMPPConfig.pubsubservice
        });
    });
});
