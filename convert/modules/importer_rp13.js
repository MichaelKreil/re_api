var fs = require('fs');

exports.create = function (path) {
	var result = {
		sessions:[],
		speakers:[],
		locations:[]
	};

	var locations = {};

	var data = JSON.parse(fs.readFileSync(path+'/rp13-schedule.json', 'utf8'));
	data.schedule.day.forEach(function (day) {
		var dayNo = parseInt(day.index, 10);
		
		day.room.forEach(function (room) {
			var location;
			if (locations[room.name] === undefined) {
				location = {
					name: room.name,
					id: room.name,
					sessions:[]
				}
				locations[room.name] = location;
				result.locations.push(location);
			} else {
				location = locations[room.name];
			}
			
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
						id: ''+parseInt(speaker.id, 10)
					}
				});

				var session = {
					id: ''+parseInt(event.id, 10),
					lastmodified: new Date('2013-05-03'),
					day: dayNo,
					date: new Date(day.date),
					title: cleanText(event.title),
					location: { name:room.name, id:room.name },
					abstract: cleanText(event.description),
					start: new Date(day.date + ' ' + event.start),
					duration: parseInt(event.duration.split(' ')[0], 10),
					type: event.type,
					language: event.language,
					experiencelevel: event.experience_level,
					track: event.track,
					speakers: speakers
				};

				session.end = new Date(session.start.getTime() + session.duration*60000);
				result.sessions.push(session);

				location.sessions.push({
					title:session.title,
					id:session.id,
					start:session.start,
					end:session.end
				});
			});
		});
	});

	var speakers = {};

	result.speakers = data.schedule.speakers.speaker.map(function (speaker) {
		var obj = {
			name:speaker.fullname,
			id:speaker.persons
		}
		if (speaker.picture) {
			obj.picture = 'http://13.re-publica.de/files/pictures/picture-'+obj.id+'.jpg';
		}
		if (speaker.biography) obj.biography = speaker.biography;
		if (speaker.organization) obj.organization = speaker.organization;
		if (speaker.position) obj.position = speaker.position;
		speakers[obj.id] = obj;
		return obj;
	});

	result.sessions.forEach(function (session) {
		session.speakers.forEach(function (speaker) {
			speaker.name = speakers[speaker.id].name;
		})
	});

	result.locations.forEach(function (location) {
		location.sessions.sort(function (a, b) {
			return a.start - b.start;
		});
	});

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