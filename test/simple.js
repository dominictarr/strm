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
;(bs = 
   strm( console.log.bind(console, 1) ))
  (strm( console.log.bind(console, 2) ))
  (strm( console.log.bind(console, 3) ))
  (console.log)

bs('3 streams!')

