const yup = require('yup')
const { startOfHour, parseISO, isBefore, format, subHours } = require('date-fns')
const pt = require('date-fns/locale/pt-BR')

const Notification = require('../schemas/Notification')

const Queue = require('../../lib/Queue')
const CancellationMail = require('../../app/jobs/CancellationMail')

const Appointment = require('../models/Appointment')
const User = require('../models/User')
const File = require('../models/File')

class AppointmentController {
    async index(req, res) {
        const { page = 1 }= req.query

        const appointments = await Appointment.findAll({
            where: {
                user_id: req.userId,
                canceled_at: null
            },
            limit: 10,
            offset: (page - 1) * 10,
            order: ['date'],
            attributes: ['id', 'date', 'user_id', 'past', 'cancelable'],
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id', 'path', 'url']
                        }
                    ]
                }
            ]
        })

        return res.json(appointments)
    }

    async store(req, res) {
        const schema = yup.object().shape({
            date: yup.date().required(),
            provider_id: yup.number().required()
        })

        if(!(schema.isValid(req.body))) {
            return res.status(400).json({ msg: 'Validation fails.' })
        }

        const { provider_id, date } = req.body

        const checkIsProvider = await User.findOne({
            where: {
                id: provider_id,
                provider: true
            }
        })

        if(provider_id === req.userId) {
            return res.status(400).json({ msg: "Provider can't create appointment with yourself." })
        }

        if(!checkIsProvider) {
            return res.status(401).json({ msg: 'You can only create appointments with providers.' })
        }

        const hourStart = startOfHour(parseISO(date))

        if(isBefore(hourStart, new Date())) {
            return res.status(400).json({ msg: 'Past date are not allowed.' })
        }

        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        })

        if(checkAvailability) {
            return res.status(400).json({ msg: 'Appointment date is not available.' })
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        })

        //Notify the provider
        const user = await User.findByPk(req.userId)
        const formatedDate = format(
            hourStart, 
            `dd 'de' MMMM', às' H:mm'h'`,
            { locale: pt }
        )

        await Notification.create({
            content: `Novo agendamento de ${user.name} para o dia ${formatedDate}.`,
            user: provider_id
        })

        return res.json(appointment)
    }

    async delete(req, res) {
        const appointment = await Appointment.findByPk(
            req.params.id, 
            {
                include: [
                    {
                        model: User,
                        as: 'provider',
                        attributes: ['name', 'email']
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['name', 'email']
                    }
                ]
            }
        )

        if(appointment.user_id !== req.userId) {
            return res.status(401).json({ msg: "You don't have permission to cancel this appointment." })
        }

        const dateWithSub = subHours(appointment.date, 2)

        if(isBefore(dateWithSub, new Date())) {
            return res.status(401).json({ msg: 'You can only cancel appointments 2 hours in advance.' })
        }

        appointment.canceled_at = new Date()

        await appointment.save()

        //Notify th provider
        const formatedDate = format(
            appointment.date, 
            `dd 'de' MMMM', às' H:mm'h'`,
            { locale: pt }
        )
        const message = `${appointment.user.name} cancelou o agendamento do dia ${formatedDate}`

        await Notification.create({
            content: message,
            user: appointment.provider_id
        })

        Queue.add(CancellationMail.key, {
            appointment
        })

        return res.json(appointment)
    }
}

module.exports = new AppointmentController()