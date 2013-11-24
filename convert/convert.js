var fs = require('fs');
var path = require('path');
var importer = require('./modules/importer_rp13.js');
var exporter = require('./modules/exporter.js');

var srcPath = path.resolve('../sources');
var dstPath = path.resolve('../publish');

var datastructure = require('./modules/datastructure.js').load(srcPath+'/datastructure.json');

var data = importer.create(srcPath+'/rp13');

datastructure.check(data);

exporter.generateTSV(dstPath+'/data/rp13/sessions.tsv', data, datastructure, ['sessions']);
exporter.generateTSV(dstPath+'/data/rp13/speakers.tsv', data, datastructure, ['speakers']);
exporter.generateTSV(dstPath+'/data/rp13/locations.tsv', data, datastructure, ['locations']);

exporter.generateJSON(dstPath+'/data/rp13/all.json', data, datastructure);
exporter.generateJSON(dstPath+'/data/rp13/sessions.json', data, datastructure, ['sessions']);
exporter.generateJSON(dstPath+'/data/rp13/speakers.json', data, datastructure, ['speakers']);
exporter.generateJSON(dstPath+'/data/rp13/locations.json', data, datastructure, ['locations']);

exporter.generateJSONPretty(dstPath+'/data/rp13/all.pretty.json', data, datastructure);
exporter.generateJSONPretty(dstPath+'/data/rp13/sessions.pretty.json', data, datastructure, ['sessions']);
exporter.generateJSONPretty(dstPath+'/data/rp13/speakers.pretty.json', data, datastructure, ['speakers']);
exporter.generateJSONPretty(dstPath+'/data/rp13/locations.pretty.json', data, datastructure, ['locations']);

//process.exit();

exporter.generateDocu(datastructure, dstPath+'/documentation/data.html', srcPath+'/templates/documentation.html');

