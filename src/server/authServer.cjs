// Login, log out.. Managing Access and Refresh tokens
// Tokens Payload: {userid: '', email: ''};


require('dotenv').config();

const express = require('express');
var cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const dbServices = require('./DbServices.cjs');

const whiteList = [
    'http://localhost:3000', // not https
    //'https://yourprod.ip.address.com', // must be https!
    //'http://<your local IP>:<port>', // optional, LAN access
    'http://127.0.0.1:3000', // LAN access (server 1)
    'http://localhost:5173', // LAN access (browser)
    // ...
];

const corsOptions = {
    credentials: true,
    origin:whiteList,
    headers:'*',
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
// CORS JSON
app.use(express.json());
app.options('*', cors());

// Middleware - console.log incoming request info
app.use((req,res,next) =>{
    console.log("Incoming Request:");
    console.log("req.origin: " + req.origin);
    console.log("req.body: " + req.body);
    console.log("req.method: " + req.method);
    next();
});

// // middleware - add headers
// app.use((req,res,next)=>{
//     /* @dev First, should read more about security */
//     res.append('Access-Control-Allow-Origin', '*');
//     res.append('Access-Control-Allow-Headers', '*');
//     res.append('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
//     res.append('Access-Control-Max-Age', 2592000);
//     res.append('Content-Type', 'application/json');
//     // console.log("app.use(cors middleware)");

//     // Cookie test - allow credentials
//     res.append('Access-Control-Allow-Credentials', '*');

//     next();
// });

function getExpireDateUTC(){
    console.log("getExpireDateUTC()")
    // Assumes that accessExpireTime is written in minutes, Eg: "1m", "5m"
    let numString = accessExpireTime.replace("s","").replace("m","").replace("h","");
    let numNumber = 0;
    try{
        numNumber = Number(numString);
    }catch{
        numNumber = 5; // default value to use with erronous accessExpireTime
    }
    let liveTime = 1;
    let multiplier = 1;
    if(accessExpireTime.includes("m")){ multiplier = 60}
    else if(accessExpireTime.includes("h")){ multiplier = 60 * 60}

    liveTime = 1000 * numNumber * multiplier;

    const d = new Date();
    let accessExpire = new Date( d.getTime() + liveTime ).toUTCString();
    console.log("accessExpire : " + accessExpire);
    return accessExpire;
}

// AccessToken is valid for duration:
// Eg: 60000, "1y", "2 days", "7d", "10h", "2.5 hrs", "60s", "1m". Plain Number means milliseconds.
const accessExpireTime = '20s';


// Check refresh token, create new tokens if ok
app.post('/token', async (req,res) => {
    let refreshToken = req.body.token;
    console.log("app.post('/token', ...")
    // If no token in request.body
    if (refreshToken == null) {
        // 401 Unauthorized. (No token in request)
        console.log(" -401 (No token in request)");
        return res.status(401).send({err:"No Refresh Token in request.", errStatus:401 });} // Unauthorized. No token.
    

    // If token not in DB
    await dbServices.getDb(process.env.REFRESHTOKENS_PATH, process.env.REFRESHTOKENS_TABLE)
    .then(async (db) => {
        let query = "SELECT * FROM "+process.env.REFRESHTOKENS_TABLE+" WHERE "+process.env.REFRESHTOKEN_COLUMN+"=?";
        await dbServices.getRows(db, query, [refreshToken])
        .then((rows) => {if(!rows.length == 1){
            refreshToken = null;
            console.log(" -403 (Token Deleted / non existing in DB)");
            res.status(403).send({err:"Refresh Token is not valid (non-existing in DB)", errStatus:403});
        }})
        .catch((err) => { 
            refreshToken = null;
            res.status(500).send( {err:"DB error. " + err.toString()} )});
    })
    .catch((err) => { 
        refreshToken = null;
        res.status(500).send( {err:"DB error. " + err.toString()} )}
    );

    // JWT verify
    refreshToken && jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        // if (err) // 403 Forbidden. (Token in request was erroneus)
        if (err){
           console.log(" -403 (erronous token)");
            return res.status(403).send( {err:"Refresh Token is not valid (erronous token)", errStatus:403 } );
        }

        const username = user.username;
        const email = user.email;
        const userid = user.userid;
        const payload = {userid:userid, username:username, email: email};

        const accessToken = generateAccessToken(payload);
        
        const accessExpires = getExpireDateUTC();
        // res.json({ accessToken: accessToken});
        res.json({data:{ accessToken: accessToken, accessExpires: accessExpires } });
    });
});

// Delete old token --> refreshToken cannot be used anymore after this
app.delete('/auth/logout', async (req,res) => {
    console.log("app.delete('/auth/logout', ...");
    let query = "DELETE FROM "+process.env.REFRESHTOKENS_TABLE+" WHERE "+process.env.REFRESHTOKEN_COLUMN+"=?";
    await dbServices.getDb(process.env.REFRESHTOKENS_PATH, process.env.REFRESHTOKENS_TABLE)
    .then((db) => {dbServices.deleteRow(db, query, [req.body.token]);})
    .catch((err) => {res.status(500).send( {err:"DB Error. " + err.toString()} )});
    // 204 : No Content success status response code indicates that a request has succeeded, but that the client doesn't need to navigate away from its current page
    res.status(204).send({data:{msg:"RefreshToken deleted"}});
})

// Send JWTs as strings
app.post('/auth/login', async (req,res) => {
    // TODO. Authenticate User first
    console.log("app.post('/auth/login',...");
    const username = req.body.username;
    const email = req.body.email;
    const userid = req.body.userid;
    const payload = {userid:userid, username:username, email: email};
    
    const accessToken = generateAccessToken(payload);
    // No expiration for refresh token, deleting is done manually at log out
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
    
    // Insert refreshToken to DB
    const path = process.env.REFRESHTOKENS_PATH;
    const tablename = process.env.REFRESHTOKENS_TABLE;
    const insertQuery = "INSERT INTO " + tablename + "(refreshToken) VALUES(?)";
    await dbServices.getDb(path, tablename)
    .then((db) => {dbServices.insertRow(db, insertQuery, [refreshToken])})
    .catch((err) => {res.send( {err:err.toString()} )});
    console.log(" -Added refreshToken to DB.");
    
    // (if db ok) send tokens
    const accessExpires = getExpireDateUTC();
    const newTokensObject = {data:{ accessToken : accessToken, refreshToken : refreshToken, accessExpires : accessExpires }, err:""};
    res.send(newTokensObject);
});



function generateAccessToken(payload) {
    // jwt.sign(payload, secretOrPrivateKey, [options, callback]) // (Asynchronous) If a callback is supplied
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn:accessExpireTime});
};

console.log("Server listening at :4000");
app.listen(4000);