var XMPP = {
	connection: null,
	my_jid: null,

	log: function(msg) {
		$('#log').prepend('<p style="color:silver;">' + msg + '</p>')
	},

	on_roster: function(iq) {
		$(iq).find('item').each(function() {
			var jid = $(this).attr('jid');
			var id = XMPP.jid_to_id(jid);
			var name = $(this).attr('name') || jid;
			var splitname = name.split(" ")
			$('#roster').append('<div class="drag well2 left" style="margin-left:10px;"><span class="right" style="margin-top:7px">' + splitname[0] + '<br>' + splitname[1] + '</span><span class="' + id + '-canvas"' + '</span></div>');
			XMPP.insert_roster(jid, name);
		});
	},

	on_my_vcard: function(iq) {
		// Avatar photo
		var vCard = $(iq).find("vCard");
		var img = vCard.find('BINVAL').text();
            	var type = vCard.find('TYPE').text();
            	var img_src = 'data:'+type+';base64,'+img;
      	      	var ctx = $('#avatar').get(0).getContext('2d');
            	var img = new Image();
            	img.onload = function() {
                	ctx.drawImage(img,0,0)
            	}
		img.src = img_src;
		// Set name
		var firstName = vCard.find('FN').text();
		$("#fullname").text(firstName);
	},

	on_vcard_error: function(iq) {
		return;
	},

	on_vcard: function(iq) {
		var jid = $(iq).attr('from');
		var id = XMPP.jid_to_id(jid);
		var idAvatar = XMPP.jid_to_id($(iq).attr('from') + '-avatar');
		var vCard = $(iq).find("vCard");
		//var fullName = vCard.find('FN').text();
		//var firstName = vCard.find('GIVEN').text();
		//var familyName = vCard.find('FAMILY').text();
		/*
		if (!familyName) {
			$('#roster').append('<div class="drag well2 left" style="margin-left:10px;"><span class="right" style="margin-top:7px">' + jid + '</span><canvas class="left" id="' + idAvatar + '" width="50" height="50"></canvas></div>');
		} else {
			$('#roster').append('<div class="drag well2 left" style="margin-left:10px;"><span class="right" style="margin-top:7px">' + firstName + '<br>' + familyName + '</span><canvas class="left" id="' + idAvatar + '" width="50" height="50"></canvas></div>');
		}
		*/
		$('.' + id + '-canvas').append('<canvas class="left" id="' + idAvatar + '" width="50" height="50"></canvas>');
		var img = vCard.find('BINVAL').text();
            	var type = vCard.find('TYPE').text();
            	var img_src = 'data:'+type+';base64,'+img;
      	      	var ctx = $('#'+idAvatar).get(0).getContext('2d');
            	var img = new Image();
            	img.onload = function() {
                	ctx.drawImage(img,0,0, 50, 50);
            	}
		img.src = img_src;
	        $(".drag").draggable({
        		appendTo: "body",
        		helper: "clone"
        	});
	},

	insert_roster: function(jid, name) {
		var id = XMPP.jid_to_id(jid);
		var vcardiq = $iq({to: jid, type: 'get'}).c('vCard', {xmlns: 'vcard-temp'});
		XMPP.connection.sendIQ(vcardiq, XMPP.on_vcard, XMPP.on_vcard_error);
	},

	jid_to_id: function(jid) {
		return Strophe.getBareJidFromJid(jid)
		.replace(/@/g, "-")
		.replace(/\./g, "-");
	},

	on_pubsub_item: function(iq) {
		$(iq).find('item').each(function() {
			if ($(this).attr('node') != "/home") {
				$('#pubsub').append('<div class="well drop left" style="margin-left:5px;"><strong>' + $(this).attr('node') + '</strong><br><br></div>');
			}
		});
		$(".drop").droppable({
			drop: function(event, ui) {
       				$("<span class='label notice'>" + ui.draggable.text() + "</span><br>").appendTo(this);
        	 	}
       		})
	},

	on_error: function(iq) {
		alert(error);
	}
};

$(document).bind('connect', function(ev, data) {
	var conn = new Strophe.Connection("/http-bind");
	XMPP.my_jid = data.jid;
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
	$('#main-screen').toggle("fast")
	$('#label-online').toggle("fast")
	XMPP.log("Connection established!");
	XMPP.log("Requesting roster..");
	var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
	XMPP.connection.sendIQ(iq, XMPP.on_roster);
	XMPP.log("Getting PubSub nodes..");
	var pubsubiq = $iq({to: 'pubsub.red.local', type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/disco#items'});
	XMPP.connection.sendIQ(pubsubiq, XMPP.on_pubsub_item, XMPP.on_error);
	var vcardiq = $iq({id: '1', type: 'get'}).c('query', {xmlns: 'vcard-temp'});
	XMPP.connection.sendIQ(vcardiq, XMPP.on_my_vcard, XMPP.on_error);
	XMPP.log("Done.");

});

$(document).bind('disconnected', function () {
	$('#label-online').removeClass('success').addClass('important').text("Offline")
	XMPP.log("Connection terminated.");
	XMPP.connection = null;
});

$(document).bind( "drop", function(event, ui) {
	XMPP.log("dropped")
});

$(document).ready(function() {
	/*
	$(document).keydown(function() {
		if (event.keyCode==116 || event.keyCode==82) {
			event.keyCode = 0;
			event.cancelBubble = true;
			return false;
		}
	});
	*/

	$('#connect-button').click(function() {
		$("#login-form").fadeIn();
	});

	$('#login-button').click(function() {
		$(document).trigger('connect', {
        		//jid: $('#jid').val().toLowerCase() + "@red.local",
        		jid: $('#jid').val().toLowerCase(), 
        		password: $('#password').val()
		});
		$('#login-screen').fadeOut();
	});

	$('#clear-log').click(function() {
		$('#log').html('');
	});


});

