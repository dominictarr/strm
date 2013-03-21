
var fs = require('../fs')
var strm = require('../')
var v = 
fs.createReadStrm('README.markdown')
  (strm(console.log))
  (fs.createWriteStrm('/tmp/test-README.markdown'))

//console.log(v)
