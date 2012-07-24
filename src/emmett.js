#!/usr/bin/env node

var Parser = require('./lib/parser.js');
var Formatter = require('./lib/arrayformatter.js');

var data = '';

// read from stdin
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk) {
  data += chunk;
});

process.stdin.on('end', function () {
  var p = new Parser();
  var f = new Formatter(p);

  var comments = f.format( data );

  console.log( JSON.stringify(comments) );
});
