import "dotenv/config";
import express from "express";
import fs from "fs";
import bcrypt from "bcrypt-nodejs";
import md5 from "md5";
import cors from "cors";
import databaseHandler from "./serverdb.mjs";

const db = new databaseHandler();

const app = express();
app.use(cors());

const database = {
    users: [
        {id: '123', name: 'John', email: 'john@gmail.com', password: 'cookies', entries: 0, joined: new Date()},
        {id: '124', name: 'Sally', email: 'sally@gmail.com', password: 'bananas', entries: 0, joined: new Date()}
    ],
    login: [
        {
            id: '987',
            hash: '',
            email: 'john@gmail.com'
        }
    ]
};

// --> res = this is working
app.get("/", (req, res) => {
    console.log(process.env.databaseMode);
    res.send(database.users);
});

app.use(express.json({extended: false}));

///signin --> POST = success/fail

app.post('/signin', async (req, res) => {    

    const {email, password} = req.body;

    if (!email || email.length === 0 || !password || password.length === 0) {
        res.status(400).json('could not sign in');      
        return;
    }

    let foundDBUser = null;

    try {        
        foundDBUser = await db.getUserLogin(email);        
    }
    catch(err) {
        console.error("signInDbError", err);
        res.status(400).json('could not sign in');      
        return;  
    }

    if (foundDBUser === null) {
        console.error(`not found in db ${email}`);
        res.status(400).json('could not sign in');  
        return;  
    }

    if (!bcrypt.compareSync(password, foundDBUser.hash)) {
        console.error("Password does not match");
        res.status(400).json('could not sign in');  
        return; 
    }
    
    delete foundDBUser["hash"];
    res.json(foundDBUser);        
});

//register --> POST = user
app.post('/register', async (req, res) => {    
    const {email, name, password} = req.body;

    if (!email || email.length === 0 || !name || name.length === 0 || !password || password.length === 0) {
        res.status(400).json('error registering user');      
        return;
    }

    //const hashed_password = md5(password + "SaltP4lWmxp2jX");
    const hashed_password = bcrypt.hashSync(password);

    let insertedUser = null;

    try {        
        insertedUser = await db.insertUser(email, name, hashed_password);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('error registering user');      
        return;  
    }

    if (insertedUser === null) {
        res.status(400).json('error registering user');  
        return;  
    }
    
    res.json(insertedUser);    
});

//profile/:userId --> GET = user
app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        res.status(400).json('Invalid ID');       
        return;  
    }
   
    let foundUser = null;

    try {        
        foundUser = await db.getUserById(id);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('User not found');      
        return;  
    }

    if (foundUser === null) {
        res.status(400).json('User not found');       
        return;  
    }
    
    res.json(foundUser);    
});

//image --> PUT --> user
app.put('/image', async (req, res) => {
    const { id } = req.body;

    if (!id || isNaN(id)) {
        res.status(400).json('Invalid ID');       
        return;  
    }

    let updatedEntries = null;

    try {        
        updatedEntries = await db.increaseUserEntries(id);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('Could not update entries');      
        return;  
    }

    if (updatedEntries === null) {
        res.status(400).json('Could not update entries');       
        return;  
    }
    
    res.json(updatedEntries);    
});

app.listen(3610, () => {
    console.log("app is running on port 3610")
});

