import { useCallback, useMemo, useState, useEffect} from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { api } from "../utils/api";
import { useSession } from "next-auth/react";
import Image from "next/image";

export const StandardDropzone = () => {
  const { data: sessionData } = useSession();
  
  const [putUrl, setPutUrl] = useState<string | null>(null);
  const { mutateAsync: createObject } = api.s3.createObject.useMutation();
  const { mutateAsync: fetchPresignedUrls } =
    api.s3.getStandardUploadPresignedUrl.useMutation();
  const { mutateAsync: deleteObject } = api.s3.deleteObjects.useMutation();
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [view, setView] = useState(true);
  const [inputValue, setInputValue] = useState("");
  //const [visible,SetVisible] = useState(true);
  const [deleteUrl, setDeleteUrl] = useState("");
  const { data: posts, refetch: refetchPost } = api.post.getAll.useQuery(
    undefined,
    {
      enabled: sessionData?.user != undefined,
    },
  );
  const { mutate } = api.post.create.useMutation();
  const deletePostPrisma = api.post.delete.useMutation();
  const [selectedPost, setSelectedPost] = useState("");

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      maxFiles: 1,
      maxSize: 5 * 2 ** 30, // roughly 5GB
      accept: {
        "image/jpeg": [".jpeg", ".png"],
      },
      onDropAccepted: (files, _event) => {
        const file = files[0]! as File;
        createObject({
          key: file.name,
        })
          .then((url) => {
            setPutUrl(url);
            setSubmitDisabled(false);
          })
          .catch((err) => console.error(err));        
      },
    });

  const files = useMemo(() => {
    if (!submitDisabled)
      return acceptedFiles.map((file) => (
        <li key={file.name}>
          {file.name} - {file.size} mb
          <input
            type="text"
            placeholder="caption"
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            className="input input-bordered w-full max-w-xs text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                //mutate({ description: inputValue, content: file.name, });
              }
            }}
          />
        </li>
      ));
    return null;
  }, [acceptedFiles, submitDisabled]);

  const handleSubmit = async () => {
    if (acceptedFiles.length > 0 && putUrl !== null) {
      const file = acceptedFiles[0]!;
      
      await fetchPresignedUrls({
        key: file.name,
      })
        .then((url) => {
          mutate({ description: inputValue, content: file.name, presignedurl: url});
          console.log(url);
          setSubmitDisabled(false);
        }) 
        .catch((err) => console.error(err));

      await axios
        .put(putUrl, file.slice(), {
          headers: { "Content-Type": file.type },
        })
        .then((response) => {
          
          console.log("Successfully uploaded ", file.name, " to prisma");
          console.log(response);
          console.log("Successfully uploaded ", file.name);
        })
        .catch((err) => console.error(err));
      setSubmitDisabled(true);
    }
  };
  const handleDelete = async (postId: string) => {
    deleteObject({
      key: selectedPost,
    })
      .then((url) => {
        setDeleteUrl(url);
      })
      .catch((err) => console.error(err));

    await axios
      .delete(deleteUrl, {
        headers: { "Content-Type": "jpg/png" },
      })
      .then((response) => {
        deletePostPrisma.mutate({ id: postId });
        console.log(response);
      })
      .catch((err) => console.error(err));
  };

  const cancelSubmit = () => {
    setSubmitDisabled(true);
    setPutUrl(null);
  };

  /*
  const handleDeleteClick = (fileName: string) => {
    setDeletePost(fileName);
  }
  */
 const handleClose = () => {
  setView(false);
 }
 const handleImageOpen = () => {
  setView(true);
 }
  return (
    <section>
      <div className="mt-10 flex flex-col items-center">
        <div className="p-10">
          <div
            {...getRootProps()}
            className=" box-border flex border border-neutral-200 p-16"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex h-full items-center justify-center font-semibold">
                <p>Drop the file here...</p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center font-semibold">
                <p>Drag n drop file here, or click to select files</p>
              </div>
            )}
          </div>
          <aside className="my-2">
          <ul>{files}</ul>
        </aside>
          <div className="flex justify-between">
            <button
              onClick={() => void handleSubmit()}
              disabled={acceptedFiles.length === 0}
              className=""
            >
              Upload
            </button>
            <button
              onClick={() => void cancelSubmit()}
              disabled={submitDisabled == true || acceptedFiles.length === 0}
              className=""
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        <div className="mx-2 my-2 flex flex-wrap">
          {posts ? (
            posts?.map((post) => (
              <div key={post.id} className="px-2">
                <div className="card my-2 w-80 bg-base-100 shadow-xl">
                  <div
                    className="card-body"
                    onClick={() => {
                      setSelectedPost(post.content);
                      console.log(post.content)
                    }}
                  >
                    <h2 className="card-title" onClick={handleImageOpen}>{post.content}</h2>
                    {view  && (                 
                      <div>
                        <button
                          onClick={
                            handleClose
                          }
                          className="btn btn-square btn-outline"
                        >
                          hide
                        </button>
                        <Image
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          src={post.presignedurl}
                          alt={post.content}
                          width={400}
                          height={300}
                        />
                        Caption: {post.description}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="focus:shadow-outline-red rounded-md border border-red-500 bg-red-500 px-4 py-2 text-white hover:bg-red-600 
                focus:border-red-600 focus:outline-none active:bg-red-700 flex justify-center"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </section>
  );
};
