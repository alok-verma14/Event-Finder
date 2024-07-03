
module.exports.login = async(req, res)=>{
    req.flash("success", "Successfully logged in! Welcome back to the Event Finder...!");
    let redirectUrl = res.locals.redirectUrl || "/events";
    res.redirect(redirectUrl);
};

// module.exports.register = async(req, res)=>{
//     req.flash("You have registered successfully. Login to get full access!");
//     let redirectUrl = res.locals.redirectUrl || "/events/login";
//     res.redirect(redirectUrl);
// }