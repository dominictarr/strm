
var next = process.nextTick

//a valid strm that does nothing.
var id = function (e) { return e }
var noop = exports = module.exports = function (op) {
  var dest
  return function (data, end) {
    if('function' == typeof data)
      return dest = data
    op && op(data)
    return dest(data, end)
  }
}

//a really dumb through stream.
//this still allows backpressuse, and buffering
//but depends on smarter endpoints.

var map = exports.map = function (map) {
  var dest
  map = map || id
  return function (data, end) {
    if('function' == typeof data)
      return dest = data

    if(end) return dest(null, end)

    var m = data && map(data)
    return m ? dest(m) : true
  }
}

//a read array method, that will pause when dest 
//returns an array.
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

//detach a stream after a test triggers
var detach = exports.detach = function (test) {
  var dest
  return function (data, end) {
    if('function' == typeof data)
      return dest = data

    if(end) return dest(null, end)

    if(!test(data)) return dest(data)
    dest(null, true)
    dest = null
    return false
  }
}

var reader = exports.reader = function (reader) {
  var input = [], next = [], dest, waiting = [], ended

  function drain () {
    if(next.length && (input.length || ended)) {
      next.shift()(ended, input.shift())
      if(!input.length && waiting.length)
        waiting.shift()()
    }
  }

  reader(function (cb) {
    next.push(cb); drain()
  }, function (data, end) {
    dest(data, end)
  })

  return function (data, end) {
    if('function' === typeof data)
      return dest = data

    ended = ended || end
    if(data) input.push(data)

    drain()

    return input.length ? waiting : true
  }
}

var async = exports.async = function (strm, data, end, cb) {
  var r = strm(data, end)
  if(r && 'function' === typeof r.push)
    return r.push(cb), null
  return cb(), r
}

var depthFirst = exports.depthFirst = function (start, createStrm) {
  //CHANGE NOOP FOR SOMETHING THAT WILL PROPAGATE BACK PRESSURE
  //SO CAN LAZILY TRAVERSE, AND STOP EARLY.
  //write(s, function (ended) {...})
  var s = noop()
  ;(function children (start, done) {

    createStrm(start)
      (reader(function (read) {
        ;(function next () {
          read(function (err, data) {
            if(data)
              async(s, data, null, function () {
                children(data, next)
              })
            else {
              done()
            }
          })
        })()
      }))

  })(start, function () {
    s(null, true)
  })
  return s
}

var widthFirst = exports.widthFirst = function (start, createStrm) {
  var s = noop(), l = []

  ;(function children (start, done) {

    createStrm(start)
      (reader(function (read) {
        ;(function next () {
          read(function (end, data) {
            if(data)
              l.push(data), async(s, data, null, next)
            else if(l.length)
              children(l.shift())
            else
              s(null, true)
          })
        })()
      }))

  })(start)

  return s
}

var leafFirst = exports.leafFirst = function (start, createStrm) {

  var s = noop()
  ;(function children (start, done) {

    createStrm(start)
      (reader(function (read) {
        ;(function next () {
          read(function (err, data) {
            if(data)
              children(data, next)
            else {
              async(s, start, null, done)
            }
          })
        })()
      }))

  })(start, function () {
    s(null, true)
  })
  return s
}

//this is a little bit large...
//maybe there is a simpler way to implement this idea?
//or a simpler idea that works better
var asyncMap = exports.asyncMap = function (map) {
  var waiting = [], paused = false, buffer = [], ended
  return function (data, end) {
    if(ended) return ended
    if('function' === typeof data)
      return dest = data
    ended = ended || end
    !ended && buffer.push(data)
    if(paused) return waiting
    ;(function read () {
      paused = true
      if(buffer.length) {
        map(buffer.shift(), function (err, data) {
          if(err)
            return dest(null, ended = err)
          var r = dest(data)
          if(r && 'function' === typeof r.push) {
            paused = true
            r.push(read)
          }
          else {
            paused = false
            read()
          }
        })
      }
      else if(ended) 
        return dest(null, ended)
      else if(waiting.length) {
        return paused = false, waiting.shift()()
      }
      return waiting
    })()
    return waiting
  }
}

function buffer (onWrite, onRead) {
  var buffer = []
  buffer.write = buffer.push = function (data) {
    console.log('write', data)
    ;[].push.call(buffer, data)
    if(onWrite) onWrite.call(buffer, data)
  }
  buffer.read = buffer.shift = function () {
    var data = [].shift.call(buffer)
    console.log('read', data)
    if(onRead) onRead.call(buffer, data)
    return data
  }
  return buffer
}

//read buffer. rather like a streams2

//what if the interface between streams is just arrays?
//there is a buffer between two streams,
//that once side pushes into and the other side pulls from
//what if the read function is just called whenever
//the other destination side is low, unless the input is also low
//[1, 2, 3] ... []        //read
//[]        ... [1, 2, 3] //don't read
//[1, 2, 3] ... [4, 5, 6] //don't read
//[]        ... []        //don't read

//and there is NO waiting array.

var readable = exports.readable = function (reader) {
  var input = [], output = [], waiting = [], paused = false, ended

  var output = buffer(function () {
    next(function () {
      dest(output, ended) 
    })
  }, function () {
    if(!output.length && input.length)
      reader.call(output, input, ended)
  })

  return function (data, end) {
    if('function' === typeof data) {
      dest = data
      return dest
    }
    if(data) input = data
    ended = ended || end

    if(!output.length)
      reader.call(output, input, ended)
  }
}
