var fs = require('fs');

exports.generateJSON = function (filename, data, structure, filter) {
	data = filterData(data, structure.data, filter).data;

	fs.writeFileSync(filename, JSON.stringify(data), 'utf8');
}

exports.generateJSONPretty = function (filename, data, structure, filter) {
	data = filterData(data, structure.data, filter).data;

	fs.writeFileSync(filename, JSON.stringify(data, null, '\t'), 'utf8');
}

exports.generateTSV = function (filename, data, structure, filter) {
	var filter = filterData(data, structure.data, filter);
	var subdata = filter.data;
	var substructure = filter.structure;

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

		var comment = '<span class="comment">// ';
		if (structure.optional) comment += ' (optional) ';
		comment += structure.description + '</span>';

		suffix = '<span class="rest">'+suffix+'</span>';

		switch (structure.type) {
			case 'object':
				html.push('<span class="highlight">{</span>'+comment);

				html.push('<div class="indent hover">');

				structure.substructure.forEach(function (substructure, index) {
					var subHTML = getHTML(substructure, (index < structure.substructure.length - 1) ? ',' : '');
					var isLeaf = subHTML.indexOf('subelement') < 0;
					html.push('<div class="subelement hover'+(isLeaf ? ' leaf' : '')+'"><span class="highlight">'+substructure.key+':</span> ');
					html.push(subHTML);
					html.push('<div style="clear:both"></div>');
					html.push('</div>');
				})

				html.push('</div>');
				html.push('<span class="highlight">}'+suffix+'</span>');
			break;

			case 'array':
				html.push('<span class="highlight">[</span>'+comment);
				html.push('<div class="indent hover">');

				html.push(getHTML(structure.substructure, ''));
				
				html.push('<span class="rest">, &hellip;</span>');
				html.push('</div>');
				html.push('<span class="highlight">]</span>'+suffix);
			break;

			case 'string':
				html.push('"String"'+suffix+comment);
			break;

			case 'url':
				html.push('"URL"'+suffix+comment);
			break;

			case 'datetime':
				html.push('DateTime'+suffix+comment);
			break;

			case 'integer':
				html.push('Integer'+suffix+comment);
			break;

			case 'set':
				html.push('Wert einer Liste'+suffix+comment);

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

				var comment = [];
				var temp = '';
				values.forEach(function (chunk) {
					if (temp.length + chunk.length > 80) {
						comment.push(temp);
						temp = '';
					}
					temp += chunk;
				});
				comment.push(temp);
				comment = '// '+comment.join('<br>// ');

				html.push('<div class="comment">'+comment+'</div>');
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

function filterData(data, structure, filter) {
	if (!filter) {
		return {
			data: data,
			structure: structure
		}
	}

	var subdata = data;
	var substructure = structure;

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

	return {
		data: subdata,
		structure: substructure
	}
}