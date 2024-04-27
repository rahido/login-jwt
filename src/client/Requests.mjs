import { validateLoginFields, validateSignUpFields } from "./FieldValidations.mjs";
import { storageService } from "./Storaging.mjs";

const URL_SERVER="http://127.0.0.1:3000";
// const URL_SERVER="http://localhost:3000";
const URL_AUTH="http://127.0.0.1:4000";
const jsonRequestHeaders = {'Content-Type': 'application/json'};

function logMoreErrorInfo(e){
    // https://stackoverflow.com/questions/1901012/javascript-exception-handling-displaying-the-line-number
    try
    {console.log(e.message);
    console.log(e.stack);
    const [, lineno, colno] = e.stack.match(/(\d+):(\d+)/);
    console.log('Line:', lineno);
    console.log('Column:', colno);}
    catch{;}
}


async function assureAccessToken(){
    // Refresh AccessToken if needed
    console.log("assureAccessToken()");
    const storage = new storageService();
    return new Promise(async (resolve,reject) => {
        if (!storage.hasAccessExpired()){
            console.log("--> AccessToken still valid");
            return resolve({isValid:true, err:""});
        } else {
            console.log("--> AccessToken has been expired");
            await requestNewAccessToken()
            .then(json => {
                if (json.err){
                    console.log("--> AccessToken not valid. requestNewAccessToken returned ERR: " + json.err.toString());
                    return reject({isValid:false, err:err});
                }
                console.log("--> AccessToken created");
                return resolve({isValid:true, err:""});
            })
            .catch( (err) =>{ 
                console.log("--> AccessToken not valid. requestNewAccessToken at some point ERR: " + err.toString());
                return reject( {isValid:false, err:err.toString()}) } )
        }
    });
}

export async function signUpRequest(username, email, password){
    // TODO. check if email already registered
    console.log("signUpRequest()");

    // Always returns promise with returnObject type
    // // data: {msg : "info about request success"}
    let returnObject = { 
        data: { msg: "" }, 
        err: "",
        errStatus:0
    };

    // Validate inputs - return if invalid
    const errMsg = validateSignUpFields(username, email, password);
    if (errMsg) {
        returnObject.err = errMsg;
        return returnObject;
    }


    let url = URL_SERVER+"/users";
    let requestOptions = {
        method: 'POST',
        headers: jsonRequestHeaders,
        body: JSON.stringify({username:username, email:email, password:password})
    }
    let request = new Request(url, requestOptions);
    
    console.log("Making Request at url: " + url);
    return await makeRequest(request)
    .then(json => {
        returnObject = json;
        return returnObject})
    .catch(e => {
        returnObject.err = e.toString();
        return returnObject});
};

// Login - get JWTs
export async function loginRequest(email, password){
    console.log("loginRequest()");
    // LOGIN.
    // 1) confirm email is correct to hashed email in db
    // 2) if email ok --> Server 1 requests JWTs from server 2 
    // 3) save response JWTs to storage
    const storage = new storageService();
    // return object type
    let returnObject_jwt ={ 
        data: { accessToken : "", refreshToken : "" , accessExpires: ""},
        err: "",
        errStatus:0
    };
    // Inputs validation
    const errMsg = validateLoginFields(email, password);
    if (errMsg) {
        returnObject_jwt.err = errMsg;
        return returnObject_jwt;
    }

    // 1.1) password request options
    const url_pwd = URL_SERVER+"/users/login";
    const requestOptions_pwd = {
        method: 'POST',
        headers: jsonRequestHeaders,
        body: JSON.stringify({email:email, password:password})
    }
    const request_pwd = new Request(url_pwd, requestOptions_pwd);

    
    console.log("requestOptions_pwd.body: " + requestOptions_pwd.body);

    // 1.2) Confirm password --> if ok, 2) request and response with JWTs
    await makeRequest(request_pwd)
    .then(json => {
        if(json.err){throw new Error(json.err)}
        returnObject_jwt = json;
        // 3) Save JWTs to session storage
        if(json.data && json.data.accessToken && json.data.refreshToken && json.data.accessExpires){
            storage.setAccessToken(json.data.accessToken);
            storage.setRefreshToken(json.data.refreshToken);
            storage.setAccessExpires(json.data.accessExpires);
        } else {
            console.log("loginRequest - got json, but not all data inside ! \n--> err. Tokens are not saved");
            throw new Error("loginRequest - got json, but not all data inside ! --> Error. Tokens won't be saved");
        }
        return returnObject_jwt;
    })
    .catch((err) => {
        console.log("await makeRequest(request_jwt) caught error, " + err.toString());
        returnObject_jwt.err = err.toString();
        return returnObject_jwt;
    });
    // return default object --> for loginPage return type not to include 'undefined'
    return returnObject_jwt;
};

export async function logoutRequest(){
    console.log("logoutRequest()");
    
    const storage = new storageService();

    let returnObject = {data:{}, err:""}

    const url = URL_AUTH + '/auth/logout';
    const reqOptions = {
        method: 'DELETE',
        headers: {
            'Content-type':'application/json'
        },
        body: JSON.stringify({ token : storage.getRefreshToken() })
    }
    const req = new Request(url,reqOptions);
    await fetch(req)
    .then(json => {
        if(json.err){throw new Error(json.err)}
        return json;
    })
    .catch(err => {throw new Error("logout->makeRequest-> " + err.toString())});

}

