var Terminal = require('term.js');
var shoe = require('shoe');
var MuxDemux = require('mux-demux');
var emitStream = require('emit-stream');
var JSONStream = require('JSONStream');
var EventEmitter = require('events').EventEmitter;
var clientEvents = new EventEmitter();
var remoteResize;

connect();

function connect() {
  var stream = shoe('/stream');
  var muxDemux = new MuxDemux(onStream);
  stream.pipe(muxDemux).pipe(stream);
  stream.on('end', reconnect);
}
function reconnect() {
  if (window.term) {
    try {
      document.body.removeChild(window.term.element);
    }
    catch (err) {}
  }
  setTimeout(connect, 5000);
}
function onStream(stream) {
  if (stream.meta === 'terminal') {
    onTerminal(stream);
  }
  if (stream.meta === 'clientEvents') {
    onClientEventsStream(stream);
  }
}
function onTerminal(stream) {
  var term = window.term = new Terminal({
    cols: 80,
    rows: 24,
    useStyle: true,
    screenKeys: true
  });
  term.on('data', stream.write.bind(stream));
  term.open();
  stream.pipe(term);
  term.end = term.destroy;
  var resizeTerm = resize.bind(null, term);
  resizeTerm();
  setTimeout(resizeTerm, 1000);
  window.onresize = resizeTerm;
}
function resize(term) {
  var x = document.body.clientWidth / term.element.offsetWidth;
  var y = document.body.clientHeight / term.element.offsetHeight;
  x = x * term.cols | 0;
  y = y * term.rows | 0;
  term.resize(x, y);
  if (typeof remoteResize === 'function') {
    remoteResize(x, y);
  }
}
function onClientEventsStream(stream) {
      emitStream.toStream(clientEvents).pipe(JSONStream.stringify()).pipe(stream);
  remoteResize = function (x, y) {
    clientEvents.emit('resize', x, y);
  };
}
