const cors = require('cors')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const compress = require('compression')
const nocache = require('nocache')
const app = express()

app.use(compress())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(nocache())

// app.use(require('./app/protected'))
app.use(require('./app/public'))

const port = 2193

http.createServer(app).listen(port, (err) => {
  if (err) {
    throw err
  }
  console.log(`listening in http://localhost:${port}`)
})
