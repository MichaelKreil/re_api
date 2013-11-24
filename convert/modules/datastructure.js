var fs = require('fs');

exports.load = function (filename) {
	var me = {};

	me.data = JSON.parse(fs.readFileSync(filename, 'utf8'));

	me.check = function (obj) {
		validate(obj, me.data, 'root');
	};

	me.generateDocu = function (filename, template) {
		var html = getDocuHTML(me.data);
		template = fs.readFileSync(template, 'utf8');
		html = template.replace(/#content#/, html);
		fs.writeFileSync(filename, html, 'utf8');
	}

	return me;
}

function validate(object, structure, debug) {
	if (typeof structure !== 'object') {
		console.error('structure von "'+debug+'" ist kein Objekt.');
		return;
	}

	if (structure.optional && (object === undefined)) return;

	switch (structure.type) {
		case 'array':
			if (structure.substructure === undefined) {
				console.error('Für array fehlt die Definition substructure. ('+debug+')');
				return;
			}
			if (typeof structure.substructure != 'object') {
				console.error('Für array muss die Definition substructure ein Object sein. ('+debug+')');
				return;
			}
			if (!(object instanceof Array)) {
				console.error('object mussen ein Array sein. ('+debug+')');
				return;
			}
			object.forEach(function (element, index) {
				validate (element, structure.substructure, debug+'['+index+']');
			});
		break;
		case 'object':
			if (structure.substructure === undefined) {
				console.error('Für object fehlt die Definition substructure. ('+debug+')');
				return;
			}
			if (!(structure.substructure instanceof Array)) {
				console.error('Für object muss die Definition substructure ein Array sein. ('+debug+')');
				return;
			}
			if (typeof object != 'object') {
				console.error('object muss ein Object sein. ('+debug+')');
				return;
			}
			var keys = {};
			structure.substructure.forEach(function (substructure) {
				var key = substructure.key;
				keys[key] = true;
				if ((!substructure.optional) && (object[key] == undefined)) {
					console.error('Es fehlt der Key "'+key+'". ('+debug+')');
					return;
				}
				validate(object[key], substructure, debug+'.'+key);
			});
			Object.keys(object).forEach(function (key) {
				if (keys[key] === undefined) {
					console.error('Der Key "'+key+'" ist zu viel. ('+debug+')');
					return;
				}
			});
		break;

		case 'datetime':
			if (!(object instanceof Date)) {
				console.error('Wert muss ein DateTime sein. ('+debug+')');
				return
			}
		break;

		case 'integer':
			if (typeof object != 'number') {
				console.error('Wert muss ein Integer sein. ('+debug+')');
				return
			}
			if (object != Math.floor(object)) {
				console.error('Wert muss ein Integer und kein Float sein. ('+debug+')');
				return
			}
		break;

		case 'string':
			if (typeof object != 'string') {
				console.error('Wert muss ein String sein. ('+debug+')');
				return
			}
		break;

		case 'url':
			if (typeof object != 'string') {
				console.error('Wert muss ein String (URL) sein. ('+debug+')');
				return
			}
			if (!/^http:\/\/[a-z\/\.]*$/.test(object)) {
				console.error('Wert muss eine korrekt formatierte URL sein. ('+debug+')');
				return
			}
		break;

		case 'set':
			var found = false;
			structure.values.forEach(function (value) {
				if (value == object) found = true;
			})
			if (!found) console.error('Wert "'+object+'" kommt im Set nicht vor. ('+debug+')');
		break;

		default: console.error('Unbekannter Typ "'+structure.type+'"');
	}
}
