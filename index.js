const express = require('express')
const bodyParser = require("body-parser")
const cors = require('cors')
const admin = require('firebase-admin');
require('dotenv').config()
// console.log(process.env.DB_PASS)
const app = express()

app.use(bodyParser.json())
app.use(cors())

var serviceAccount = require("./config/burj-all-arab-7568b-firebase-adminsdk-4x9wq-318fe2e2d2.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const port = 5000
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvvgh.mongodb.net/BurjAllArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
    res.send('Hello World!')
})

client.connect(err => {
    const booking = client.db("BurjAllArab").collection("booking");
    
    //post
    app.post('/addBooking', (req, res) =>{
       const newBooking = req.body;
       booking.insertOne(newBooking)
       .then(result =>{
           res.send(result.insertedCount > 0)
       }) 
    })

    //read
    app.get('/booking', (req, res) =>{
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1]
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    let tokenEmail = decodedToken.email;
                    if(tokenEmail == req.query.email){
                        booking.find({ email: req.query.email })
                            .toArray((err, document) => {
                                res.status(401).send(document)
                            })
                    }
                    else{
                        res.status(401).send("Unauthorized Access")
                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized Access")
                });
        }
        else{
            res.status(401).send("Unauthorized Access")
        }
    })
});


app.listen(port)