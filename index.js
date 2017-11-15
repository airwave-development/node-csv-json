/* jshint -W106 */
/* jshint -W083 */

var meow = require('meow');
var path = require('path');
var fs = require('fs');

var ProcessCSV = require('./lib/ProcessCSV');

var fileObject = {};

var cli = meow({
	help: ['Usage', '   <input>']
});

function getOptions() {
	var defaultOptions = {
		parserOptions: {
			auto_parse: true
		},
		processValue: function(key, value) {
			if (key !== '') {
				return value;
			}
		}
	};

	if (typeof optionsObject !== 'object') {
		return defaultOptions;
	}

	return defaultOptions;
}

function processDir() {
	var file;
	var filePath;
	var extension;

	var files = cli.input;

	fileObject = {};

	if (files.length === 0) {
		console.error('Error: no input given');
		process.exit(1);
		return;
	}

	for (var i = 0; i < files.length; i++) {
		filePath = files[i];
		extension = path.extname(filePath);
		if (extension === '.csv') {
			fileObject[path.basename(filePath, path.extname(filePath))] = {
				processed: false,
				filePath: filePath
			};
		}
	}

	if (Object.keys(fileObject).length === 0) {
		process.exit(0);
		return console.warn('Waring: no files processed');
	}

	for (var fileID in fileObject) {
		processFile(fileObject[fileID].filePath);
	}
}

function processFile(filePath) {
	fs.readFile(filePath, 'utf8', function(readError, readFileData) {
		var options = getOptions();

		if (readError) {
			process.exit(1);
			return console.error(readError);
		}

		ProcessCSV.process(readFileData, options, function(err, sets) {
			sets.forEach(function(set) {
				var contents = new Buffer(JSON.stringify(set.data), 'utf8');

				var fileDirectory = path.dirname(filePath);
				var fileNameWithoutExtension = path.basename(filePath, path.extname(filePath));

				fs.writeFile(fileDirectory + '/' + fileNameWithoutExtension + '.json', contents, 'w+', function(writeError) {
					if (writeError) {
						process.exit(1);
						return console.error(writeError);
					}

					var processOperationFinished = true;
					fileObject[fileNameWithoutExtension].processed = true;

					for (var processedfileID in fileObject) {
						if (fileObject[processedfileID] === false) {
							processOperationFinished = false;
						}
					}

					if (processOperationFinished) {
						process.exit(0);
						return console.log('File conversion finished');
					}
				});
			});
		});
	});
}

module.exports = processDir;
