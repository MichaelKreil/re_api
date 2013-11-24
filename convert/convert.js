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

exporter.generateJSON(dstPath+'/data/all.json', data, datastructure);
exporter.generateJSON(dstPath+'/data/schedule.json', data, datastructure, ['schedule']);
exporter.generateJSON(dstPath+'/data/speakers.json', data, datastructure, ['speakers']);
exporter.generateJSON(dstPath+'/data/locations.json', data, datastructure, ['locations']);

exporter.generateJSONPretty(dstPath+'/data/all.pretty.json', data, datastructure);
exporter.generateJSONPretty(dstPath+'/data/schedule.pretty.json', data, datastructure, ['schedule']);
exporter.generateJSONPretty(dstPath+'/data/speakers.pretty.json', data, datastructure, ['speakers']);
exporter.generateJSONPretty(dstPath+'/data/locations.pretty.json', data, datastructure, ['locations']);

//process.exit();

exporter.generateDocu(datastructure, dstPath+'/documentation/data.html', srcPath+'/templates/documentation.html');

