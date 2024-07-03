const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const {compareSync} = require("bcrypt");

passport.use(new LocalStrategy(async(username, password, done)=>{
    const user = await User.findOne({username});
    try{  
        if(!user) return done(null, false); //when user not found

        if (!compareSync(password, user.password)) return done(null, false);   //when password is valid
        
        if(user) return done(null, user); //when user found
    }catch(error){
        done(error, false);
    }
}));

    

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

module.exports.isLoggedIn = (req, res, next)=>{
  if(req.user){
      return next();
  }
  res.redirect('/events/login');
};

