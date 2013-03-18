
var next = process.nextTick

//a valid strm that does nothing.
var noop = exports = module.exports = function () {
  var dest
  return function (data, end) {
    if('function' == typeof data)
      return dest = data
    return dest(data, end)
  }
}

//a really dumb through stream.
//this still allows backpressuse, and buffering
//but depends on smarter endpoints.

var id = function (e) { return e }
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

