const ssstorage = window.sessionStorage;

export class storageService {
    constructor() {
        if (typeof(window.sessionStorage) == "undefined"){
            console.log("sessionStorage is undefined in this browser!");
            throw new Error("sessionStorage is undefined in this browser!");
        }
        this.storage = window.sessionStorage;
    }
    setAccessToken(token){
        this.storage.setItem('accessToken',token);
    }
    getAccessToken() {
        return this.storage.getItem('accessToken');
    }
    setAccessExpires(accessExpires){
        // expireExample = new Date( d.getTime() + sessionDuration ).toUTCString();
        this.storage.setItem('accessExpires',accessExpires);
    }
    getAccessExpires(){
        return this.storage.getItem('accessExpires');
    }
    hasAccessExpired(){
        const expUTC = this.getAccessExpires();
        if (!expUTC){return true}
        let accessExpires = new Date(expUTC);

        let d = new Date().toUTCString();
        let dateNow = new Date(d); // UTC date now

        if(accessExpires.getTime() < dateNow.getTime()){
            return true
        }
        return false
    }
    setRefreshToken(token){
        console.log("storageService - setRefreshToken(token)");
        this.storage.setItem('refreshToken',token);
    }
    getRefreshToken() {
        return this.storage.getItem('refreshToken');
    }
    clear(){
        this.storage.clear();
    }
}

