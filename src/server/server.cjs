require('dotenv').config();

const URL_AUTH="http://127.0.0.1:4000";

const express = require('express');
var cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dbServices = require('./DbServices.cjs');


const whiteList = [
    //'https://yourprod.ip.address.com', // must be https!
    //'http://<your local IP>:<port>', // optional, LAN access
    'http://127.0.0.1:5173', // LAN access (server 1)
    'http://localhost:5173', // LAN access (browser)
    // ...
];

const corsOptions = {
    origin:whiteList,
    credentials: true,
    headers: '*',
    // origin: (origin, callback) => {
    //     if(origin){console.log("origin: "+ origin)}
    //     else{console.log("no origin");}
    //     // `!origin` allows server-to-server requests (ie, localhost requests)
    //     if(!origin || whiteList.indexOf(origin) !== -1) {
    //         callback(null, true)
    //     } else {
    //         callback(new Error("(v2) :4000. Not allowed by CORS: "+ origin))
    //     }
    // },
    optionsSuccessStatus: 200
}

// CORS options
app.use(cors(corsOptions))
app.use(express.json());

// middleware - add headers
// app.use((req,res,next)=>{
//     /* @dev First, should read more about security */
//     res.append('Access-Control-Allow-Origin', '*');
//     res.append('Access-Control-Allow-Headers', '*');
//     res.append('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
//     res.append('Access-Control-Max-Age', 2592000);
//     res.append('Content-Type', 'application/json');

//     // console.log("app.use(cors middleware)");
//     next();
// });


// ¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ //
// USERS LOGIN //
// ¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ //
// Users data for dev purposes
// [ {"username": "name", "email": "name@email.com", "password": "hashed password" } , ... ]
// Dev "DB" array
const users = [];
app.get('/users', async (req, res) => {
    let allUsers = [];
    let query = "SELECT * FROM "+process.env.USERS_TABLE;
    await dbServices.getDb(process.env.USERS_PATH, process.env.USERS_TABLE)
    .then(async (db) => {return await dbServices.getRows(db,query,[])})
    .then((rows) => {
        allUsers = rows;
        res.status(200).send({users: allUsers});
    })
    .catch((err) => {res.status(500).send({err: err.toString()})});
});
app.get('/allposts', async (req, res) => {
    let query = "SELECT * FROM "+process.env.POSTS_TABLE;
    await dbServices.getDb(process.env.POSTS_PATH, process.env.POSTS_TABLE)
    .then(async (db) => {return await dbServices.getRows(db,query,[])})
    .then((rows) => {
        res.status(200).send({data:{posts:rows}, err:""})
    })
    .catch((err) => {res.status(500).send({err: err.toString()})});
});


// Sign up
// using bcrypt (async) to salt & hash password before saving in server
app.post('/users', async (req, res) => {
    console.log("app.post('/users', ..");
    try{
        // genSalt(rounds) // default:10, can make a few per second. NOTE. At 20-30 might take days.
        const salt = await bcrypt.genSalt(10); // Could also set the rounds num below  in hash()
        // bcrypt.hash(data, saltOrRounds) // salt is saved in the hash, don't need to save separately
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // const user = {
        //     id: random string
        //     username: req.body.username, 
        //     email: req.body.email, 
        //     password: hashedPassword
        // };

        // Add to DB
        let userid = randstr( (req.body.username.substr(0,2)+"_") );
        let query = "INSERT INTO "+process.env.USERS_TABLE+"("+process.env.USERS_COLUMNS+") VALUES("+process.env.USERS_PARAM_AMOUNT+")";
        let params = [userid, req.body.username, req.body.email, hashedPassword ];
        await dbServices.getDb(process.env.USERS_PATH, process.env.USERS_TABLE)
        .then((db) => {dbServices.insertRow(db, query, params)})
        .catch((err) => {res.status(500).send( {err:"DB error. " + err.toString()} )});

        // res = makeResWithHeaders(res);
        // res.status(201).send(); // Created. Send blank payload
        res.status(201).send({data:{msg:"New account created"}, err:""}); // Created. Send message in {msg: "info about request success"}
    }
    catch (err) {
        res.status(500).send({err: "BCrypt error. " + err.toString()}); // internal server error
    }
});

