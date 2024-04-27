// DEV TESTING for if JWTs were to be stored in cookies
// - Local/session storage would be prone to cross-site scripting (XSS) attacks if not done properly
// Testing failed because:
// - localhost browser & server not being same site
// - Chrome & Mozilla rejecting/blocking 3rd party cookies from response

// SameSite
// - SameSite cookie prevents CSRF attacks
// https://web.dev/articles/samesite-cookies-explained

// Secure
// - Secure cookie is only sent to the server with an encrypted request over the HTTPS protocol
// - It's never sent with unsecured HTTP (except on localhost), which means man-in-the-middle attackers can't access it easily.
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

// HttpOnly and Domain
// - Cookie cannot be accessed by client side script (if browser supports HttpOnly)
// - the cookie is sent only when its Domain match the HTTP request
// - Cookie with HttpOnly and Domain shouldn't be able to be leaked to XSS attacks
// - if Domain is not specified, the cookie can only be read by the exact domain that has set the cookie. IF the Domain attribute is set, the cookie can also be read by sub-domains.

export function getCookie(key){
    console.log("CookieManager.mjs - getCookie: " + key);
    let cname = key + "=";
    let value = "";
    let decodedCookie = decodeURIComponent(document.cookie);
    let splitCookies = decodedCookie.split(";");
    for (let i = 0; i < splitCookies.length; i++) {
      if (splitCookies[i].trim().startsWith(cname)) {
        value = splitCookies[i].split("=")[1];
        break;
      }
    }
    return value;
};

export function setJwtCookies(accessToken, refreshToken){
    console.log("CookieManager.mjs - setJwtCookies(accessToken, refreshToken)");
    document.cookie = `accessToken=${accessToken}; SameSite=Strict; Secure; Path=/;`;
    document.cookie = `refreshToken=${refreshToken}; SameSite=Strict; Secure; Path=/;`;
    
    // document.cookie= `somecookie=wookie; Domain='127.0.0.1:3000'`;

    // OLD backup
    // document.cookie = `accessToken=${accessToken}; SameSite=Strict; Secure; Path=/; Domain='.app.localhost'`;
    // document.cookie = `refreshToken=${refreshToken}; SameSite=Strict; Secure; Path=/; Domain='.app.localhost'`;
};

export function logPrintCookies(){
  let decodedCookie = decodeURIComponent(document.cookie);
  console.log("All Cookies:" + decodedCookie);
};

export function clearAppCookies(){
  console.log("CookieManager.mjs - Clearing cookies");
    // document.cookie = `userId=; SameSite=None; Secure; path=/`;
    document.cookie = `accessToken=; SameSite=None; Secure; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `refreshToken=; SameSite=None; Secure; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  

};
