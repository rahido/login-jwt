
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

async function assureTable(db, tablename){
    console.log("assureTable");
    let query = "CREATE TABLE IF NOT EXISTS " + tablename;
    if (tablename == process.env.REFRESHTOKENS_TABLE){
        // refreshTokens-table columns: "(refreshToken text)"
        query += process.env.REFRESHTOKEN_COLUMNS_DEFAULT;
    } 
    else if (tablename == process.env.USERS_TABLE){
        // users-table columns: "(userid text, username text, email text, hashedPassword text)"
        query += process.env.USERS_COLUMNS_DEFAULT;
    }
    else if (tablename == process.env.POSTS_TABLE){
        // posts-table columns: "(userid text, postid text, content text)"
        query += process.env.POSTS_COLUMNS_DEFAULT;
    }

    return new Promise((resolve,reject)=>{
        db.run(query,(err)=>{
            if(err){return reject(`Failed to Assure table ('${tablename}'). ` + err.toString())}
            return resolve(db);
        });
    })
}

async function getDb(path, tablename){
    console.log("getDb");

    const dbConnection = () => new Promise((resolve,reject)=>{
        let sqlDb = new sqlite3.Database(path,(err)=>{
            if(err){return reject(`Connect to DB error (${path}). ` + err.toString())}
            return resolve(sqlDb);
        })
    })

    return await dbConnection()
    .then((db) => {return assureTable(db, tablename)})
    .then((assuredDb) => {return assuredDb})
    .catch((err) => {throw new Error( err.toString())});
}

async function getRows(db, query, params){
    // let query = "SELECT * FROM " + tablename + " WHERE colname1=? OR colname2=?";
    // let params = ["col1value","col2value"];
    console.log("getRows ...");
    console.log("query: " + query);
    console.log("db: " +db);
    return new Promise((resolve,reject)=>{
        db.all(query, params, ((err,rows)=>{
            if(err){
                console.log("getRows - error: " +err.toString());
                return reject("getRows error. " + err.toString())}
            console.log("getRows - success: ");
            console.dir(rows);
            return resolve(rows);
        }));
    });
}

async function insertRow(db, insertQuery, values){
    // let insertQuery = "INSERT INTO " + tablename + "(sessionId, refreshId) VALUES(?, ?)";
    // let values = ["session-123", "refresh-123"];
    return new Promise((resolve,reject) => {
        console.log("insertRow");
        db.run(insertQuery, values, (err) => {
            if(err){ return reject("insertRow err: " + err.toString());}
            return resolve();
        });
    });
}

async function deleteRow(db, query, values){
    // let query = "DELETE FROM tablename WHERE param=?"
    // let values = ['paramValue'] (eg... WHERE email=john@email.com)
    console.log("deleteRow");
    return new Promise((resolve,reject) => {
        db.run(query, values, (err) =>{
            if(err){return reject("deleteRow err: " + err.toString());}
            return resolve();
        })
    });
}

module.exports = {
    getDb:getDb,
    getRows:getRows,
    insertRow:insertRow,
    deleteRow:deleteRow,
}