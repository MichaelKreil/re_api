var fs = require('fs');
exports.generateTSV = function (filename, data, structure, filter) {
	var subdata = data;
	var substructure = structure.data;

	filter.forEach(function (key) {
		var found = substructure.substructure.filter(function (element) {
			return element.key == key;
		});
		if (found.length == 1) {
			subdata = subdata[key];
			substructure = found[0];
		} else {
			console.error('Konnte Element "'+key+'" nicht finden.');
			process.exit();
		}
	});

	if (substructure.type != 'array') {
		console.error('Für TSV-Export muss das Element ein Array sein.');
		process.exit();
	}

	var tsvStructure = [];
	var formatFunctions = {
		'datetime':formatExcelDate,
		'integer':stripHTML,
		'set':stripHTML,
		'string':stripHTML,
		'url':stripHTML
	};

	analyseStructure(substructure.substructure);

	function analyseStructure(structure, keys, access) {
		if (!keys) keys = [];
		if (!access) access = [];

		switch (structure.type) {
			case 'object':
				structure.substructure.forEach(function (substructure) {
					analyseStructure(
						substructure,
						keys.concat([substructure.key]),
						access.concat(['.'+substructure.key])
					)
				})
			break;
			case 'datetime':
			case 'integer':
			case 'set':
			case 'string':
			case 'url':
				tsvStructure.push({header:keys,access:access,format:formatFunctions[structure.type]});
			break;
			case 'array':
				var substructure = structure.substructure;
				switch (substructure.type) {
					case 'object':
						var subkey = substructure.substructure[0].key;
						var subtype = substructure.substructure[0].type;
						var subFormatFunction = formatFunctions[subtype];
						var aggregateFunction = function (data) {
							var d = data.map(function (element) {
								return subFormatFunction(element[subkey]);
							});
							return d.join(', ');
						}
						tsvStructure.push({
							header:keys.concat([substructure.substructure[0].key]),
							access:access,
							format:aggregateFunction
						});
					break;
					default: 
						console.error('Unbekannter Sub-Typ "'+substructure.type+'"');
						process.exit();
				}
			break;
			default:
				console.error('Unbekannter Typ "'+structure.type+'"');
				process.exit();
		}
	}

	var header = tsvStructure.map(function (element) {
		return element.header.join('_');
	});
	var tsv = [header];

	subdata.forEach(function (item) {
		row = tsvStructure.map(function (tsvItem) {
			var value = item;
			tsvItem.access.forEach(function (path) {
				if (value === undefined) return;
				if (path.charAt(0) == '.') {
					value = value[path.substr(1)];
				} else {
					console.error('DEFEKT');
				}
			});
			if (value === undefined) return '';
			return tsvItem.format(value);
		})
		tsv.push(row);
	})

	tsv = tsv.map(function (row) { return row.join('\t') });
	tsv = tsv.join('\n');
	
	fs.writeFileSync(filename, tsv, 'utf8');
};

exports.generateDocu = function (structure, filename, template) {
	function getHTML(structure, suffix) {
		var html = [];

		var desc = '<span class="desc">// ';
		if (structure.optional) desc += ' (optional) ';
		desc += structure.description + '</span>';

		switch (structure.type) {
			case 'object':
				html.push('<span class="highlight">{</span> '+desc);

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
				html.push('<span class="highlight">[</span> '+desc);
				html.push('<div class="indent">');

				html.push(getHTML(structure.substructure, ''));
				
				html.push(', &hellip;');
				html.push('</div>');
				html.push('<span class="highlight">]</span>'+suffix);
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

		return html.join('');
	}

	template = fs.readFileSync(template, 'utf8');
	var html = getHTML(structure.data, '');
	html = template.replace(/#content#/, html);
	fs.writeFileSync(filename, html, 'utf8')
}

function formatExcelDate(d) {
	function pad(n) { return n<10 ? '0'+n : n }

	var t =
		  pad(d.getUTCDate())+'.'
		+ pad(d.getUTCMonth()+1)+'.'
		+ d.getUTCFullYear()+' '
		+ pad(d.getUTCHours())+':'
		+ pad(d.getUTCMinutes())+':'
		+ pad(d.getUTCSeconds());

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