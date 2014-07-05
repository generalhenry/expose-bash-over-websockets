#!/usr/bin/env node
var express = require('express');
var app = express();
var server = require('http').createServer(app);

app.use(express.static(__dirname + '/public'));

var shoe = require('shoe');
function termHandler(remote) {
  connect('bash', ['--init-file', '.initfile'], remote);
}

shoe(termHandler).install(server, '/stream');

var emitStream = require('emit-stream');
var JSONStream = require('JSONStream');
var serviceSrcDir = '/root';
var pty = require('pty.js');
var MuxDemux = require('mux-demux');

function connect(command, args, remote) {
    var muxDemux = new MuxDemux();
    var clientEventsStream = muxDemux.createStream('clientEvents');
    var terminalStream = muxDemux.createStream('terminal');
    var terminal = pty.spawn(command, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: serviceSrcDir,
      env: process.env
    });

    terminal.pipe(terminalStream).pipe(terminal);
    var clientEvents = emitStream
      .fromStream(clientEventsStream
        .pipe(JSONStream.parse([true])));
    clientEvents.on('resize', function (x, y) {
      terminal.resize(x, y);
    });
    remote.pipe(muxDemux).pipe(remote);
}

server.listen(80);
