

var strm = require('../')

var a = strm.readable(function (data, ended) {
    this.push(data.shift())
  })

a(function (input) {
  setTimeout(function () {
    console.log(input)
    while(input.length)
      console.log(input.shift())
  }, 100)
})

a([1, 2, 3])

