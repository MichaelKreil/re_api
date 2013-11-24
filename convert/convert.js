var fs = require('fs');
var path = require('path');
var importer = require('./modules/importer.js');
var exporter = require('./modules/exporter.js');

var srcPath = path.resolve('../sources');
var dstPath = path.resolve('../publish');

var datastructure = require('./modules/datastructure.js').load(srcPath+'/datastructure.json');

var data = importer.create(srcPath+'/rp13');

datastructure.check(data);

exporter.generateTSV(dstPath+'/data/schedule.tsv', data, datastructure, ['schedule']);
exporter.generateTSV(dstPath+'/data/speakers.tsv', data, datastructure, ['speakers']);
exporter.generateTSV(dstPath+'/data/locations.tsv', data, datastructure, ['locations']);

//process.exit();

exporter.generateDocu(datastructure, dstPath+'/documentation/data.html', srcPath+'/templates/documentation.html');

