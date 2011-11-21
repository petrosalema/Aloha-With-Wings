(function () {

window.log = function () {
	var args = Array.prototype.concat.apply(['Aloha: '], arguments);
	Application.console.log.call(Application.console.log, args);
};

$(function () {
	Aloha.jQuery('#editable').aloha();
}); // on dom ready

})();