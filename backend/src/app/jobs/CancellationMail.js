const { format, parseISO } = require('date-fns')
const pt = require('date-fns/locale/pt-BR')

const Mail = require('../../lib/Mail')

class CancellationMail {
    get key() {
        return 'CancellationMail'
    }

    async handle({ data }) {
        const { appointment } = data

        const formatedDate = format(
            parseISO(appointment.date), 
            `dd 'de' MMMM', às' H:mm'h'`,
            { locale: pt }
        )
        
        await Mail.sendMail({
            to: `${appointment.provider.name} <${appointment.provider.email}>`,
            subject: 'Agendamento cancelado!',
            template: 'cancelation',
            context: {
                provider: appointment.provider.name,
                user: appointment.user.name,
                date: formatedDate
            }
        })
    }
}

module.exports = new CancellationMail()