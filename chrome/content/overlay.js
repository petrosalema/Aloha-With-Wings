function log () {
	var args = Array.prototype.concat.apply(['Aloha: '], arguments);
	Application.console.log.call(Application.console.log, args);
};

window.addEventListener('load', function __overlayOnload(e) {
	document.getElementById('FormatToolbar').hidden = true;
	
	var origEditor = document.getElementById('content-frame');
	origEditor.hidden = true;
	var alohaEditor = document.getElementById('aloha-editor');
	var doc = editor.contentDocument; //.documentElement;
	
	
	
	// Duck-type the original GenericSendMessage function defined in
	// "MsgComposeCommands.js"
	// This function is called when saving and/or sending messages, and
	// therefore allows us to intercept whenever the contents of the email are
	// needed.
	// Source:
	// http://www.koders.com/javascript/fid58899A0E5FA5EAC7758A368EC9579A513F86A396.aspx?s=search#L876
	
	GenericSendMessage = ( function ( origSendMsg ) {
		return function () {
			var body = document.getElementById('editable');
			alert(body.innerHTML);
			origSendMsg.apply( {}, arguments );
		};
	} ) ( GenericSendMessage );
	
	// var iframe = document.createElement('iframe');
	// log(typeof doc.appendChild);
	// doc.appendChild(iframe);
	// log(doc.innerHTML);
}, false);
