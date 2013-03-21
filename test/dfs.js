
var strm = require('../')
var fs = require('fs')
var path = require('path')

strm.leafFirst(process.cwd(), function (dir) {
  var s = strm()
  fs.readdir(dir, function (err, ls) {
    ls = (ls || []).map(function (file) {
      return path.resolve(dir, file)
    })
    strm.read(ls)
    (s)
  })
  return s
})
(console.log)


