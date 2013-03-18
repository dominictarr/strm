//import it
var strm = require('../')

//create a noop strm.

var as = strm(), bs
//pass it another function to pipe it
as(console.log)

//call it to write data
as('hello')

//piping returns the destination,
//os, can connect many streams left to right.

;(bs = strm()) (strm()) (strm()) (strm()) (console.log)

bs('5 streams!')

