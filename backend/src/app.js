require('dotenv').config()
const express = require('express')
require('express-async-errors')
const routes = require('./routes')
const { resolve } = require('path')
const Youch = require('youch')
const Sentry = require('@sentry/node')
const sentryConfig = require('./config/sentry')
require('./database')

class App {
    constructor() {
        this.server = express()

        Sentry.init(sentryConfig)

        this.middlewares()
        this.routes()
        
        this.server.use(Sentry.Handlers.errorHandler())

        this.exceptionHandler()
    }

    middlewares() {
        this.server.use(Sentry.Handlers.requestHandler())
        this.server.use(express.json())
        this.server.use('/files', express.static(resolve(__dirname, '..', 'uploads')))
    }

    routes() {
        this.server.use(routes)
    }

    exceptionHandler() {
        this.server.use(async (err, req, res, next) => {
            if(process.env.NODE_ENV === 'development') {
                const errors = await new Youch(err, req).toJSON()
                return res.status(500).json(errors)
            }
            
            return res.status(500).json({ msg: 'Internal server error.' })
        })
    }
}

module.exports = new App().server