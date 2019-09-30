module.exports = {
    url: process.env.MONGO_URL,
    flags: {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true
    }
}