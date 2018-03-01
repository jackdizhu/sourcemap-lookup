#!/usr/bin/env node

require('colors');

var err_msg = [{
	"msg": "ReferenceError: d is not defined @ Object.3../alloy-lever.js (http://127.0.0.1/AlloyLever/public/dist/js/build.js:321:9) @ s (http://127.0.0.1/AlloyLever/public/dist/js/build.js:1:265) @ e (http://127.0.0.1/AlloyLever/public/dist/js/build.js:1:436) @ http://127.0.0.1/AlloyLever/public/dist/js/build.js:1:465",
	"filename": "http://127.0.0.1/AlloyLever/public/dist/js/build.js",
	"line": 321,
	"column": 9
}];
err_msg = err_msg[0];

// var map = JSON.parse(fs.readFileSync('./public/dist/js/build.js.map', 'utf8'));

var file = err_msg.filename.replace('http://127.0.0.1/AlloyLever', '.');
var line = parseInt(err_msg.line);
var column = parseInt(err_msg.column);
var sourceDirectory = './';
var linesBefore = 5;
var linesAfter = 5;


// make sure a string is always the same length
function pad(str, len) {
	str = str + "";
	while(str.length < len) {
		str = str + " ";
	}
	return str;
}

var fs = require("fs");
var sourceMap = require('source-map');
var obj = JSON.parse(fs.readFileSync(file + '.map', 'utf8'));
var smc = new sourceMap.SourceMapConsumer(obj);
var originalPosition = smc.originalPositionFor({
	line: line,
	column: column
});


var text = "\n###" + originalPosition.source + ", Line " + originalPosition.line + ":" + originalPosition.column + "\n";

// remove the webpack stuff and try to find the real file
var originalFileName = (sourceDirectory +  originalPosition.source).replace("webpack:///", "").replace("/~/", "/node_modules/").replace(/\?[0-9a-zA-Z\*]+$/, "");
fs.access(originalFileName, fs.R_OK, function(err){
	if(err) {
		text += "Unable to access source file, " + originalFileName + "\n";
	} else {
		fs.readFile(originalFileName, function (err, data) {
			if (err) throw err;

			// Data is a buffer that we need to convert to a string
			// Improvement: loop over the buffer and stop when the line is reached
			var lines = data.toString('utf-8').split("\n");
			var line = originalPosition.line;
			if(line > lines.length){
				text += "Line " + line + " outside of file bounds (" + lines.length + " lines total)." + "\n";
			} else {
				var minLine = Math.max(0, line-(linesBefore + 1));
				var maxLine = Math.min(lines.length, line+linesAfter);
				var code = lines.slice(minLine, maxLine);
				text += "```" + "\n";
				var padLength = Math.max(("" + minLine).length, ("" + maxLine).length) + 1;

				function formatLineNumber(currentLine) {
					if (currentLine == line) {
						return pad(currentLine, padLength - 1) + ">| "; // 当前报错行数
					} else {
						return pad(currentLine, padLength) + "| ";
					}
				}

				var currentLine = minLine;
				for(var i = 0 ; i < code.length ; i++) {
					text += formatLineNumber(++currentLine) + code[i] + "\n";
					if (currentLine == line && originalPosition.column) {
						// text += "\n";
						// text += pad('', padLength + 2 + originalPosition.column) + '^'.bold.red + "\n";
					}
				}
				text += "```\n";
			}

			// 写文件
			fs.writeFileSync('./msg/msg.js', text);
		});
	}
});
