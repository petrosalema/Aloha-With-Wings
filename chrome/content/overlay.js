function log () {
	var args = Array.prototype.concat.apply(['Aloha: '], arguments);
	Application.console.log.call(Application.console.log, args);
};

window.addEventListener('load', function __overlayOnload(ev) {
	document.getElementById('FormatToolbar').hidden = true;
	
	var origEditor = document.getElementById('content-frame');
	var alohaEditor = document.getElementById('aloha-editor');
	
	// If we make the original editor invisible, it become impossible to send
	// messages...
	// origEditor.hidden = true;
	// ... so we wil make it very very small instead
	origEditor.flex = false;
	
	setTimeout(function () {
		// Copy and signatures into the Aloha Editor frame
		var body = origEditor.contentDocument.getElementsByTagName('body');
		var editable = alohaEditor.contentDocument.getElementById('editable');
		if (body[0].innerHTML != '') {
			editable.innerHTML = body[0].innerHTML;
		}
	}, 1000);
	
	// Duck-type the original GenericSendMessage function defined in
	// "MsgComposeCommands.js"
	// This function is called when saving and/or sending messages, and
	// therefore allows us to intercept whenever the contents of the email are
	// needed, and to copy the contents in Aloha-Editor back into the original
	// Editor.
	// Source:  http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
	GenericSendMessage = (function (origSendMsg) {
		return function () {
			var editable = alohaEditor.contentDocument.getElementById('editable');
			var body = origEditor.contentDocument.getElementsByTagName('body');
			body[0].innerHTML = editable.innerHTML;
			origEditor.hidden = false;
			origSendMsg.apply(this, arguments);
		};
	})(GenericSendMessage);
}, false);
