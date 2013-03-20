
var strm = require('../'), i = 1

strm.read([1, 2, 3, 4, 5, 6, 7, 8])
  (strm.reader(function (read, write) {
    read(function next (err, data) {
      console.log(i++, err, data)
      setTimeout(function () {
        if(!err) read(next)
      }, 100)
    })
  }))
