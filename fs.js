
var strm = require('./')
var fs   = require('fs')
var createReadStrm = exports.createReadStrm = function (file, opts) {
  opts = opts || {}
  return function (dest) {
    if('function' !== typeof dest)
      throw new Error('read-only')

    fs.open(file, opts.flags || 'r+', function (err, fd) {
      var size = 8192, buffer = new Buffer(size), i = 0
      ;(function next (err) {
        if(err) throw err
        fs.read(fd, buffer, 0, size, i, function (err, bytes) {
          i += bytes            
          strm.async(dest
          , bytes != size ? buffer.slice(0, bytes) : buffer
          , err || bytes == 0 || null, next)
        })
      })(err)
    })

    return dest
  }
}

var createWriteStrm = exports.createWriteStrm = function (file, opts) {
  opts = opts || {}
  var fd, i = 0
  return strm.reader(function (data, end, cb) {
    if(end && !data) return false
    if(fd) write()
    else fs.open(file, opts.flags || 'w', function (err, _fd) {
        if(err) return cb(err)
        fd = _fd
        write()
      })

    function write() {
      console.log('>>>', data.toString(), '<<<')
      fs.write(fd, data, 0, data.length, i, function (err, bytes) {
        if(err) return cb(err)
        i += bytes
        cb()
      })
    }
  })
}

var _waiting = [], _ended
function write (data, end) {
  if(end) return _ended = end
    var r = process.stdout.write(data)
    if(r === false)
      process.stdout.once('drain', function () {
        _waiting.length && _waiting.shift()(_ended)
      })
      return _waiting
}

if(!module.parent) {
  createReadStrm(process.argv[2])
    (write)
}
