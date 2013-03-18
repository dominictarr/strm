var strm = require('../')

//pipe right to left with this terse syntax!
strm.read([1, 2, 3, 4, 5, 6, 7, 8])
  (strm.map(function (data) {
    return Math.pow(data, 2)
  }))
  (strm.detach(function (e) {
    return e > 50
  }))
  (strm.asyncMap(function (data, cb) {
    console.log('working...', data)
    setTimeout(function () {
      console.log('done...', data / 2)
      cb(null, data / 2)
    }, 100)
  }))
  (strm.write(console.log))


