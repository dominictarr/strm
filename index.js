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
  var dest; map = map || id
  return function (data, end) {
    if('function' == typeof data)
      return dest = data

    if(end) return dest(null, end)

    var m = data ? map(data) : null
    return m == null ? dest(m) : true
  }
}

var filter = exports.filter = function (test) {
  return map(function (data) {
    return test(data) ? data : null
  })
}

var async = exports.async = function (strm, data, end, cb) {
  var r = strm(data, end)
  if(r && 'function' === typeof r.push)
    return r.push(cb), null
  return cb(r === false ? true : end), r
}

//a read array method, that will pause when dest 
//returns an array.
var read = exports.read = function (array) {
  return function stream (dest, end) {
    if('function' != typeof dest)
      throw new Error('read-only')
    if(dest) {
      var i = 0

      next(function _next (end) {
        if(end) return
        while(i < array.length) {
          var r = dest(array[i++])
          if(r && r.push) return r.push(_next)
          if(r === false) return
        }
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
    if(end && !data)
      return done(end === true ? null : end, array)
  }
}

//detach a stream after a test triggers
var detach = exports.detach = function (test) {
  var dest
  return function (data, end) {
    if('function' == typeof data)
      return dest = data

    if(!dest) return false

    if(end) return dest(null, end)
    if(!test(data)) return dest(data)

    dest(null, true)
    dest = null
    return false
  }
}

var take = exports.take = function (test) {
  if('function' === typeof test)
    return detach(function (data) {
      return !test(data)
    })
  if('number' === typeof test)
    return detach(function () {
      return !test--
    })
}

var reader = exports.reader = function (reader) {
  var input = [], next = 1, dest, waiting = [], ended, ready = true

  function drain (end) {
    ended = ended || end
    if(ready) {
      if(input.length || ended) {
        ready = false
        reader(input.shift(), ended, function (end) {
          ready = true
          drain(end)
        })
      }
      else if(waiting.length)
        waiting.shift()()
    }
  }

  return function (data, end) {
    if('function' === typeof data)
      throw new Error('write-only')

    ended = ended || end
    if(data) input.push(data)

    drain()

    return input.length ? waiting : true
  }
}

var reader2 = exports.reader2 = function(s) {
  var input = [], waiting = [], reading = [], ended
  s(function (data, end) {
    if(data == null && end == null)
      throw new Error('data == end == null')
    ended = ended || end
    if(data) input.push(data)
    while(input.length && reading.length)
      reading.shift()(ended, input.shift())

//    console.log('writing', input.length, reading.length, waiting.length, input[0], end)
    return input.length ? waiting : true
  })

  return function (cb) {
    reading.push(cb)
    while(input.length && reading.length)
      reading.shift()(ended, input.shift())
    if(waiting.length)
      waiting.shift()(ended)
  }
}

var depthFirst = exports.depthFirst = function (start, createStrm) {
  var s = noop()
  ;(function children (start, done) {
    createStrm(start)
      (reader(function (data, err, next) {
        if(data)
          async(s, data, null, function () {
            children(data, next)
          })
        else {
          done()
        }
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
      (reader(function (data, end, next) {
        if(data)
          l.push(data), async(s, data, null, next)
        else if(l.length)
          children(l.shift())
        else
          s(null, true)
      }))

  })(start)

  return s
}

var leafFirst = exports.leafFirst = function (start, createStrm) {

  var s = noop()
  ;(function children (start, done) {

    createStrm(start)
      (reader(function (data, end, next) {
        if(data)
          children(data, next)
        else {
          async(s, start, null, done)
        }
      }))

  })(start, function () {
    s(null, true)
  })
  return s
}

var duplex = exports.duple = function (writable, readable) {
  return function (data, end) {
    if('function' === typeof data)
      return readable(data)
    return writable(data, end)
  }
}

var asyncMap = exports.asyncMap = function (map) {
  var readable = noop()
  var writable = reader(function (data, end, cb) {
    if(!end || data)
      map(data, function (err, data) {
        async(readable, data, err, cb)
      })
  })
  return duplex (writable, readable)
}


