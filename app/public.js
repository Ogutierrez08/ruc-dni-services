const express = require('express')
const Test = require('./appRoutes/Test')

const app = module.exports = express.Router()

app.get('/public/getTestFile', Test.getTestFile)
