# simple

Maximally Minimal Streams

A `strm` is a function.

``` js
//import it
var strm = require('strm')

//create a noop strm.

var as = strm()
//pass it another function to pipe it
as(console.log)

//call it to write data
strm('hello')

//piping returns the destination,
//os, can connect many streams left to right.
;(bs = strm()) (strm()) (strm()) (strm()) (console.log)

bs('5 streams!')
```

based on functions,

``` js

var create = require('simple')

//simple streams are just functions. 
//to PIPE pass the stream a function

var s = create()

s(console.log)

//TO WRITE, call the stream with an arg.

s(null, 'DATA')

//to end the stream, call the streams with null args

s(null, null)

//writing will now throw.
try {
  s(null, 'DATA2')
} catch (err) {
  err
}
```

what do simple streams need to be able to do?

* pipe 
* end
* end as error
* nak upstream.
* destroy a stream (pass it an error)
* disconnect streams

* interface with pull streams.

stream(function (err, data) {
  //data is read.
  stream(function more data) {

    stream(null, 'data') //write to the push stream
    stream(null) //END the stream
  })
})
```

var stream = {
  write: function (data) { this.readers.forEach(data) {
    var r
    stream.readers.forEach(function (e, i) {
      r = (e.write || e)(null, data)        
      if(r === false) //this stream is ended, disconnect it.
      detele stream.readers[i]
    })
    if(r && r.push)
      return r
  }),
  readers: []
}
