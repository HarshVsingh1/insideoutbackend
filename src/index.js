const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer') ;
const crypto = require('crypto');
const { type } = require('os');

const PORT = process.env.PORT || 3000;
app.use(express.json()) ; 
app.use(cors()); 

const SECRET = "csitKiMKC"

const transporter = nodemailer.createTransport({
    service : 'gmail' , 
    auth :  {
        user : '' ,
        pass : '' ,
    }
})

const sendOtp = async (email , otp) => {
    try {
        
        const mailOptions = {
            from : ' ' , 
            to : email ,
            subject : 'Your verification otp',
            text : `your otp is ${otp}`
        }

        await transporter.sendMail(mailOptions)
        console.log('OTP sent successfully');

    }
    catch{
        console.log('failed to send to otp');
    }
}

const verifyotpSchema = new mongoose.Schema({
    userName : String ,
    password : String ,
    email : String ,
    otp : Number ,
    createdAt : {type : Date , default : Date.now , expires : '1m'} 
})

const tweetSchema = new mongoose.Schema({
    message : String ,
    email : String ,
    createdAt : {type :Date , default : Date.now}
})

const userSchema = new mongoose.Schema({
    userName : String ,
    email : String ,
    password : String
})

const Tweet = mongoose.model('Tweet', tweetSchema) 
const User = mongoose.model('User' , userSchema) 
const Verify = mongoose.model('Verify' , verifyotpSchema )

mongoose.connect('mongodb+srv://harsh:Geetasingh%40098@cluster0.wifoeru.mongodb.net/?retryWrites=true&w=majority', { dbName: "hditcsitd" });

app.get('/', (req,res) => {
    
    res.status(200).json({messgae : 'hello'})
}) 

const kietCheck = (req , res , next) => {
  
}

app.post('/signup', async (req , res) => {
     const {userName , email , password} = req.body 
 
     const user = User.findOne({email})

     if(user && userName && password){
       const  otp =   crypto.randomInt(10000,99999).toString() 

       const newUser = new Verify({
        userName ,
        email ,
        password ,
        otp 
       })

       await newUser.save() 

       sendOtp(email , otp)
       
       res.status(200).json({'message' : 'otp send successfully'})
       
     }

     res.status(500).json({'message' : 'something broke'})


}) 

app.post('/otpverify', async (req,res) => {

    try{

        const {email , otp} = req.body ;

        const user = Verify.findOne({email}) ;
    
        if(user.otp == otp) {
            
            const newUser = new User({
                userName : user.userName ,
                email : user.email ,
                password : user.password
            })
    
            await newUser.save() 
    
            const token = jwt.sign({username , email} , SECRET , {expiresIn : '2h'} )
    
            res.status(200).json({'message' : 'user created successfully' , token , email})
        }

    }
     catch {

         res.status(500).json({'message' : 'something broke'})
     }

})


app.post('/signin' , async (req,res) => { 
    try {

        const {email , password} = req.body  ;

        if(email && password) {
            const user = User.findOne({email}) ;
            if (user.password == password ) {
                const token = jwt.sign({ userName : user.userName } , SECRET , {expiresIn : '2h'} )
                res.status(200).json({token , email}) ;
    
            }else {
                res.status(404).json({'message' : 'wrong password'})
            }
        }

    }
   catch {
    res.status(500).json({'message' : 'something broke'})
   }



})

app.post('/addtweet' , async (req,res) => { 

    try {
        const {email , message} = req.body ;

        const newTweet = new Tweet({
          message ,
          email
        })
      
        await  newTweet.save()
      
        res.status(200).json({"message" : 'Message added successfully'})
    } catch{
            
        res.status(404).json({'message' : 'unauthorized'})
    }

}) 

app.get('/tweets' ,async (req,res) => {
    const lastId = req.body.lastId ;
    const limit = 10 ; 

    let query = {} 
    if(lastId) {
        query = {_id : { $gt : lastId}}
    }

    try{
       const tweets = await Tweet.find(query).limit(limit).sort({_id : 1})
       res.json(tweets) 
    }
    catch {
        res.status(500).json({ error: err.message });
    }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});