if(process.env.NODE_ENV!= "production"){
    require("dotenv").config(); 
 }
const express = require("express");
const app = express();
const path = require("path");
const User = require('./models/user.js')
const {hashSync} = require("bcrypt");
const session = require("express-session");
const ejsMate = require("ejs-mate");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const PORT = 5000;
const mongoose = require("mongoose");
const {isLoggedIn} = require("./middlewares/passport.js");
const {login, register} = require("./middlewares/extraMiddleware.js");
const Event = require('./models/events.js');
const methodOverride = require("method-override");
const multer  = require('multer');
const nodemailer = require("nodemailer");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
// require('dotenv').config();


//for image storing in our own folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
    }
  })
  
const upload = multer({ storage: storage });


//for sending gmail to users
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.USER,
      pass: process.env.APP_PASSWORD,
    },
  });
 

app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use("/uploads", express.static('uploads'));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const dbUrl = process.env.ATLASDB_URL;
mongoose.connect(dbUrl)
.then(()=>{
    console.log("connected");
})
.catch((err)=>{
    console.log(err);
})

const sessionOptions = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({mongoUrl: 'mongodb+srv://alokverma6872:MfldHo5y9g66inqe@cluster0.nwgbeec.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', collectionName: "sessions"}),
    cookie: {
        expires: Date.now()+1000*60*60*24*3,
        maxAge: 1000*60*60*24*3,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());  //first flash will come after that routes will come.


require('./middlewares/passport');

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next)=>{
    res.locals.success = (req.flash("success"));
    res.locals.error = (req.flash("error"));
    res.locals.currentUser = req.user;
    next();
})

app.get('/events/register', (req, res)=>{
    res.render('register.ejs');
});

app.get('/events/login', (req, res)=>{
    // const USER = req.flash("success");
    res.render('login.ejs');
});
app.post('/events/login', 
passport.authenticate('local', {failureRedirect: '/events/login', failureFlash: true}), login 
);


// app.get("/", (req,res)=>{
//     res.send("Root Page");
// })

app.get("/events", async(req,res)=>{
    const allEvents = await Event.find({});
    res.render('events/home.ejs', {allEvents});

});
app.get('/events/new', isLoggedIn, (req, res)=>{
    res.render('events/new.ejs');
});

app.get('/events/about', (req,res)=>{
    res.render('events/aboutPage.ejs');
});

app.get('/events/contact', (req,res)=>{
    res.render('events/contactPage.ejs');
});

app.get('/events/:id/showUser', async(req, res)=>{
    let {id} = req.params;
    let user = await User.findOne({_id: id});
    let events = await Event.find({owner: id});
    // console.log(events);
    res.render('events/showUser.ejs', {user, events});
})
app.get('/events/:id/show', async(req, res)=>{
    const username = res.locals.currentUser.username;
    const user = await User.findOne({username: username});
    //  console.log(user);

    const {id} = req.params;
    const event = await Event.findById(id);
    const creator = await User.findById(event.owner);
   
    res.render("events/show.ejs", {event, user, creator});
});

app.get('/events/:id/edit', async(req, res)=>{
    const {id} = req.params;
    const event = await Event.findById(id);
    res.render('events/edit.ejs', {event});
});

app.get('/events/:id/creator', async(req, res)=>{
    const {id} = req.params;
    const event = await Event.findById(id);
    const creatorId = event.owner;
    const creator = await User.findById(creatorId);

    const events = await Event.find({owner: creatorId})
    res.render('events/showCreator.ejs', {creator, events});
})

app.put('/events/:id', upload.single("eventImage"), wrapAsync(async(req, res)=>{
    const {id} = req.params;
    if(req.file == undefined){
        let updatedEvent = await Event.findByIdAndUpdate(id, {...req.body.send}, {runValidators: true, new: true});
        req.flash("success", "Event Updated");

        res.redirect('/events');
    }else{
        let eventImage = req.file.filename;
        let updatedEvent = await Event.findByIdAndUpdate(id, {...req.body.send, image: eventImage}, {runValidators: true, new: true});
        req.flash("success", "Event Updated");
        res.redirect('/events');
    }
}));

app.delete('/events/:id', wrapAsync(async(req, res)=>{
    const {id} = req.params;
    const event = Event.findById(id);
    await Event.deleteOne(event);
    req.flash("success", "Event Deleted");
    res.redirect('/events');

}))

app.get('/events/:id/editUser', async(req, res)=>{
    let {id} = req.params;
    let user = await User.findById(id);
    
    res.render('events/editUserForm.ejs', {user});
})
app.get('/events/:id/show/eventRegister', async(req, res)=>{
    const {id} = req.params;
    const event = await Event.findById(id);
    res.render('events/eventRegistrationPage.ejs', {event});
})

