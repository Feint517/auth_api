const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI_ATLAS, { dbName: process.env.DB_NAME }).then(() => {
    console.log('mongoose connected');
}).catch((err) => console.log(err.message));

mongoose.connection.on('connected', () => {
    console.log('mongoose connected to db');
})

mongoose.connection.on('error', (err) => {
    console.log(err.message);
})

mongoose.connection.on('disconnected', () => {
    console.log('mongoose disconnected');
})

//? close connection to DB when the app is closed
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
})


// const {MongoClient} = require('mongodb')

// let dbConnection
// let uri = 'mongodb+srv://arselene:247596183@securityappdb.bnrub.mongodb.net/?retryWrites=true&w=majority&appName=SecurityAppDB'

// module.exports = {
//     connectToDb: (cb) => {
//         MongoClient.connect(uri).then((client) => {
//             dbConnection = client.db()
//             return
//         })
//         .catch(err => {
//             console.log(err)
//             return cb(err)
//         })
//     },
//     getDb: () => dbConnection
// }