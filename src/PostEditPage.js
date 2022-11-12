import { request } from "./api.js";
import Editor from "./Editor.js";
import { getItem, setItem } from "./storage.js";

export default function PostEditPage({ $target, initialState, listUpdate }) {
  const $page = document.createElement("div");

  this.state = initialState;

  let postLocalSaveKey = `temp-post-${this.state.postId}`;

  const post = getItem(postLocalSaveKey, {
    title: "",
    content: "",
  });

  let timer = null;
  const editor = new Editor({
    $target,
    initialState: post,
    onEditing: (post) => {
      if (timer !== null) {
        clearTimeout(timer);
      }

      timer = setTimeout(async () => {
        setItem(postLocalSaveKey, {
          ...post,
          tempSaveDate: new Date(),
        });

        //나중에 함수로 빼기
        const isNew = this.state.postId === "new";
        if (isNew) {
          const newPost = await request(`/documents`, {
            method: "POST",
            body: JSON.stringify(post),
          });

          history.replaceState(null, null, `/documents/${newPost.id}`);

          this.setState({
            postId: newPost.id,
          });
        } else {
          await request(`/documents/${post.id}`, {
            method: "PUT",
            body: JSON.stringify(post),
          });
        }
        listUpdate();
      }, 1000);
    },
  });

  this.setState = async (nextState) => {
    if (this.state.postId !== nextState.postId) {
      postLocalSaveKey = `temp-post-${nextState.postId}`;
      this.state = nextState;
      if (this.state.postId === "new") {
        const post = getItem(postLocalSaveKey, {
          title: "",
          content: "",
        });

        this.render();
        editor.setState(post);
      } else {
        //서버에서 값을 가져오는 함수 실행
        await fetchPost();
      }
      return;
    }

    this.state = nextState;
    this.render();

    editor.setState(
      this.state.post || {
        title: "",
        content: "",
      }
    );
  };

  const fetchPost = async () => {
    const { postId } = this.state;
    if (postId !== "new") {
      const post = await request(`/documents/${postId}`);

      this.setState({
        ...this.state,
        post,
      });
    }
  };

  this.render = () => {
    $target.appendChild($page);
  };
}