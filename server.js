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
var pty = require('node-pty'); // Changed from pty.js to node-pty
var MuxDemux = require('mux-demux');

function connect(command, args, remote) {
    var muxDemux = new MuxDemux();
    var clientEventsStream = muxDemux.createStream('clientEvents');
    var terminalStream = muxDemux.createStream('terminal');

    // Updated to use node-pty.spawn
    var terminal = pty.spawn(command, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: serviceSrcDir,
      env: process.env
    });

    // Handle data from PTY to WebSocket
    terminal.onData(function(data) {
      terminalStream.write(data);
    });

    // Handle data from WebSocket to PTY
    terminalStream.on('data', function(data) {
      terminal.write(data);
    });

    // Handle PTY exit
    terminal.onExit(function(ev) {
      // Optionally, notify the client that the terminal has exited
      console.log('PTY exited with code ' + ev.exitCode + ', signal ' + ev.signal);
      terminalStream.end(); // Close the stream
      // You might want to close the muxDemux or remote connection as well
    });

    var clientEvents = emitStream
      .fromStream(clientEventsStream
        .pipe(JSONStream.parse([true])));

    clientEvents.on('resize', function (size) { // node-pty typically expects an object {cols, rows}
                                                // but the original client sends [cols, rows].
                                                // The existing code `function(x,y)` from pty.js might actually work if emitStream spreads array arguments.
                                                // Let's assume for now the client might send {cols: x, rows: y} or the server adapts.
                                                // The original pty.js resize was terminal.resize(cols, rows).
                                                // node-pty is terminal.resize(cols, rows).
                                                // If clientEvents sends [x,y] as separate args, it's fine.
                                                // If it sends an array [x,y] as one arg `size`, then it should be:
                                                // terminal.resize(size[0], size[1]);
                                                // If it sends an object {cols: c, rows: r}, then it should be:
                                                // terminal.resize(size.cols, size.rows);
                                                // The current code in server.js for pty.js is `function(x,y){ terminal.resize(x,y); }`
                                                // This should be compatible if emitStream correctly maps array elements to arguments.
      if (Array.isArray(size) && size.length === 2) {
        terminal.resize(size[0], size[1]);
      } else if (size && typeof size.cols === 'number' && typeof size.rows === 'number') {
        terminal.resize(size.cols, size.rows);
      } else if (arguments.length === 2 && typeof arguments[0] === 'number' && typeof arguments[1] === 'number') {
        // This handles the case where emitStream might spread an array into arguments for pty.js style
        terminal.resize(arguments[0], arguments[1]);
      }
    });
    remote.pipe(muxDemux).pipe(remote);
}

server.listen(3000); // Changed port from 80 to 3000
console.log("Server listening on port 3000"); // Added a log message
