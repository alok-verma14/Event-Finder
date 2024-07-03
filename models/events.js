const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://alokverma6872:MfldHo5y9g66inqe@cluster0.nwgbeec.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
// .then(()=>{
//     console.log("connected");
// })
// .catch((err)=>{
//     console.log(err);
// })
const eventsSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: String,
    guest: String,
    image: {
        type: String
    },
    fees: Number,
    time: String,
    date: String,
    address: String,
    pincode: Number,
    city: String,
    state: String,
    country: String,
    contact: Number,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const Event = mongoose.model('Event', eventsSchema);

module.exports = Event;
