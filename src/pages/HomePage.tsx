import { SyntheticEvent, useEffect, useState } from "react";
import "../styles/DefaultStyles.css";
import {
  logoutRequest,
  requestRemovePost,
  requestSavePost,
  requestUserPosts,
} from "../client/Requests.mjs";

import { storageService } from "../client/Storaging.mjs";
import { useNavigate } from "react-router-dom";

import NewPostInput from "./NewPostInput";
import Posts from "./Posts";

const HomePage = () => {
  const storage = new storageService();
  const navigate = useNavigate();

  async function logout() {
    console.log("logout");
    // Remove refreshToken from server DB. // Clear sessionStorage // Navigate to Landing page
    await logoutRequest()
      .then((json) => {
        storage.clear();
        navigate("/");
      })
      .catch((err) => {
        updateInfoMsg(err.toString());
      });
  }

  async function updatePosts(clearInfoMsg: Boolean) {
    // returns typeof userPostsReturnObject = {data:{posts:[]},err:"",errStatus=0};
    // updateInfoMsg("Fetching posts..");
    let contentJson = { data: { posts: [] }, err: "", errStatus: 0 };
    // Fetch posts
    await requestUserPosts()
      .then(async (json) => {
        contentJson = json;
        if (json.err) {
          // Note. 403 --> accessToken expired
          throw new Error(json.err);
        }
        // Set posts
        if (contentJson.data.posts.length == 0) {
          if (clearInfoMsg) {
            updateInfoMsg("User hasn't made any posts");
          }
          setPostObjects([]);
        } else {
          if (clearInfoMsg) {
            updateInfoMsg("");
          }
          setPostObjects(json.data.posts.reverse());
        }
        return;
      })
      .catch((e) => {
        console.log("updatePosts() - request Caught error " + e.toString());
        updateInfoMsg("updatePosts() - request Caught error " + e.toString());
        return;
      });
  }
  function handleInputChange(event: SyntheticEvent) {
    // event.target.value is not defined in each type of SyntheticEvent, need to cast
    // https://stackoverflow.com/questions/44321326/property-value-does-not-exist-on-type-eventtarget-in-typescript
    if (event.target instanceof HTMLTextAreaElement) {
      var target: HTMLTextAreaElement = event.target as HTMLTextAreaElement;
      setNewPostValue(target.value);
    }
  }
  async function savePost() {
    if (newPostValue.length == 0) {
      updateInfoMsg("Add content to post first");
      return;
    }
    await requestSavePost(newPostValue)
      .then((json) => {
        if (json.err) {
          updateInfoMsg("Save Post err -->" + json.err.toString());
          return;
        }
        updateInfoMsg("Posted!");
        updatePosts(false);
      })
      .catch((err) => {
        updateInfoMsg("Save Post err -->" + err.toString());
      });
  }

  function removePost(postid: string) {
    requestRemovePost(postid)
      .then((json) => {
        if (json.err) {
          updateInfoMsg(json.err);
        } else {
          if (json.data && json.data.msg) {
            updateInfoMsg(json.data.msg);
            updatePosts(false);
          }
        }
      })
      .catch((err) => {
        updateInfoMsg(err.toString());
      });
  }

  function updateInfoMsg(toText: string) {
    // console.log("updateInfoMsg to: " + toText);
    setInfoMsg(toText);
  }

  useEffect(() => {
    console.log("Run useEffect on startup");
    updatePosts(false);
  }, []);

  const [infoMsg, setInfoMsg] = useState("");
  const [newPostValue, setNewPostValue] = useState("");
  const [postObjects, setPostObjects] = useState([]);

  return (
    <>
      <div className="fixed-bg"></div>
      <div className="main-container">
        <div className="header">
          <div className="text">Home Page</div>
          <div className="underline"></div>
        </div>
        <div className="inner-container w90">
          <div className="submit" onClick={logout}>
            Logout
          </div>
          <div className="text-md" id="infoMsg">
            {infoMsg}
          </div>
          <NewPostInput
            handleInputChange={handleInputChange}
            savePost={savePost}
          />
        </div>
        <Posts postObjects={postObjects} removePost={removePost} />
      </div>
    </>
  );
};
export default HomePage;
