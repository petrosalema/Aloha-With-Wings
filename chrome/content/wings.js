(function () {

window.log = function () {
	var args = Array.prototype.concat.apply(['Aloha: '], arguments);
	Application.console.log.call(Application.console.log, args);
};

Aloha.ready(function () {
	Aloha.jQuery('#editable').aloha();
});

})();