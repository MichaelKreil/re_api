var fs = require('fs');

exports.load = function (filename) {
	var me = {};

	me.structure = JSON.parse(fs.readFileSync(filename, 'utf8'));

	me.check = function (items) {
		items.forEach(function (item) {
			validate(item, me.structure.items, item.title);
		});
	};

	me.generateDocu = function (filename, template) {
		var html = getDocuHTML(me.structure);
		template = fs.readFileSync(template, 'utf8');
		html = template.replace(/#content#/, html);
		fs.writeFileSync(filename, html, 'utf8');
	}

	return me;
}

function validate(obj, structure, debug) {
	if (typeof obj !== 'object') {
		console.error('"'+obj+'" von "'+debug+'" ist kein Objekt.');
		return;
	}

	var attributes = {};
	structure.forEach(function (attribute) {
		attributes[attribute.key] = attribute;
	})

	Object.keys(obj).forEach(function (key) {
		if (attributes[key] === undefined) {
			console.error('Der Schlüssel "'+key+'" ist unbekannt.')
		}
	})

	structure.forEach(function (item) {
		var key = item.key;
		if (obj[key] === undefined) {
			if (!item.optional) {
				console.error('Der Schlüssel "'+key+'" ist nicht definiert.');
			}
		} else {
			switch (item.type) {
				case 'arrayofobjects':
					if (!(obj[key] instanceof Array)) {
						console.error('Feld "'+key+'" muss ein Array sein.');
						return;
					}
					obj[key].forEach(function (element) {
						validate(element, item.items, key);
					})
				break;

				case 'datetime': if (!(obj[key] instanceof Date)) console.error('Feld "'+key+'" muss ein DateTime sein.'); break;
				
				case 'integer': if ((typeof obj[key] != 'number') || (obj[key] != Math.floor(obj[key]))) console.error('Feld "'+key+'" muss ein Integer sein, ist aber "'+obj[key]+'"'); break;
				
				case 'object': validate(obj[key], item.items, key); break;

				case 'set':
					var found = false;
					item.values.forEach(function (value) {
						if (value == obj[key]) found = true;
					})
					if (!found) console.error('Feld "'+key+'" hat den unbekannten Wert "'+obj[key]+'".');
				break;
				
				case 'string': if (typeof obj[key] != 'string') console.error('Feld "'+key+'" muss ein String sein.'); break;
				
				case 'url': if ((typeof obj[key] != 'string') || (!/^http:\/\/[a-z\/\.]*$/.test(obj[key]))) console.error('Feld "'+key+'" mit dem Wert "'+obj[key]+'" muss eine valide URL sein.'); break;
				
				default: console.error('Unbekannter Typ "'+item.type+'"');
			}
		}
	})
}

function getDocuHTML(structure) {
	var html = structure.items.map(function (item) {
		var html = '';
		html += '<h3 class="key">'+item.key;
		if (item.optional) html += '<span class="optional"> (optional)</span>';
		html += '</h3>';

		html += '<p class="desc">'+item.description+'</p>';

		if (item.examples) {
			var examples = [];
			Object.keys(item.examples).forEach(function (key) {
				var list = item.examples[key];
				var codes = ['<code><b>'+item.header[key]+'</b></code>'];
				var known = {'':true};
				for (var i = 0; i < list.length; i++) {
					if (!known[list[i]]) {
						codes.push('<code>'+list[i]+'</code>');
						known[list[i]] = true;
						if (codes.length > 5) break;
					}
				}
				if (codes.length > 1) {
					examples.push('<span class="example_type"><span class="example_type_name">'+key+'</span><span class="example_list">'+codes.join('')+'</span></span>');
				}
			});
			if (examples.length > 0) {
				html += '<p class="examples">Beispiele: '+examples.join(' ')+'</p>';
			}
		}
		

		switch (item.type) {
				case 'arrayofobjects':
					var subhtml = getDocuHTML(item);
					html += '<p class="type">Datentyp: Array of Objects<br>Die einzelnen Objekte sind folgendermaßen definiert:'+subhtml+'</p>';
				break;

				case 'datetime': html += '<p class="type">Datentyp: DateTime</p>'; break;
				
				case 'integer': html += '<p class="type">Datentyp: Integer</p>'; break;
				
				case 'object':
					var subhtml = getDocuHTML(item);
					html += '<p class="type">Datentyp: Object<br>Das Objekt ist folgendermaßen definiert:'+subhtml+'</p>';
				break;

				case 'set':
					var values = [];
					item.values.forEach(function (value) {
						switch (typeof value) {
							case 'string': value = '"'+value+'" <span class="note">(String)</span>'; break;
							case 'number': value = value+' <span class="note">(Zahl)</span>'; break;
							default: console.error('Set-Typ unbekannt');
						}
						values.push('<li>'+value+'</li>');
					});
					html += '<p class="type">Datentyp: Set<br>Mit den möglichen Werten:<ul class="values">'+values.join('\n')+'</ul></p>';
				break;
				
				case 'string': html += '<p class="type">Datentyp: String</p>'; break;
				
				case 'url': html += '<p class="type">Datentyp: String (valide URL)</p>'; break; break;
				
				default: console.error('Unbekannter Typ "'+item.type+'"');
			}


		
		return '<li>'+html+'</li>';
	});
	return '<ul class="fields">\n'+html.join('\n')+'\n</ul>';
}

/*20130328T095625Z*/