export async function requestUserPosts(){
    console.log("requestUserPosts()");
    const storage = new storageService();

    // Refresh AccessToken if needed
    if (storage.hasAccessExpired()){
        await requestNewAccessToken()
        .then(json => {
            if (json.err){
                throw new Error(json.err);
            }
            return;
        })
        .catch((err) =>{ throw new Error(err)})
    }

    const accessToken = storage.getAccessToken();

    let userPostsReturnObject = {data:{posts:[]}, err:"", errStatus:0};

    const auth = "Bearer " + accessToken;
    const url = URL_SERVER + "/posts";
    const requestOptions = {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization':auth},
    }

    const req = new Request(url, requestOptions);

    await makeRequest(req)
    .then((json) =>{
        if(json.errStatus){
            // If 403 - token expired. Need to request new accessToken and redo this request
            if (json.errStatus === 403){
                console.log("requestUserPosts - 403. Token expired. Need to request new AccessToken");
            }
            else {
                console.log("requestUserPosts - error (other than 403): " + json.errStatus.toString());
            }
        }
        userPostsReturnObject = json;
        // return userPostsReturnObject;
    })
    .catch((err) => {
        userPostsReturnObject.err=err; 
        // return userPostsReturnObject
    });

  
    return userPostsReturnObject;
}

export async function requestSavePost(newPostContent){
    console.log("requestSavePost()");
    // return type
    let userPostsReturnObject = {data:{}, err:"", errStatus:0};

    await assureAccessToken()
    .catch( (err) =>{
        console.log("assureAccessToken returned err");
        userPostsReturnObject.err = err.toString();
        return userPostsReturnObject;}
    )
    .then(async () => {

        const storage = new storageService();
        const url = URL_SERVER + "/posts";
        const auth = "Bearer " + storage.getAccessToken();
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type' : 'application/json', 'Authorization' : auth},
            body: JSON.stringify({ textcontent: newPostContent })
        }
        const req = new Request(url, requestOptions);
        await makeRequest(req)
        .then((json) => {
            console.log("requestSavePost returned json");
            userPostsReturnObject = json;
             })
        .catch((err) => {
            console.log("requestSavePost returned err");
            userPostsReturnObject.err = err.toString();
        })
    })
    .catch((err) => {
        userPostsReturnObject.err = err.toString();
        return userPostsReturnObject;
    });
    return userPostsReturnObject;
}
export async function requestRemovePost(postid){
    console.log("requestRemovePost() --> postid: " + postid);
    // return type
    let returnObject = {data:{msg:""}, err:"", errStatus:0};

    await assureAccessToken()
    .catch( (err) =>{
        console.log("assureAccessToken returned err");
        returnObject.err = err.toString();
        return returnObject;}
    )
    
    const storage = new storageService();
    const auth = "Bearer " + storage.getAccessToken();
    const url = URL_SERVER + "/posts";
    const requestOptions = {
        method : 'DELETE',
        headers: {'Content-Type' : 'application/json', 'Authorization' : auth},
        body: JSON.stringify({postid:postid})
    };
    const req = new Request(url, requestOptions)
    
    await fetch(req)
    .then((res) => {
        // if res.status(204) --> return {msg:"success"}
        // else --> internal server error with err -msg
        if (res.status == 204){
            return {data:{msg:"Post removed"}}
        } else{ return res.json()}
    })
    .then((json) => {
        // json = {data:{msg:"Post removed"}} | {err:""}
        returnObject = json;
        return returnObject;
    })
    .catch((err) => {
        logMoreErrorInfo(err);
        returnObject.err = err.toString();
        return returnObject;
    });
    return returnObject;
}

export async function requestNewAccessToken(){
    console.log("requestNewAccessToken()")
    let returnObject = {data:{accessToken:""}, err:"", errStatus:0};


    const storage = new storageService();

    let url = URL_AUTH + "/token";
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-type':'application/json'
        },
        body: JSON.stringify( {token: storage.getRefreshToken()} )
    };
    const req = new Request(url, requestOptions);

    await makeRequest(req)
    .then((json)=>{
        // json = {data:{ accessToken: accessToken, accessExpires: accessExpires } } | {err:"", errStatus:0}
        if(json.err){ 
            console.log("--> json.err: " + json.err.toString());
            throw new Error(json.err);}
        if(json.data && json.data.accessToken && json.data.accessExpires){
            console.log("New AccessToken - Expires: " +json.data.accessExpires);
            storage.setAccessToken(json.data.accessToken);
            storage.setAccessExpires(json.data.accessExpires);
        }else{
            console.log("--> got json, but not all data inside! --> Error");
            throw new Error("--> got json, but not all data inside! --> Error");
        }
        returnObject=json;
    })
    .catch((e)=>{
        console.log("requestNewAccessToken caught e: " + e.toString());
        returnObject.err = e.toString();
    });

    return returnObject;
};

async function makeRequest(req){
    // PARAMS. req : Request(url, options)
    // RETURNS. typeof returnObject
    let returnObject = {data:{}, err:"", errStatus:0};
    let errStatus = 0;
    let errMsg = "";
    return await fetch(req)
    .then((response) => {
        if(!response.ok) { // ok status 200-299
            console.log("!response.ok");
            // If status not ok, add status info to .err -message
            errMsg = response.status.toString() + " " + response.statusText + ". ";
            errStatus = response.status;
            // console.log(" --> adding errMsg from response.status: " + errMsg);
        }
        return response.json()})
    .then(json => {
        // json can include both or either data:{} & err:"".
        if(json.data)
            returnObject.data = json.data;
        if(json.err)
            returnObject.err = json.err;
        if(errMsg){
            // If status error
            returnObject.err = returnObject.err? errMsg + returnObject.err: errMsg;
            returnObject.errStatus = errStatus;
        }
        return (returnObject);
    })
    .catch(e => {
        console.log("makeRequest() error: " + e.toString());
        returnObject.err = "makeRequest() - " + e.toString();
        return (returnObject);
    });
};

