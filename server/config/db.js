const mongoose = require('mongoose');
mongoose.set('strictQuery', false);


//   mongoose
//      .connect( uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
//      .then(() => console.log( 'Database Connected' ))
//      .catch(err => console.log( err ));


const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database Connected:${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;