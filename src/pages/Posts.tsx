import PostCard from "./PostCard";

interface Props {
  postObjects: {
    userid: string;
    username: string;
    postid: string;
    textcontent: string;
  }[];
  removePost: (postid: string) => void;
}
const Posts = ({ postObjects, removePost }: Props) => {
  function createCard(p: {
    userid: string;
    username: string;
    postid: string;
    textcontent: string;
  }) {
    // console.log("--> 1 Postcard textContent:" + p.textcontent);
    // console.log("--> 1 Postcard postid:" + p.postid);
    return <PostCard key={p.postid} postObject={p} removePost={removePost} />;
  }
  return postObjects.map(createCard);
};

export default Posts;
