const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const JWT_SECRET = 'b5237e14be2721e21f19fa029bcb180f03c80d3cc1fce4dab10d52cd4955fd8439a25e039db43ac7de8838642a5e45cbb286c8270d41385d9ea8d3bf3bd35e7e';
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/").then(()=>{console.log("Database Connected");}).catch((error)=>{console.log(error);})

app.get("/", (req,res)=>{
    res.send('<h1>Server Listening at 3000</h1>')
})

app.post("/register", async (req,res) => {
    try {
        // getting all the data from the body
        const {firstName, lastName, email, password} = req.body;
        // all the data should exists
        if(!(firstName && lastName && email && password)){
            return res.status(400).send('All Fields are Compulsory');
        }
        // check if user already exists
        const ExistingUser = await User.findOne({ email : email});
        if(ExistingUser){
            return res.status(400).send("User Already Exists");
        }
        // encryption of password
        const encryptedPassword = await bcrypt.hash(password, 10);
        // saving the user in DB
        const user = await User.create({
            firstName,
            lastName,
            email,
            password : encryptedPassword,
        })
        // generate a token and send it to user
        const token = jwt.sign(
            {id : user._id, email},
            JWT_SECRET
        );
        user.token = token;
    
        res.status(200).json({success : true, msg : "User Created", user : user})

    } catch (error) {
        return res.status(400).json(error);
    }
})

app.post("/login", async(req,res)=>{
    try {
        // get all data from user
        const {email, password} = req.body;
        // validation
        if(!(email && password)){
            return res.status(400).send("All Fields are Necessary");
        }
        // find user in DB
        const user = await User.findOne({email : email})
        if(!user){
            return res.status(400).send("user with this email doesn't exist");
        }
        // match the Password
       if(user && (await bcrypt.compare(password, user.password))){
           const token = jwt.sign({id : user._id, email}, JWT_SECRET);
           user.token = token;
       }
       else{
        return res.status(400).send("Password is incorrect");
       }
        // send token
        return res.status(200).json({success : true, msg : "Login Successful", user : user, token : user.token})
    } catch (error) {
        return res.status(400).send(error);
    }
})

app.get("/allusers", async(req,res)=>{
    try {
        const allUsers = await User.find({});

        return res.status(200).json(allUsers);
    } catch (error) {
        return res.status(400).json(error);
    }
})


app.listen(3000, ()=>{
    console.log("Listening on the Port 3000");
})