import "../styles/DefaultStyles.css";

import imgUser from "../assets/LoginImages/person.png";
import imgEmail from "../assets/LoginImages/email.png";
import imgPassword from "../assets/LoginImages/password.png";
// import { signUpRequest } from "../client/Requests.cjs";
import { loginRequest, signUpRequest } from "../client/Requests.mjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storageService } from "../client/Storaging.mjs";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  async function signup() {
    console.log("signup pressed");
    let returnObject = { data: { msg: "" }, err: "" }; // data: {msg : "info about request success"}
    let response: Awaited<Promise<PromiseLike<typeof returnObject>>> =
      await signUpRequest(username, email, password)
        .then((json) => {
          if (json.err) {
            console.log("signup got error: " + json.err);
            setInfoMessage(json.err.toString());
          } else {
            let msg = json.data.msg;
            console.log("signup got response: " + msg);
            // setInfoMessage(msg);
            navigate("/login");
          }
          return json;
        })
        .catch((e) => {
          console.log("signup caught error: " + e.toString());
          returnObject.err = e.toString();
          setInfoMessage(e.toString());
          return returnObject;
        });
  }

  return (
    <>
      <div className="fixed-bg"></div>
      <div className="main-container">
        <div className="header">
          <div className="text">Sign up</div>
          <div className="underline"></div>
        </div>
        <div className="form-container">
          <div className="input-group mb-3" key="username input">
            <div className="input-group-prepend centering">
              <span className="input-icon" id="username-icon">
                <img src={imgUser} alt="image icon username"></img>
              </span>
            </div>
            <input
              type="text"
              // className="form-control"
              placeholder="Username"
              aria-label="Username"
              aria-describedby="username"
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            ></input>
          </div>
          <div className="input-group mb-3" key="email input">
            <div className="input-group-prepend centering">
              <span className="input-icon" id="email-icon">
                <img src={imgEmail} alt="image icon username"></img>
              </span>
            </div>
            <input
              type="email"
              // className="form-control"
              placeholder="Email"
              aria-label="Email"
              aria-describedby="email"
              onChange={(event) => setEmail(event.target.value)}
            ></input>
          </div>
          <div className="input-group mb-3" key="password input">
            <div className="input-group-prepend centering">
              <span className="input-icon" id="password-icon">
                <img src={imgPassword} alt="image icon password"></img>
              </span>
            </div>
            <input
              type="password"
              // className="form-control"
              placeholder="Password"
              aria-label="Password"
              aria-describedby="password"
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            ></input>
          </div>
        </div>
        <div className="inner-container">
          <div className="submit" onClick={signup}>
            sign up
          </div>

          <div className="help-link">
            Already have an account?
            <span
              onClick={() => {
                navigate("/login");
              }}
            >
              Log in
            </span>
          </div>

          <div className="text-md">{infoMessage}</div>
        </div>
      </div>
    </>
  );
};
export default SignUpPage;
