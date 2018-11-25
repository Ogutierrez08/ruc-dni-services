const express = require('express')
const Ruc = require('./appRoutes/Ruc')

const app = module.exports = express.Router()

app.post('/public/getRucData', Ruc.getRucData)
