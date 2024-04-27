import "../styles/DefaultStyles.css";

import imgUser from "../assets/LoginImages/person.png";
import imgEmail from "../assets/LoginImages/email.png";
import imgPassword from "../assets/LoginImages/password.png";
// import { signUpRequest } from "../client/Requests.cjs";
import { loginRequest, signUpRequest } from "../client/Requests.mjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storageService } from "../client/Storaging.mjs";

const LoginPage = () => {
  const navigate = useNavigate();
  // const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  async function login() {
    const storage = new storageService();
    console.log("Login pressed");
    let returnObject = { data: { accessToken: "", refreshToken: "" }, err: "" };
    await loginRequest(email, password)
      .then((json) => {
        if (json.err) {
          console.log("login() -> json -> caught err: " + json.err);
          setInfoMessage(json.err.toString());
        } else {
          console.log("login() successful with tokens! Can navigate /home");
          navigate("/home");
        }
      })
      .catch((err) => {
        console.log("login() caught err: " + err.toString());
        setInfoMessage(err.toString());
      });
  }

  return (
    <>
      <div className="fixed-bg"></div>
      <div className="main-container">
        <div className="header">
          <div className="text">Login</div>
          <div className="underline"></div>
        </div>
        <div className="form-container">
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
        <div className="inner-container" key="info-message">
          <div className="text-md">{infoMessage}</div>

          <div className="submit" onClick={login}>
            login
          </div>

          <div className="help-link">
            Don't have an account?
            <span
              onClick={() => {
                navigate("/signup");
              }}
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
export default LoginPage;
