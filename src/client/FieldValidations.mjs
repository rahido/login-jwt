
// https://www.freecodecamp.org/news/practical-regex-guide-with-real-life-examples/
// Regex cheat sheet
// /g --> Match all occurrences. Without it, finds the first match.
// /m --> multi-line matching
// Word characters: \w. ( [a-zA-Z0-9_] )
// Non-word characters: \W. ( or [^\w])
// Digits: \d. ( [0-9] )
// Non-digits: \D. ( [^\d] )
// Space, tab, newlines: \s. ( [ \t\r\n\f ] )
// Non-whitespace characters: \S. ( [^\s] )
// Quantifier: * --> 0 or more
// Quantifier: + --> 1 or more
// /^ --> start of line
// $/ --> end of line
// *[something] --> lookaheads

export function validateSignUpFields(username, email, password){

    const nameErr = validateUsername(username);
    if(nameErr){return nameErr;};
    const emailErr = validateEmail(email);
    if(emailErr){return emailErr;};
    const passwordErr = validatePassword(password);
    if(passwordErr){return passwordErr;};

    return "";
}

export function validateLoginFields(email,password){
    const emailErr = validateEmail(email);
    if(emailErr){
        return emailErr;
    }
    if(password.length < 4){
        return "invalid Password";
    }
    return "";
}

export function validateUsername(username){
    // letters & numbers are ok
    const re = /^([a-zA-Z0-9_]).{1,25}$/gm; // Word characters
    const valid = re.test(username);
    if (!valid) {
        if(username.length<2){return "Invalid Username. Length should be 2-24 characters"}
        return "Invalid Username. Use letters and numbers.";
    }
    return "";
}

export function validatePassword(password){
    // Validity: 1 lower and 1 upper case letter, 1 digit, length between 4-16, doesn't include "1234" or "pass"
    // (start of line) (>0 lower case letters) (>0 upper case letters) (>0 digits) (no "1234"|"pass") (min,max length) (end of line)
    return "";
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?!.*(1234|pass)).{3,17}$/gm;
    const valid = re.test(password);
    if (!valid){
        if(password.includes("1234")){return "Invalid Password. (Using '1234' is not allowed).";};
        if(password.includes("pass")){return "Invalid Password. (Using 'pass' is not allowed).";};
        if(password.length<4 | password.length>16){return "Invalid Password. Length should be between 4-16 characters.";};
        return "Invalid Password. Must include 1 lower and 1 upper case character and 1 number.";
    }
    return "";
}

export function validateEmail(email){
    // Valid form: something@something.com
    // (start of line) (non @ non space)+ (@) (non @ non . )+ (.) (word char)+ (end of line)
    const re = /^[^@ ]+@[^@.]+\.[\w]+$/gm;
    const valid = re.test(email);
    if (!valid){
        return "Invalid email."
    }
    return "";
}