/**
 * References:
 * http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
 */

(function (global, undefined) {
'use strict'

var Cc = Components.classes;
var Ci = Components.interfaces;
var alohaWindow;
var composeWindow;

var DEBUGGING = true;

/*
	Composed_with:  _                      _ _ _              
	   __ _| | ___ | |__   __ _    ___  __| (_) |_ ___  _ __  
	  / _` | |/ _ \| '_ \ / _` |  / _ \/ _` | | __/ _ \| '__| 
	 | (_| | | (_) | | | | (_| | |  __/ (_| | | || (_) | |    
	  \__,_|_|\___/|_| |_|\__,_|  \___|\__,_|_|\__\___/|_|.org
                   the future of content editing              
*/
var TAGLINE = "\n--\n" +
"Composed_with:  _                      _ _ _              \n" +
"   __ _| | ___ | |__   __ _    ___  __| (_) |_ ___  _ __  \n" +
"  / _` | |/ _ \\| '_ \\ / _` |  / _ \\/ _` | | __/ _ \\| '__| \n" +
" | (_| | | (_) | | | | (_| | |  __/ (_| | | || (_) | |    \n" +
"  \\__,_|_|\\___/|_| |_|\\__,_|  \\___|\\__,_|_|\\__\\___/|_|.org\n" +
"               the future of content editing";

function log() {
	var args = Array.prototype.concat.apply(['ALOHA WITH WINGS says'], arguments);
	Application.console.log.call(Application.console.log, args);
}

function error() {
	var args = Array.prototype.concat.apply(['ALOHA WITH WINGS says'], arguments);
	Components.utils.reportError.call(Components.utils.reportError, args);
}

var debug = DEBUGGING ? log : function () {};

var XPCOM = {

	/**
	 * @param {string=} path Path to directory or file which the returned file
	 *                  object will point to.
	 * @return {nsILocalFile} File object.
	 */
	createFileObj: function (path) {
		var file = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
		file.initWithPath((path && typeof path === 'string') ? path : 'C:\\');
		return file;
	},

	/**
	 * @param {nsILocalFile} file File object representing a directory.
	 * @return {Array.<string>} Names of immediate sub directories of the given
	 *                          file object.
	 */
	getDirList: function (file) {
		var entries = file.directoryEntries;
		var entry;
		var list = [];

		while (entries.hasMoreElements()) {
			try {
				entry = entries.getNext().QueryInterface(Ci.nsILocalFile);
				list.push(entry.leafName + (entry.isDirectory() ? '/' : ''));
			} catch(ex) {
				error(ex);
			}
		}

		return list;
	},

	/**
	 * @param {string} directory One of the system directory names defined
	 *                 here: https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO
	 * @return {nsILocalFile} File object handler to system directory.
	 */
	getSystemDirectory: function (directory) {
		var dirId;
		var path;

		switch (directory) {
		case 'profile':
			dirId = 'ProfD';
			break;
		}

		if (dirId) {
			path = Cc['@mozilla.org/file/directory_service;1']
					.getService(Ci.nsIProperties)
					.get(dirId, Ci.nsIFile)
					.path;
		}

		return path ? XPCOM.createFileObj(path) : null;
	},

	/**
	 * @param {nsILocalFile} file
	 * @return {string} Contents of file.
	 */
	readFile: function (file) {
		var inputStream = Cc['@mozilla.org/network/file-input-stream;1']
							.createInstance(Ci.nsIFileInputStream);
		var sInputStream = Cc['@mozilla.org/scriptableinputstream;1']
							.createInstance(Ci.nsIScriptableInputStream);

		inputStream.init(file, 0x01, null, null);
		sInputStream.init(inputStream);

		var data = sInputStream.read(sInputStream.available());

		inputStream.close();
		sInputStream.close();

		return data;
	},

	/**
	 * @param {nsILocalFile} dir Directory.
	 * @param {string} path Path relative to dir.
	 */
	changeDir: function (dir, path) {
		var subdirs = path.split('/');
		var j = subdirs.length;
		var i = 0;

		for (; i < j; ++i) {
			dir.append(subdirs[i]);
		}
	}

};

/**
 * param {string} extensionId
 * return {nsILocalFile} Directory.
 */
function getExtensionDirectory(extensionId) {
	var file = XPCOM.getSystemDirectory('profile');
	var dir;

	if (file) {
		file.append('extensions');
		file.append(extensionId);

		if (file.isDirectory()) {
			dir = file;
		} else {
			var path = XPCOM.readFile(file);

			if (path) {
				dir = XPCOM.createFileObj(path);
			}
		}
	}

	return dir;
}

// var dir = getExtensionDirectory('aloha_with_wings@petrosalema.com');
// XPCOM.changeDir(dir, 'chrome/content/aloha/src/plugins');
// debug(dir.path);
// var dirs = XPCOM.getDirList(dir);
// debug('\n' + dirs.join('\n'));

/**
 * return {boolean} True if both the composeWindow, and the alohaWindow handles
 *					are valid.
 */
function checkWindows() {
	var windowsExist = true;

	if (!composeWindow) {
		error('Could not find composeWindow');
		windowsExist = false;
	}

	if (!alohaWindow) {
		error('Could not find alohaWindow');
		windowsExist = false;
	}

	return windowsExist;
}

/**
 * @param {Event} event
 */
function onOverlayLoaded(event) {
	debug('onOverlayLoaded');

	composeWindow = document.getElementById('content-frame');
	alohaWindow = document.getElementById('aloha-editor-frame');
	document.getElementById('FormatToolbar').hidden = true;

	/**
	 * Duck-type the original GenericSendMessage function defined in
	 * "MsgComposeCommands.js".  This function is called when saving and/or
	 * sending messages, and therefore allows us to intercept whenever the
	 * contents of the email are needed, and to copy the contents in
	 * Aloha-Editor back into the original Editor.
	 *
	 * Source: http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
	 *
	 * @param {function} origSendMsg
	 */
	GenericSendMessage = (function (origSendMsg) {
		return function () {
			if (!checkWindows()) {
				return;
			}

			var msgType = document.getElementById('msgcomposeWindow')
			                      .getAttribute('msgtype');

			/*
			// Proceed only if this is actually a send event
			if (msgType != nsIMsgCompDeliverMode.Now
				&& msgType != nsIMsgCompDeliverMode.Later) {
				debug('Will not intercept message because ' + msgType +
					' is not a send event');
				return;
			}
			*/

			var alohaMsg = jQuery('#aloha-msg', alohaWindow.contentDocument);

			jQuery('body',
				composeWindow.contentDocument).html(alohaMsg.html());

			origSendMsg.apply(this, arguments);
		};
	})(GenericSendMessage);

	jQuery(composeWindow).parent().resize(function () {
		jQuery(alohaWindow).height(jQuery(this).height());
	});
}

/**
 * @param {Event} event
 */
function onWindowInit(event) {
	debug('onWindowInit');

	gMsgCompose.RegisterStateListener({

		NotifyComposeFieldsReady: function () {
			debug('NotifyComposeFieldsReady');
		},

		NotifyComposeBodyReady: function () {
			debug('NotifyComposeBodyReady');

			if (!checkWindows()) {
				return;
			}

			var mozBody = jQuery('body', composeWindow.contentDocument);
			var alohaBody = jQuery('#aloha-msg', alohaWindow.contentDocument);

			// Add the `TAGLINE` string to message.
			var signatureBlock = mozBody.find('>.moz-signature');
			if (signatureBlock.length) {
				signatureBlock.last().prepend(TAGLINE + '\n');
			} else {
				mozBody.append('<p><br /></p><pre class="moz-signature" '
					+ 'style="margin:0;padding:0;">' + TAGLINE + '</pre>');
			}

			// Copy the contents that Thunderbird put into its original
			// editor into the aloha editor.
			alohaBody.html(mozBody.html());
		},

		/**
		 * Reset the editor contents, for the next time it is called up.
		 * @param {?} aResult
		 */
		ComposeProcessDone: function (aResult) {
			debug('ComposeProcessDone');
		},

		/**
		 * @param {?} folderURI
		 */
		SaveInFolderDone: function (folderURI) {
			debug('SaveInFolderDone');
		}

	});
}

/**
 * @param {Event} event
 */
function onWindowClose(event) {
	debug('onWindowClose');
	alohaWindow.contentDocument.getElementById('aloha-msg').innerHTML = '';
}

// Initialize at overlay onload event.
// https://developer.mozilla.org/en/Code_snippets/On_page_load
global.addEventListener('load', onOverlayLoaded, false);

// Fires every time the window is opened.
global.addEventListener('compose-window-init', onWindowInit, true);

global.addEventListener('compose-window-close', onWindowClose, true);

// Intercept message sending.
// https://developer.mozilla.org/en/Extensions/Thunderbird/HowTos/Common_Thunderbird_Use_Cases/Compose_New_Message
// global.addEventListener('compose-send-message', onSendMessage, true);

}(window));
