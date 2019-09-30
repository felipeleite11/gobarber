const { startOfDay, endOfDay, setHours, setMinutes, setSeconds, format, isAfter } = require('date-fns')
const { Op } = require('sequelize')

const schedules = require('../data/schedules')

const Appointment = require('../models/Appointment')

class AvailableController {
    async index(req, res) {

        throw new Error('Meu erro personalizado.')

        const { date } = req.query

        if(!date) {
            return res.status(400).json({ msg: 'Invalid date.' })
        }

        const searchDate = Number(date)

        const appointments = await Appointment.findAll({
            where: {
                provider_id: req.params.providerId,
                canceled_at: null,
                date: {
                    [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)]
                }
            }
        })

        const available = schedules.map(time => {
            const [hour, minute] = time.split(':')
            const value = setSeconds(setMinutes(setHours(searchDate, hour), minute), 0)

            return {
                time,
                value: format(value, `yyyy-MM-dd'T'HH:mm:ssxxx`),
                available: 
                    isAfter(value, new Date()) &&
                    !appointments.find(a => format(a.date, 'HH:mm') === time)
            }
        })

        return res.json(available)
    }
}

module.exports = new AvailableController()