// Login - check password - send request to Auth server for JWTs
app.post('/users/login', async (req,res) => {
    console.log("app.post('/users/login'." );
    // -------------------
    // 1) Check password
    // -------------------

    passwordOk = false;

    // Find user from db using email
    // let user = {userid:"", username:"", email:"", hashedPassword:""};
    let user = null;

    await getUserFromDb(req.body.email)
    .then(async (rows) =>{
        if(!rows.length == 1){
            return res.status(400).send( {err:"User not found."} );
        }
        user = rows[0];
        // Compare password to hashed password
        try{
            console.log("Login - user ok with given email");
            // bcrypt.compare(unhashed password, hashed password)
            if (await bcrypt.compare(req.body.password, user.hashedPassword)){
                console.log("Login - password ok");
                // Password ok. Can continue to request JWTs.
                passwordOk = true;
            } else {
                console.log("Login - password not ok");
                return res.send({err:"Password not accepted"});
            }
        }catch{
            return res.status(500).send({err:"BCrypt compare error"});
        }
    })
    .catch((err) =>{
        return res.status(500).send({err : "DB Error. " + err.toString()});
    });

    // -------------------
    // 2) Request JWTs
    // -------------------

    if(passwordOk && user != null){
        console.log("2) Request JWTs. --> passwordOk && user != null. User DIR:");
        console.dir(user);
        // 2.1) Request options
        const url_jwt = URL_AUTH+"/auth/login";
        const requestOptions_jwt = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userid:user.userid, username:user.username, email:user.email})
        }
        const request_jwt = new Request(url_jwt, requestOptions_jwt);

        // 2.2) request JWTs from auth server
        return await fetch(request_jwt)
        .then((res) => res.json())
        .then((json) => { res.send(json)})
        .catch((err) => {res.status(500).send( {err: err.toString()} )});
    }
});

// Login (v2) - cookies test - NOT IN USE
app.post('/users/login2', async (req,res) => {
    const user = users.find(user => user.email === req.body.email);
    console.log("app.post('/users/login2'. users.length: " + users.length );
    // if(user == null) return res.status(400).send('Cannot find user'); // Bad request
    if(user == null) {
        console.log("Login - no user found with given email");
        //return res.status(400).send("No findy email");
        return res.status(400).send({err:"No account found with email"});
        // return res.send({data:{msg:""},err:"Cannot find user with given email"});
    }

    try{
        console.log("(v2) Login - user ok with given email");
        // bcrypt.compare(unhashed password, hashed password)
        if (await bcrypt.compare(req.body.password, user.password)){
            console.log("Login - password ok");
            // res.send('Accepted');
            // res.send({data:{msg:"Accepted"}});
        } else {
            console.log("Login - password not ok");
            // res.send('Password not accepted');
            // res.send({data:{msg:""},err:"Password not accepted"});
            res.send({err:"Password not accepted"});
        }
        console.log("Login --> should continue to make JWTs");

    }catch{
        // return res.status(500).send(); // internal server error
        return res.status(500).send({err:"BCrypt compare error"});
    }

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    // Make JWT
    console.log("Login --> make JWTs");
    
    // 2.1) JWT request options
    // Cookie test - send credentials in response
    const url_jwt = URL_AUTH+"/auth/login2";
    const requestOptions_jwt = {
        method: 'POST',
        // credentials: "include", // include, *same-origin, omit
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email:req.body.email})
    }
    const request_jwt = new Request(url_jwt, requestOptions_jwt);

    console.log("requestOptions_jwt.body: " + requestOptions_jwt.body);

    // 2.2) make JWT

    await fetch(request_jwt)
    .then(response => { 
        return response.json();
    })
    .then(json => {
        if (json.err){throw new Error(json.err)}
        // json = {data:{ accessToken : accessToken, refreshToken : refreshToken }, err:""}

        // ADD COOKIES
        // https://expressjs.com/en/api.html#res.cookie
        console.log("--Login(v2) - adding cookies to response!");
        let cookieOpts = {
            // httpOnly: true,    // safety, does not allow cookie to be read in the frontend javascript
            //httpOnly: true,    // dev
            maxAge: 24*3600*1, // cookie age in seconds
            // sameSite: 'Strict',
            // SameSite: 'Strict', 
            // secure: process.env.NODE_ENV !== 'development',
            // secure: true,
            // Domain: '127.0.0.1'
            httpOnly: true,
            sameSite: "none",
            secure: true, // this was 'false' before. 'true' works.
        }
        // if(process.env.NODE_ENV === 'production') {
        //   // these options work on a https server
        //   cookieOpts.secure = true 
        //   cookieOpts.sameSite= 'None'
        // }

        res.cookie('accessToken2', json.data.accessToken, cookieOpts);
        // res.cookie('accessToken2', accessToken, { maxAge: 900000, httpOnly: true });
        res.cookie('refreshToken2', json.data.refreshToken, cookieOpts);

        res.send({data:'LE tokens is in the cookies!'});

        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

        // returnObject_jwt = json;
        // res.send( returnObject_jwt);
    })
    .catch((err) => {
        console.log("await makeRequest(request_jwt) caught error, " + err.toString());
        res.send( {err:err.toString()});
    });

});


// ¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ //
// JWT token testing //
// ¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ //

