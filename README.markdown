# simple

Maximally Minimal Streams

A `strm` is a function.

## Minimal Valid STRM

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
this is what the code looks like:
``` js
var noop = exports = module.exports = function () {
  var dest
  return function (data, end) {
    if('function' == typeof data)
      return dest = data
    return dest(data, end)
  }
}
```

## Something A Little More Interesting (and useful)

map-strm

``` js
var map = require('strm').map

var ds = map(function (e) {return e*2})
ds(console.log)
ds(1); ds(2); ds(3)
//=> 2\n 4\n 6\n...
```
this is the code:

``` js
var id = function (e) { return e }
var map = exports.map = function (map) {
  var dest; map = map || id

  return function (data, end) {
    if('function' == typeof data)
      return dest = data

    //if `end` is truthy, the stream ends
    if(end) return dest(null, end)

    var m = data && map(data)
    return m ? dest(m) : true
  }
}
```

there are a lot of things Grown-Up streams need to do,
like back-pressure, and buffering, that this stream doesn't do.

Hovewer! it doesn't prevent other streams in the pipeline from
doing these things!

## Back Pressure

Sometimes a resource tells needs to tell you to slow down.
People do this by putting a confused look on their face,
but `strm` does this by returning an array.

callback when a `strm` ends, but only accept one element per tick.
``` js
var write = exports.write = function (done) {
  var waiting = [], paused = false, array = []
  return function (data, end) {
    if('function' === typeof data)
      throw new Error('write-only')
    if(paused)
      throw new Error('cannot write -- paused')

    next(function () {
      paused = false
      if(waiting.length) waiting.shift()()
    })

    paused = true
    if(data)
      return array.push(data), waiting
    if(end != null)
      return done(end === true ? null : end, array)
  }
}
```

>Notice that the map stream (and the noop stream) return the `dest(data)`
>this means the array will propagate back up the pipe line until someone
>can handle that.

here is an `strm` that can pause.

It reads array, and waits until the destination has drained.

``` js
var read = exports.read = function (array) {
  return function stream (dest, end) {
    if('function' != typeof dest)
      throw new Error('read-only')
    if(dest) {
      var i = 0

      next(function read () {
        while(i < array.length) {
          var r = dest(array[i++])
          if(r && 'function' === typeof r.push)
            return r.push(read)
          if(r === false)
            return dest = null
        }
        //the array has ended
        dest(null, true)
      })

      return dest
    }
  }
}
```

##NOTES

what do simple streams need to be able to do?

* pipe 
* end
* end as error
* nak upstream.
* destroy a stream (pass it an error)
* disconnect streams

* interface with pull streams?


``` js
stream(function (err, data) {
  //data is read.
  stream(function more data) {

    stream(null, 'data') //write to the push stream
    stream(null) //END the stream
  })
})

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
```

