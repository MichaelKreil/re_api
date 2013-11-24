var fs = require('fs');
var path = require('path');
var importer = require('./modules/importer_rp13.js');
var exporter = require('./modules/exporter.js');

var srcPath = path.resolve('../sources');
var dstPath = path.resolve('../publish');

var datastructure = require('./modules/datastructure.js').load(srcPath+'/datastructure.json');

var data = importer.create(srcPath+'/rp13');

datastructure.check(data);

exporter.generateTSV(dstPath+'/data/sessions.tsv', data, datastructure, ['sessions']);
exporter.generateTSV(dstPath+'/data/speakers.tsv', data, datastructure, ['speakers']);
exporter.generateTSV(dstPath+'/data/locations.tsv', data, datastructure, ['locations']);

exporter.generateJSON(dstPath+'/data/all.json', data, datastructure);
exporter.generateJSON(dstPath+'/data/sessions.json', data, datastructure, ['sessions']);
exporter.generateJSON(dstPath+'/data/speakers.json', data, datastructure, ['speakers']);
exporter.generateJSON(dstPath+'/data/locations.json', data, datastructure, ['locations']);

exporter.generateJSONPretty(dstPath+'/data/all.pretty.json', data, datastructure);
exporter.generateJSONPretty(dstPath+'/data/sessions.pretty.json', data, datastructure, ['sessions']);
exporter.generateJSONPretty(dstPath+'/data/speakers.pretty.json', data, datastructure, ['speakers']);
exporter.generateJSONPretty(dstPath+'/data/locations.pretty.json', data, datastructure, ['locations']);

//process.exit();

exporter.generateDocu(datastructure, dstPath+'/documentation/data.html', srcPath+'/templates/documentation.html');

