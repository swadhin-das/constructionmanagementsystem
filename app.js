require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const expressLayout = require('express-ejs-layouts');
const bcrypt = require("bcryptjs");
const cookieParser=require('cookie-parser')
const jwt = require('jsonwebtoken'); 
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const ejs = require('ejs');
const flash = require('connect-flash');
const Customer = require('./server/models/Customer');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayout);
app.set('layout', './layouts/main');
// Static Files
app.use(express.static('public'));
app.set("view engine", "ejs");

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(passport.initialize());
app.use(passport.session());
// Flash Messages
app.use(flash({ sessionKeyName: 'express-flash-Message' }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required:true
    },
    googleId: {
        type: String
    },
    secret: {
        type: String
    },
    token: {
        type: String,
        }

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

userSchema.methods.generateAuthToken = async function () {
    try {
        console.log(this._id);
        const token = jwt.sign({ _id: this._id.toString() }, "mynameisswadhindas");
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (error) {
        console.log("error part" + error);
    }
}

// Hash the password before saving to the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};



const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost/auth/google/constructionmanagement',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
}));

app.get('/', (req, res) => {
    res.render("home.ejs", { layout: false });
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
    }
);

app.get('/login', (req, res) => {
    const errorMessage = req.query.error === '1' ? 'Authentication failed. Please try again.' : '';
    res.render('login.ejs', { error: errorMessage, layout: false });
});

app.get('/register', (req, res) => {
    res.render("register.ejs", { layout: false });
});

app.get('/secrets', async (req, res) => {
    try {
        const messages = await req.flash('info');
        const customers = await Customer.find({}).limit(22);
        const locals = {
            title: 'NodeJS',
            description: 'free nodejs user management system',
        };

        res.render('index', { locals, messages, customers, layout: './layouts/main' });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.error(err);
        }
        res.redirect("/");
    });
});

app.get('/adminLogin', (req, res) => {
    res.render("adminlogin", { layout: false })
});

app.get("/registered", (req, res) => {
    res.render("registered", { layout: false })
});






// Registration route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ username, password: hashedPassword });
        await user.save();

        const token = user.generateAuthToken();
        console.log("the token part" + token);

        res.redirect('/registered');
    } catch (err) {
        console.error(err);
        res.redirect('/register');
    }
});

// Login route

async function hashPass(password){
    const res = await bcryptjs.hash(password,10)
    return res
}
async function compare(userPass,hashPass){
    const res = await bcryptjs.compare(userPass,hashPass)
    return res
}
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.redirect('/login?error=1'); // User not found
        }

        const isMatch = await user.comparePassword(password);

        if (isMatch) {
            const token = user.generateAuthToken();
            console.log("the token part: " + token);
            res.redirect('/secrets');
        } else {
            res.redirect('/login?error=1'); // Incorrect password
        }
    } catch (err) {
        console.error(err);
        res.redirect('/login?error=1'); // Error occurred
    }
});


app.post("/adminLogin", async (req, res)=> {

});

app.use('/', require('./server/routes/customer'));

app.get('*', (req, res) =>{
    res.status(404).render('404');
});

// app.post('/add/upload',upload.single('profileImage'),async(req,res)=>{
//     if (req.file) {
//               // The uploaded file can be accessed as req.file
//               console.log('File uploaded:', req.file);
//               // You can perform further processing or save the file to the database here
//               res.send('File uploaded successfully.');
//             } else {
//               res.status(400).send('No file selected for upload.');
//             }
// })
  
app.listen(8000, () =>{
    console.log("Server is running on port 8000");
});