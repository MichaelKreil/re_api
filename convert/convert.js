var fs = require('fs');
var path = require('path');
var schedule = require('./modules/schedule.js');
var speakers = require('./modules/speakers.js');
var datastructure = require('./modules/datastructure.js');

var srcPath = path.resolve('../sources');
var dstPath = path.resolve('../publish');

var scheduleDS = datastructure.load(srcPath+'/datastructures/schedule.json');
var speakersDS = datastructure.load(srcPath+'/datastructures/speakers.json');

schedule = schedule.createFromOld(srcPath+'/rp13');
speakers = speakers.createEmpty();

scheduleDS.check(schedule.items);
speakersDS.check(speakers.items);

schedule.publish(dstPath+'/data/schedule', scheduleDS);
speakers.publish(dstPath+'/data/speakers');

scheduleDS.generateDocu(dstPath+'/documentation/schedule.html', srcPath+'/templates/documentation.html');
speakersDS.generateDocu(dstPath+'/documentation/speakers.html', srcPath+'/templates/documentation.html');
