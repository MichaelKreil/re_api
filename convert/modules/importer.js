var fs = require('fs');

exports.create = function (path) {
	var result = {
		schedule:[],
		speakers:[]
	};

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
					lastmodified: new Date('2013-05-03'),
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
				result.schedule.push(item);
			})
		})
	})

	return result;
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