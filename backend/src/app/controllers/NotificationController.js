const Notification = require('../schemas/Notification')
const User = require('../models/User')

class NotificationController {
    async index(req, res) {
        const checkIsProvider = await User.findOne({
            where: {
                id: req.userId,
                provider: true
            }
        })

        if(!checkIsProvider) {
            return res.status(401).json({ msg: 'Only providers can load notifications.' })
        }

        const notifications = await Notification.find({
            user: req.userId
        }).sort({ createdAt: 'desc' }).limit(5)

        return res.json(notifications)
    }

    async update(req, res) {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id, 
            { read: true },
            { new: true }
        )

        return res.json(notification)
    }
}

module.exports = new NotificationController()