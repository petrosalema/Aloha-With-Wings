/**
 * References:
 *	http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
 */
(function(undefined) {
'use strict'

var DEBUGGING = true;
var alohaWindow;
var composeWindow;

function log() {
	var args = Array.prototype.concat.apply(['ALOHA WITH WINGS says'], arguments);
	Application.console.log.call(Application.console.log, args);
};

function error() {
	var args = Array.prototype.concat.apply(['ALOHA WITH WINGS says'], arguments);
	Components.utils.reportError.call(Components.utils.reportError, args);
};

var debug = DEBUGGING ? log : function() {};

function checkWindows() {
	if (!composeWindow) {
		error('Could not find composeWindow');
		return false;
	}

	if (!alohaWindow) {
		error('Could not find alohaWindow');
		return false;
	}

	return true;
};

/**
 * @param {Event} event
 */
function onOverlayLoaded(event) {
	debug('onOverlayLoaded');
	composeWindow = document.getElementById('content-frame');
	if (composeWindow) {
		// If we make the original editor invisible, it become impossible to send
		// messages, so instead of setting the hidden attribute to true, we will
		// change the flex attribute, so that our style sheet can make the height
		// original editor very small
		// composeWindow.flex = false;
	}
	alohaWindow = document.getElementById('aloha-editor');
	document.getElementById('FormatToolbar').hidden = true;
};

/**
 * https://developer.mozilla.org/en/Extensions/Thunderbird/HowTos/Common_Thunderbird_Use_Cases/Compose_New_Message
 *
 * @param {Event} event
 */
function onSendMessage(event) {
	debug('onSendMessage');

	if (!checkWindows()) {
		return;
	}

	var msgType = document.getElementById('msgcomposeWindow').getAttribute('msgtype');

	// Proceed only if this is actually a send event
	if (msgType != nsIMsgCompDeliverMode.Now
		&& msgType != nsIMsgCompDeliverMode.Later) {
		debug('Will not intercept message because ' + msgType
			+ ' is not a send event');
		return;
	}

	var alohaMessage = alohaWindow.contentDocument.getElementById('aloha-msg').innerHTML;
	composeWindow.contentDocument.getElementsByTagName('body')[0].innerHTML = alohaMessage;
};

/**
 * @param {Event} event
 */
function onWindowInit(event) {
	debug('onWindowInit');

	gMsgCompose.RegisterStateListener({
		NotifyComposeFieldsReady: function() {
			debug('NotifyComposeFieldsReady');
		},

		NotifyComposeBodyReady: function() {
			debug('NotifyComposeBodyReady');
			if (checkWindows()) {
				// Copy the contents that Thunderbird put into its original
				// editor into the aloha editor, but only do so if there is
				// indeed something to copy.
				var body = composeWindow.contentDocument.getElementsByTagName('body');
				if (body[0].innerHTML !== '') {
					var msgElement = alohaWindow.contentDocument.getElementById('aloha-msg');
					if (msgElement) {
						msgElement.innerHTML = body[0].innerHTML;
					}
				}
			}
		},

		ComposeProcessDone: function(aResult) {
			debug('ComposeProcessDone');
		},

		SaveInFolderDone: function(folderURI) {
			debug('SaveInFolderDone');
		}
	});
};

// Initialize at overlay onload event
// https://developer.mozilla.org/en/Code_snippets/On_page_load
window.addEventListener('load', onOverlayLoaded, false);

// This event fires every time the window is opened
window.addEventListener('compose-window-init', onWindowInit, true);

// Intercept message sending
// https://developer.mozilla.org/en/Extensions/Thunderbird/HowTos/Common_Thunderbird_Use_Cases/Compose_New_Message
window.addEventListener('compose-send-message', onSendMessage, true);
})();
