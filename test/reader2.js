
var strm = require('../')

var read = strm.reader2(strm.read('abcdefghijklmnopqrstuvwxyz'.split('')))

;(function next () {
  read(function (error, data) {
    console.log(data)
    setTimeout(next, 1000)
  })
})()

