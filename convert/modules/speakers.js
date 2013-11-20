exports.createEmpty = function (filename) {
	return new Speakers([]);
}

function Speakers(data) {
	var me = this;
	me.items = data;

	me.publish = function () {

	}

	return me;
}