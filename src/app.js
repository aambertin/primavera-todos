const debug = require('debug')('api:init')
const loadtime = { start: Date.now() }
import process from 'process'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import bodyParser from 'body-parser'
import primavera from 'primavera'
import mongoose from 'mongoose'
import express from 'express'
import logger from 'morgan'
import path from 'path'

mongoose.connect('localhost')

if (!process.env.NODE_ENV) //:
  process.env.NODE_ENV = 'development'


const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dirtydirtycookiesecret'

// express initialization
const app = express()
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser(COOKIE_SECRET, {signed:true}))
app.use(session())


const router = express.Router()
// place actual initialization code here
primavera.loader.load(/services\.js$/, __dirname)
primavera.loader.load(/middleware\.js$/, __dirname)
primavera.loader.load(/endpoints\.js$/, __dirname)
primavera.web.start(router)

app.use(router)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.send(err)
})

loadtime.end = Date.now()
debug(`Application loaded in ${loadtime.end - loadtime.start}ms`)

module.exports = app