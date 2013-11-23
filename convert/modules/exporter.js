var fs = require('fs');


exports.generateTSV = function (filename, items, structure) {
	var funcs = [];
	var header = [];
	var structureItems = [];

	var rec = function (structure, access, prefix) {

		if (access === undefined) access = function (a) { return a }
		if (prefix === undefined) prefix = '';

		structure.items.forEach(function (item) {
			var key = item.key;
			switch (item.type) {
				case 'integer':
				case 'set':
				case 'string':
				case 'url':
					funcs.push(function (item) {
						return (access(item) === undefined || access(item)[key] === undefined) ? '' : stripHTML(access(item)[key])
					});
					header.push(prefix+key);
					structureItems.push(item);
				break;
				case 'datetime':
					funcs.push(function (item) {
						return (access(item) === undefined || access(item)[key] === undefined) ? '' : formatDate(access(item)[key])
					});
					header.push(prefix+key);
					structureItems.push(item);
				break;
				case 'object':
					rec(
						item,
						function (a) { return access(a)[key] },
						prefix+key+'_'
					)
				break;
				case 'arrayofobjects':
					var subkey = item.items[0].key;
					funcs.push(function (item) {
						var list = [];
						access(item)[key].forEach(function (subitem) {
							list.push(subitem[subkey]);
						});
						return list.join(', ');
					});
					header.push(prefix+key+'_'+subkey+'s');
					structureItems.push(item);
				break;
				default:
					console.error('Unknown Type "'+item.type+'"');
			}
		})
	}

	rec(structure.structure);

	structureItems.forEach(function (item, index) {
		if (item.examples === undefined) item.examples = {};
		if (item.examples.tsv === undefined) item.examples.tsv = [];
		if (item.header === undefined) item.header = {};
		item.header.tsv = header[index];
	});

	var tsv = [];
	tsv.push(header.join('\t'));
	items.forEach(function (item) {
		var line = funcs.map(function (func, index) {
			var value = func(item).replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
			structureItems[index].examples.tsv.push(value);
		})
		tsv.push(line.join('\t'));
	});
	
	fs.writeFileSync(filename, tsv.join('\n'), 'utf8');
};


exports.makeDocu = function (structure, filename, template) {
	function getHTML(structure, suffix) {
		var html = [];

		var desc = '<span class="desc">// ';
		if (structure.optional) desc += ' (optional) ';
		desc += structure.description + '</span>';

		switch (structure.type) {
			case 'object':
				html.push('<span class="highlight">{</span> '+desc+'');

				html.push('<div class="indent">');

				structure.substructure.forEach(function (substructure, index) {
					html.push('<div class="subelement"><span class="highlight">'+substructure.key+':</span> ');
					html.push(getHTML(substructure, (index < structure.substructure.length - 1) ? ',' : ''));
					html.push('</div>');
				})

				html.push('</div>');
				html.push('<span class="highlight">}'+suffix+'</span>');
			break;

			case 'array':
				html.push('<span class="highlight">[</span> '+desc+'');
				html.push('<div class="indent">');

				html.push(getHTML(structure.substructure, ''));

				html.push('</div>');
				html.push('<span class="highlight">]'+suffix+'</span>');
			break;

			case 'string':
				html.push('"String"'+suffix+' '+desc);
			break;

			case 'url':
				html.push('"URL"'+suffix+' '+desc);
			break;

			case 'datetime':
				html.push('DateTime'+suffix+' '+desc);
			break;

			case 'integer':
				html.push('Integer'+suffix+' '+desc);
			break;

			case 'set':
				html.push('Wert einer Liste'+suffix+' '+desc);

				var values = structure.values.map(function (value, index) {
					var separator = (index < structure.values.length-1) ? ', ' : '';
					switch (typeof value) {
						case 'string': return '"'+value+'"' + separator;
						case 'number': return value + separator;
						default: console.error('Set-Typ unbekannt');
					}
				});
				values.unshift('mögliche Werte sind: [');
				values.push(']');

				var result = [];
				var temp = '';
				values.forEach(function (chunk) {
					if (temp.length + chunk.length > 80) {
						result.push(temp);
						temp = '';
					}
					temp += chunk;
				});
				result.push(temp);
				result = '// '+result.join('<br>// ');

				html.push('<div class="desc">'+result+'</div>');
			break;

			default:
				console.error('Unbekannter Typ "'+structure.type+'"');
		}

		return html.join('\n');

		/*
		html += '<h3 class="key">'+item.key;
		if (item.optional) html += '<span class="optional"> (optional)</span>';
		html += '</h3>';
		html += '<p class="desc">'+item.description+'</p>';
		*/
	}
	/*
	var html = structure.items.map(function (item) {
		var html = '';
		html += '<h3 class="key">'+item.key;
		if (item.optional) html += '<span class="optional"> (optional)</span>';
		html += '</h3>';


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
						if (codes.length > 10) break;
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
*/
	template = fs.readFileSync(template, 'utf8');
	var html = getHTML(structure.structure, '');
	html = template.replace(/#content#/, html);
	fs.writeFileSync(filename, html, 'utf8')
}

function formatDate(d) {
	function pad(n) { return n<10 ? '0'+n : n }

	var t =
		  pad(d.getUTCDate())+'.'
		+ pad(d.getUTCMonth()+1)+'.'
		+ d.getUTCFullYear()+' '
		+ pad(d.getUTCHours())+':'
		+ pad(d.getUTCMinutes())+':'
		+ pad(d.getUTCSeconds())+'';

	return t;
}

function stripHTML(text) {
	text = (''+text);
	text = text.replace(/\<br\>/gi, '\n');
	text = text.replace(/\<.*?\>/g, '');
	text = text.replace(/\&nbsp;/g, ' ');
	text = text.replace(/ {2,}/g, ' ');
	return text;
}