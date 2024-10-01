"use client";

import { useState } from "react";
import { BookReview } from "@/schema";
import { useAccount } from "@/components/JazzAndAuth";
import { useRouter } from "next/navigation";

export default function AddBookReview() {
  const { me } = useAccount();
  // const [bookReview, setBookReview] = useState<BookReview>();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [review, setReview] = useState("");

  const router = useRouter();

  const addBookReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const bookReview = BookReview.create(
      {
        title,
        author,
        review,
      },
      {
        owner: me,
      },
    );

    console.log({ bookReview });

    me?.root?.bookReviews?.push(bookReview);

    router.push("/");
  };

  return (
    <div className="grid max-w-lg gap-8">
      <h1 className="text-lg font-semibold text-black">Add Book Review</h1>
      <form action="" className="grid gap-4" onSubmit={addBookReview}>
        <label className="grid gap-1 text-sm text-gray-600">
          Title
          <input
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            type="text"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
          ></input>
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          Author
          <input
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            type="text"
            value={author}
            required
            onChange={(e) => setAuthor(e.target.value)}
          ></input>
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          Review
          <textarea
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          ></textarea>
        </label>
        <button className="rounded bg-black p-2 text-white" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}
