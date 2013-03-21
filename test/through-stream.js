var Stream = require('stream')
//var through = require('through')
var inherits = require('util').inherits
var l = 10000000

var s = new Stream()
s.readable = true

inherits(Through, Stream)

//Through.protoype = Stream.prototype

function Through () {
}

var T = Through.prototype

T.readable = T.writable = true
T.write = function (data) {
  this.emit('data', data)
}
T.end = function () {
  this.emit('end')
}


process.nextTick(function () {
  while(l--) s.emit('data', l)
  s.emit('end')
})

s
  .pipe(new Through())
  .pipe(new Through())
  .pipe(new Through())
  .pipe(new Through())
  .on('data', function (data) {
    if(!(data % 1000))
      console.log(data)

  })
