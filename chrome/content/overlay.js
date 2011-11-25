/**
 * References:
 * http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
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
	alohaWindow = document.getElementById('aloha-editor-frame');
	document.getElementById('FormatToolbar').hidden = true;

	// Duck-type the original GenericSendMessage function defined in
	// "MsgComposeCommands.js"
	// This function is called when saving and/or sending messages, and
	// therefore allows us to intercept whenever the contents of the email are
	// needed, and to copy the contents in Aloha-Editor back into the original
	// Editor.
	// Source:  http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
	GenericSendMessage = (function (origSendMsg) {
		return function () {
			if (!checkWindows()) {
				return;
			}

			var msgType = document.getElementById('msgcomposeWindow').getAttribute('msgtype');

			// Proceed only if this is actually a send event
			if (msgType != nsIMsgCompDeliverMode.Now
				&& msgType != nsIMsgCompDeliverMode.Later) {
				debug('Will not intercept message because ' + msgType +
					' is not a send event');
				return;
			}

			var alohaMessage = alohaWindow.contentDocument.getElementById('aloha-msg').innerHTML;
			composeWindow.contentDocument.getElementsByTagName('body')[0].innerHTML = alohaMessage;
			origSendMsg.apply(this, arguments);
		};
	})(GenericSendMessage);
	
	jQuery(composeWindow).parent().resize(function() {
		jQuery(alohaWindow).height(jQuery(this).height());
	});
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

		/**
		 * Resets the editor contents, for the next time it is called up.
		 *
		 * @param {?} aResult
		 */
		ComposeProcessDone: function(aResult) {
			debug('ComposeProcessDone');
		},

		SaveInFolderDone: function(folderURI) {
			debug('SaveInFolderDone');
		}
	});
};

/**
 * @param {Event} event
 */
function onWindowClose(event) {
	debug('onWindowClose');
	alohaWindow.contentDocument.getElementById('aloha-msg').innerHTML = '';
};

// Initialize at overlay onload event
// https://developer.mozilla.org/en/Code_snippets/On_page_load
window.addEventListener('load', onOverlayLoaded, false);

// Fires every time the window is opened
window.addEventListener('compose-window-init', onWindowInit, true);

// Fires every time the window is closed
window.addEventListener('compose-window-close', onWindowClose, true);

// Intercept message sending
// https://developer.mozilla.org/en/Extensions/Thunderbird/HowTos/Common_Thunderbird_Use_Cases/Compose_New_Message
window.addEventListener('compose-send-message', onSendMessage, true);
})();