// Use middleware (func) to check auth
// Get users' posts
app.get('/posts', authenticateToken, async (req,res) => {
    // DEV DB
    // console.log("Got user; Get Posts -->");
    // console.dir(posts2);
    // console.dir("Find matching posts with email: " + req.user.email);
    // let matches = (posts2.filter(post => post.email === req.user.email));
    // console.log("--> matches: " + (JSON.stringify(matches)));
    // // res.json(posts2.filter(post => post.email === req.user.email));
    // res.send({data:{posts:matches}, err:""})

    // DB
    let query = "SELECT * FROM "+process.env.POSTS_TABLE+" WHERE userid=?";
    let params = [req.user.userid];
    await dbServices.getDb(process.env.POSTS_PATH,process.env.POSTS_TABLE)
    .then(async (db) => {return await dbServices.getRows(db, query, params)})
    .then((rows) => {
        console.log(" Get Posts -->");
        console.dir(rows);
        res.send({data:{posts:rows}, err:""})
    })
    .catch((err) =>{ res.status(500).send( {err:err.toString()} )} );

});
// Make new post
app.post('/posts', authenticateToken, async (req,res) => {
    console.log("app.post('/posts', ...");
    // req.user added in authenticateToken
    if(req.user.userid === undefined){res.status(500).send( {err:"Token error. Try logging in again"} )}

    let newPostId = "p_" + randstr(req.user.userid.substr(0,2));
    // let newPost = {userid: req.user.userid, username: req.user.username, postid: newPostId, textcontent: req.body.textcontent}
    
    let query = "INSERT INTO "+process.env.POSTS_TABLE+"("+process.env.POSTS_COLUMNS+") VALUES("+process.env.POSTS_PARAM_AMOUNT+")";
    let params = [req.user.userid, req.user.username, newPostId, req.body.textcontent];
    await dbServices.getDb(process.env.POSTS_PATH, process.env.POSTS_TABLE)
    .then((db) => {dbServices.insertRow(db, query, params)})
    .catch((err) => {res.status(500).send( {err:"DB error. " + err.toString()} )});

    // res.status(201).send(); // Created. Send blank payload
    res.status(201).send({data:{msg:"Post saved"}, err:""}); // Created. Send message in {msg: "info about request success"}
});
app.delete('/posts', authenticateToken, async (req,res) => {
    console.log("app.delete('/posts', ...");
    let query ="DELETE FROM "+process.env.POSTS_TABLE+" WHERE postid=?";
    let values = [req.body.postid];
    await dbServices.getDb(process.env.POSTS_PATH,process.env.POSTS_TABLE)
    .then(async (db) => {
        await dbServices.deleteRow(db, query, values)
        .then(() => {
            console.log("Delete post successful - 204");
            // 204 : No Content success status response code indicates that a request has succeeded, but that the client doesn't need to navigate away from its current page
            res.status(204).send();
        })
        .catch((err) => {res.status(500).send({err: "Remove post err." + err.toString()}) });
    })
    .catch((err) => {res.status(500).send({err: "Remove post err." + err.toString()}) });
});

async function getUserFromDb(email){
    return new Promise( async (resolve,reject)=>{

        let query = "SELECT * FROM " + process.env.USERS_TABLE + " WHERE email=?";
        let params = [email];

        await dbServices.getDb(process.env.USERS_PATH,process.env.USERS_TABLE)
        .then(async (db) => await dbServices.getRows(db,query,params))
        .then((rows) => resolve(rows))
        .catch((err) => reject(err.toString()) );
    });
}

// Middleware - to auth token
async function authenticateToken(req, res, next) {
    // Get token from header
    console.log("authenticateToken. req.headers:");
    console.dir(req.headers);
    let authHeader = req.headers['authorization']; // "Bearer TOKEN" -format


    const token = authHeader && authHeader.split(' ')[1]; // undefined | TOKEN
    if (token == null) {
        console.log("  -401 (No Access Token)");
        return res.status(401).send({err:"No Access Token. Can't authenticate"});
    }
    console.log("Token: "+ token);
    // jwt.verify(token, secretOrPublicKey, [options, callback]) // (Asynchronous) If a callback is supplied
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) {
            // Forbidden. Token exists, but not valid (--> expired)
            console.log("  -ERR: " + err.toString());
            console.log("  -403 (Access Token is not valid (expired?))");
            return res.status(403).send( {err: err.toString()} );
        } 

        // Valid token. Add payload to request and move forward.
        console.log("Valid token. Got user: " + user.email.toString() + " and DIR:");
        console.dir(user);
        // Add user to req
        req.user = user;
        next();
    });

}
// Random string for Ids
function randstr(prefix)
{
    // https://stackoverflow.com/a/59837035
    return Math.random().toString(36).replace('0.',prefix || '');
}

console.log("Server listening at :3000");
app.listen(3000);