var l = 10000000
var strm = require('../')
var waiting = []

;(function thousand (dest) {
  if('function' === typeof dest) {
    process.nextTick(function next() {
      while(l --) {
      var r = dest(l, l < 0)
        if(r && r.push)
          return r.push(next)
      }
    })
    return dest
  }
})
  (strm())
  (strm())
  (strm())
  (strm())
  (function (data, end) {
    if(!(data % 1000))
      console.log(data)
    if(!(data & 2)) {
      process.nextTick(function () {
        if(waiting.length)
          waiting.shift()()
      })
      return waiting
    }
  })
