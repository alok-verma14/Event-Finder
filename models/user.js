const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// main()
// .then(()=>{
//     console.log("connected");
// })
// .catch((err)=>{
//     console.log(err);
// })
// async function main(){
//     await mongoose.connect('mongodb+srv://alokverma6872:MfldHo5y9g66inqe@cluster0.nwgbeec.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
// };

const userSchema = new mongoose.Schema({
    fullname: {type: String, required: true},
    state: {type: String, required: true},
    country: {type: String, required: true},
    username: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String},
    userImage: {type: String}

});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;
