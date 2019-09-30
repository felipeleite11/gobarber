const Sequelize = require('sequelize')
const mongoose = require('mongoose')

const databaseConfig = require('../config/database')
const mongoConfig = require('../config/mongo')

//Todos os models da aplicação
const User = require('../app/models/User')
const File = require('../app/models/File')
const Appointment = require('../app/models/Appointment')

const models = [User, File, Appointment]

class Database {
    constructor() {
        this.init()
        this.mongo()
    }

    init() {
        this.connection = new Sequelize(databaseConfig)

        models
            .map(model => model.init(this.connection))
            .map(model => model.associate && model.associate(this.connection.models))
    }

    mongo() {
        this.mongoConnection = mongoose.connect(
            mongoConfig.url,
            mongoConfig.flags
        )
    }
}

module.exports = new Database()