app.put('/events/:id/editUser', upload.single("userImage"), wrapAsync(async(req, res)=>{
    let {id} = req.params;
    let send = req.body.send;
    // let {userImage = req.body.userImage;
    // console.log(userImage);
    // let userImage = req.file.filename;
    if(req.file == undefined){
        const updateduser = await User.findByIdAndUpdate(id, {...send}, {runValidators: true, new: true});
        // console.log(updateduser);
        req.flash("success", "User Details Updated");
        res.redirect('/events');
    }else{
            let userImage = req.file.filename;
            const updateduser = await User.findByIdAndUpdate(id, {...send, userImage: userImage}, {runValidators: true, new: true});
            // console.log(updateduser)
            req.flash("success", "User Details Updated");
            res.redirect('/events');       
    }
}))
app.post('/events/:id/eventRegister', wrapAsync((req, res)=>{
    const {email, number, eventId, fees} = req.body;
    // console.log(req.body);

    //sending successful payment email
    const mailOptions = {
        from: {
            name: "Event Finder",
            address: process.env.USER // sender address
        }, 
        to: `${req.body.email}`, // list of receivers
        subject: "Successful Payment of event on Event Finder ✔", // Subject line
        text: "Your payment is successfully received. Thank you for registering for the event. We wish that you would have great time and experience. Here, we value your considertaion!!", // plain text body
        html: "<b> Your payment is successfully received.</b> <br> <p>Thank you for registering for the event. We wish that you would have great time and experience. Here, we value your consideration!! </p>" // html body
      };

      const sendMail = async(transporter, mailOptions) =>{
        try {
            await transporter.sendMail(mailOptions);
            console.log('Mail has been sent!');
        } catch (error) {
            console.log(error);
        }
      }
    
      sendMail(transporter, mailOptions);
      req.flash("success", "You have Successfully Registered for this event");

    res.redirect('/events');
}));

app.get('/logout', (req, res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash("success", "You have logged out!");

        res.redirect('/events');
      });
    
});

app.post('/events/register', upload.single("image"), wrapAsync(async(req, res)=>{
    const checkUser = await User.findOne({username: req.body.username});
    if(checkUser){
        return res.status(400).send("User Already exists");
    }
    try{

        if(req.file == undefined){
            let newUser = new User({
                fullname: req.body.fullname, 
                state: req.body.state, 
                country: req.body.country, 
                username: req.body.username, 
                email: req.body.email,
                password: hashSync(req.body.password, 10)
            });

            await newUser.save();

        }else{
            let image = req.file.filename;
            let newUser = new User({
                fullname: req.body.fullname, 
                state: req.body.state, 
                country: req.body.country, 
                username: req.body.username, 
                email: req.body.email,
                password: hashSync(req.body.password, 10),
                userImage: image
            });
            await newUser.save();
        }

       
        //sending mail to user who has successfully registered
        const mailOptions = {
            from: {
                name: "Event Finder",
                address: process.env.USER // sender address
            }, 
            to: `${req.body.email}`, // list of receivers
            subject: "Successful Registration on Event Finder ✔", // Subject line
            text: "Welcome to the Event Finder. We hope that you would have great experience ahead with us. So, let's dive into the world of events ", // plain text body
            html: "<b> Welcome to the Event Finder. </b> <br> <p>We hope that you would have great experience ahead with us. So, let's dive into the world of events. </p>" // html body
          };

          const sendMail = async(transporter, mailOptions) =>{
            try {
                await transporter.sendMail(mailOptions);
                console.log('Mail has been sent!');
            } catch (error) {
                console.log(error);
            }
          }
        
          sendMail(transporter, mailOptions);
          req.flash("success", "You have successfully registered to the Event Finder");


        res.redirect('/events/login');
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/events/register");
    }
    
}));


app.post('/events/:id', upload.single("image"), wrapAsync(async(req, res)=>{
    let {id} = req.params;
    const {title, description, time, date, fees, guest, city, country, pincode, contact, address, state} = req.body;
    // console.log(req.body);
    if(req.file == undefined){
        let image = 'Default-Event-Image.png';
        const newUser = new Event({
            title: title, 
            description: description, 
            image: image, 
            time: time, 
            date: date,
            fees: fees,
            guest: guest, 
            city: city, 
            country: country, 
            pincode: pincode, 
            contact: contact, 
            address: address, 
            state: state,
            owner: id
        })
        await newUser.save();
    }else{
        let image = req.file.filename;
        const newUser = new Event({
            title: title, 
            description: description, 
            image: image, 
            time: time, 
            date: date,
            fees: fees,
            guest: guest, 
            city: city, 
            country: country, 
            pincode: pincode, 
            contact: contact, 
            address: address, 
            state: state,
            owner: id
        })
        await newUser.save();
    }
   
    req.flash("success", "Event has posted successfully");

    res.redirect('/events');
}));

//for all routes which are not created
app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next)=>{
    // res.send("Something went wrong");

    let {statusCode = 500, message="Something Went Wrong"} = err;
    //res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs", {message});
});



app.listen(PORT, ()=>{
    console.log(`Server is listening at port ${PORT}`);
})