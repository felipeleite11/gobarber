const { Router } = require('express')

const routes = new Router()

const multerConfig = require('./config/multer')
const multer = require('multer')(multerConfig)

const authMiddleware = require('./app/middlewares/auth')

const UserController = require('./app/controllers/UserController')
const SessionController = require('./app/controllers/SessionController')
const FileController = require('./app/controllers/FileController')
const ProviderController = require('./app/controllers/ProviderController')
const AppointmentController = require('./app/controllers/AppointmentController')
const ScheduleController = require('./app/controllers/ScheduleController')
const NotificationController = require('./app/controllers/NotificationController')
const AvailableController = require('./app/controllers/AvailableController')

routes.post('/users', UserController.store)

routes.post('/sessions', SessionController.store)

routes.use(authMiddleware)

//Rotas fechadas
routes.put('/users', UserController.update)

routes.get('/providers', ProviderController.index)
routes.get('/providers/:providerId/available', AvailableController.index)

routes.post('/files', multer.single('file'), FileController.store)

routes.get('/appointments', AppointmentController.index)
routes.post('/appointments', AppointmentController.store)
routes.delete('/appointments/:id', AppointmentController.delete)

routes.get('/schedule', ScheduleController.index)

routes.get('/notifications', NotificationController.index)
routes.put('/notifications/:id', NotificationController.update)

module.exports = routes
