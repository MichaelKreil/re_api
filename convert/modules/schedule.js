var fs = require('fs');
var generator = require('./generator.js');

exports.createFromOld = function (path) {
	var items = [];

	var data = JSON.parse(fs.readFileSync(path+'/rp13-schedule.json', 'utf8'));
	data.schedule.day.forEach(function (day) {
		var dayNo = parseInt(day.index, 10);
		
		day.room.forEach(function (room) {
			
			room.event.forEach(function (event) {
				speakers = event.persons.person;
				if (!speakers.length) {
					if (speakers.id) {
						speakers = [speakers];
					} else {
						speakers = [];
					}
				}
				speakers = speakers.map(function (speaker) {
					return {
						id: parseInt(speaker.id, 10),
						name: speaker['#text']
					}
				});

				var item = {
					id: parseInt(event.id, 10),
					day: dayNo,
					date: new Date(day.date),
					title: cleanText(event.title),
					location: { name: room.name },
					abstract: cleanText(event.description),
					start: new Date(day.date + ' ' + event.start),
					duration: parseInt(event.duration.split(' ')[0], 10),
					type: event.type,
					language: event.language,
					experiencelevel: event.experience_level,
					track: event.track,
					speakers: speakers
				};

				item.end = new Date(item.start.getTime() + item.duration*60000);
				items.push(item);
			})
		})
	})

	return new Schedule(items);
}

exports.createFromJSON = function (filename) {
	var items = JSON.parse(fs.readFileSync(filename, 'utf8'));

	items.forEach(function (item) {
		item.lastmodified = new Date(item.lastmodified);
		item.date = new Date(item.date);
		item.start = new Date(item.start);
		item.end = new Date(item.end);

		item.location = {title:item.location};
		item.speakers = item.speakers.map(function (speaker) {
			return {
				name: speaker,
				id: speaker
			};
		});
	})

	return new Schedule(items);
}

exports.createEmpty = function (filename) {
	return new Schedule([]);
}

function Schedule(data) {
	var me = this;
	me.items = data;

	me.publish = function (filename, structure) {
		generator.generateTSV(filename+'.tsv', me.items, structure);
	}

	return me;
}

function cleanText(text) {
	text = text.replace(/&[a-z]*?;/gi, function (part) {
		switch (part) {
			case '&lt;': return '<';
			case '&gt;': return '>';
			case '&amp;': return '&';
			default:
				console.error('Unknown HTML-Char: '+part);
		}
	});
	return text;
}