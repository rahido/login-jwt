interface Props {
  postObject: {
    userid: string;
    username: string;
    postid: string;
    textcontent: string;
  };
  removePost: (postid: string) => void;
}

const PostCard = ({ postObject, removePost }: Props) => {
  return (
    <div className="card w90">
      {/* <img className="card-img-top" src="..." alt="Card image cap"> */}
      <div className="card-body">
        <div className="inner-container flexrow">
          <h5 className="card-title ">{postObject.username}</h5>
          <div
            className="btn btn-secondary btn-sm abs-right"
            onClick={() => {
              removePost(postObject.postid);
            }}
          >
            X
          </div>
        </div>
        <p className="card-text">{postObject.textcontent}</p>
      </div>
    </div>
  );
};
export default PostCard;
