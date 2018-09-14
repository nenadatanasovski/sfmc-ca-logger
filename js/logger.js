define( function( require ) {

    'use strict';

	var Postmonger = require( 'postmonger' );
	var $ = require( 'jquery' );

    var connection = new Postmonger.Session();
    var toJbPayload = {};
    var step = 1;
	var tokens;
	var endpoints;

    $(window).ready(onRender);

    connection.on('initActivity', function(payload) {
        var LogValue;

        if (payload) {
            toJbPayload = payload;
            console.log('payload',payload);

			//merge the array of objects.
			var aArgs = toJbPayload['arguments'].execute.inArguments;
			var oArgs = {};
			for (var i=0; i<aArgs.length; i++) {
				for (var key in aArgs[i]) {
					oArgs[key] = aArgs[i][key];
				}
			}
			//oArgs.LogValue will contain a value if this activity has already been configured:
			LogValue = oArgs.LogValue || toJbPayload['configurationArguments'].defaults.LogValue;
        }

        // If there is no LogValue provided, disable the next button
        if (LogValue) {
            $("#LogValue").val(LogValue);
        }

		gotoStep(step);

    });

    connection.on('requestedTokens', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			tokens = data;
            console.log("tokens",data);
		}
    });

    connection.on('requestedEndpoints', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			endpoints = data;
            console.log("endpoints",endpoints);
		}
    });

    connection.on('clickedNext', function() {
        step++;
        gotoStep(step);
        connection.trigger('ready');
    });

    connection.on('clickedBack', function() {
        step--;
        gotoStep(step);
        connection.trigger('ready');
    });

    function onRender() {
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    };

    function gotoStep(step) {
        $('.step').hide();
        switch(step) {
            case 1:
                $('#step1').show();
                connection.trigger('updateButton', { button: 'next', text: 'next', enabled: true });
                connection.trigger('updateButton', { button: 'back', visible: false });
                break;
            case 2:
                $('#step2').show();
                $('#showLogValue').html(getLogValue());
                connection.trigger('updateButton', { button: 'back', visible: true });
                connection.trigger('updateButton', { button: 'next', text: 'done', visible: true });
                break;
            case 3: // Only 2 steps, so the equivalent of 'done' - send off the payload
                save();
                break;
        }
    };

    function getLogValue() {
        var LogValue = $("#LogValue").val();
        console.log("getLogValue: " + LogValue);
        return LogValue;
    };

    function save() {

        var value = getLogValue();

		//this will be sent into the custom activity body within the inArguments array.
        toJbPayload['arguments'].execute.inArguments = [{"LogValue": value}];

		toJbPayload.metaData.isConfigured = true;  //this is required by JB to set the activity as Configured.
        connection.trigger('updateActivity', toJbPayload);
    };

});
