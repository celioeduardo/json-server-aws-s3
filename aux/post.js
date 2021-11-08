// Let's see the throughput

const http = require('http')

len = process.argv[2]

function post(n, len) {
  const data = JSON.stringify({
    "title": "New post",
    "body": `Post ${n+1} of ${len} at ${new Date().toLocaleTimeString()}`,
    "userId": 10
  })

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/posts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      process.stdout.write(d)
    })
  })
  
  req.on('error', error => {
    console.error(error)
  })
  
  req.write(data)
  req.end()
}

for (let i = 0; i < len; i++) {
  setTimeout(() => post(i, len), 500)
}
