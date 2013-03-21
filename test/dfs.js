
var strm = require('../')
var fs = require('fs')
var path = require('path')



strm.depthFirst(process.cwd(), function (dir) {
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
 (strm.asyncMap(function (data, cb) {
    setTimeout(function () {
      cb(null, data.toUpperCase())
    })
  }))
  (console.log)


