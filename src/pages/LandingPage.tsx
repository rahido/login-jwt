import { useNavigate } from "react-router-dom";
import "../styles/DefaultStyles.css";

const LandingPage = () => {
  const navigate = useNavigate();

  function goToHome() {
    console.log("goToHome");
    navigate("/home");
  }
  function goToLogin() {
    console.log("GoToLogin");
    navigate("/login");
  }

  return (
    <>
      <div className="fixed-bg"></div>
      <div className="main-container">
        <div className="header">
          <div className="text">Landing Page</div>
          <div className="underline"></div>
        </div>
        <div className="inner-container w90">
          <div className="text-sm">
            Info.
            <br />
            Authorization uses JWTs, stored in SessionStorage. <br />
            <br />
            User requests are handled in (:3000), JWTs in (:4000).
            <br />
            <br />
            Signed in User can create & delete posts in /home.
            <br />
            <br />
            AccessToken expires in 20s. Check dev tools to see refreshing during
            User action.
            <br />
            <br />
            RefreshToken is deleted from DB manually when User logs out.
            <br />
            <br />
          </div>
          <div className="submit" onClick={goToHome}>
            Homepage
          </div>
          <div className="submit" onClick={goToLogin}>
            Login
          </div>
        </div>
      </div>
    </>
  );
};
export default LandingPage;
