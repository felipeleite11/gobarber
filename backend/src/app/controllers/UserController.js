const User = require('../models/User')

const yup = require('yup')

class UserController {
    async store(req, res) {
        const schema = yup.object().shape({
            name: yup.string().required(),
            email: yup.string().email().required(),
            password: yup.string().required().min(6)
        })

        if(!(await schema.isValid(req.body))) {
            return res.status(400).json({ msg: 'Validation fails.' })
        }

        const userExists = await User.findOne({
            where: {
                email: req.body.email
            }
        })

        if(userExists) {
            return res.status(400).json({ msg: 'User already exists.' })
        }

        const { id, name, email, provider } = await User.create(req.body)

        return res.json({ 
            id, 
            name, 
            email, 
            provider 
        })
    }

    async update(req, res) {
        const schema = yup.object().shape({
            name: yup.string(),
            email: yup.string().email(),
            oldPassword: yup.string().min(6),
            password: yup.string().min(6).when('oldPassword', (oldPassword, field) => 
                oldPassword ? field.required() : field
            ),
            confirmPassword: yup.string().when('password', (password, field) => 
                password ? field.required().oneOf([yup.ref('password')]) : field
            )
        })

        if(!(await schema.isValid(req.body))) {
            return res.status(400).json({ msg: 'Validation fails.' })
        }

        const { email, oldPassword } = req.body

        const user = await User.findByPk(req.userId)

        if(email !== user.email) {
            const userExists = await User.findOne({
                where: {
                    email
                }
            })
    
            if(userExists) {
                return res.status(400).json({ msg: 'User already exists.' })
            }
        }

        if(oldPassword && !(await user.checkPassword(oldPassword))) {
            return res.status(400).json({ msg: 'Password does not match.' })
        }

        const { id, name, provider } = await user.update(req.body)

        return res.json({ 
            id, 
            name, 
            email, 
            provider 
        })
    }
}

module.exports = new UserController()