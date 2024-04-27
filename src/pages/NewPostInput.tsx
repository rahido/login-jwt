import { SyntheticEvent } from "react";

interface Props {
  handleInputChange: (event: SyntheticEvent) => void;
  savePost: () => void;
}

const NewPostInput = ({ handleInputChange, savePost }: Props) => {
  return (
    <>
      {/* <div className="form-group"> */}
      <textarea
        className="form-control"
        id="NewPostInput"
        rows={3}
        placeholder="I think that.."
        onChange={handleInputChange}
      ></textarea>
      {/* </div> */}
      <div className="submit-sm flex-end" onClick={savePost}>
        Post!
      </div>
    </>
  );
};

export default NewPostInput;
