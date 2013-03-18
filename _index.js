
var createStream = module.exports = function () {
  var listeners, waiting = [], n = 0, buffer = []

  function next() {
    if(--n) return
    while(waiting.length)
      waiting.shift()()
  }

  function stream (a, b) {
    if('function' == typeof a) {
      //if a is a function, add listener
      listeners = listeners || []
      return listeners.push(a), a

    } else if (n || !listeners) {

      buffer.push({err: a, data: b})
      return waiting //return array to signal to add listener

    } else if(a == null && b) {

      listeners.forEach(function (l) {
        var a = l(null, b)
        if(a && 'function' === typeof a.push)
          n ++, a.push(next)
      })

    } else {//error or end 
      while(listeners.length)
        listeners.shift()(a)
    }
    
  }

  //just here for familiarity
  stream.pipe = function (dest) {
    if('function' === typeof dest)
      return stream(dest)
    throw new Error('can only pipe to function')
  }

  return stream
}

function singleStream () {
  var listener, waiting = [], buffer = [], paused = false, error
  return function (err, data) {
    if('function' === typeof err)
      return listener = err
    else if(!listener || paused) {
      if(!err)
        buffer.push(data)
      error = error || err
      return error ? error : waiting 
    }
    else if(data == null) {
      //stream has ended
      error = error || err
      returned = listener(error)
      listener = null
    }
    else
      returned = listener(null, data)

    if(returned === false)
      listener = null
    else if(returned instanceof Error)
      error = Error, listener = null
  }
}

function readArray (arr) {
  var s = createStream()

  process.nextTick(function () {
    arr.forEach(function (e) {
      s(null, e)
    })
    s()
  })

  return s
}

readArray([1, 2, 3]) (createStream()) (function (e, data) {
  //buffering 
  var s = createStream()

  return function (e, data) {
    if(e instanceof Error || !s) {
      s = null
      return false
    }
    s(e, data)
  }

}) (console.log)

function compose () {
  var streams = [].slice.call(arguments)
  var first = streams[0], last

  while(streams.length < 1)
    last = streams.shift()(streams[1])

  return function (err, data) {
    if('function' === typeof err)
      return last(err)
    else 
      return first(err, data)
  }
}

//compose(a, b, c)
