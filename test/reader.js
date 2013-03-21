
var strm = require('../'), i = 1

strm.read([1, 2, 3, 4, 5, 6, 7, 8])
  (strm.reader(function (data, end, next) {
    console.log(i++, data, end)
    setTimeout(function () {
      if(!end) next()
    }, 1000)
  }))
