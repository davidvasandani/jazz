"use client";

import Image from "next/image";
import Link from "next/link";
import { ListOfBookReviews } from "@/schema";
import { useAccount, useCoState } from "@/components/JazzAndAuth";
import { BookReviewComponent } from "@/components/BookReview";

export default function Home() {
  const { me } = useAccount({
    root: { bookReviews: [{}] },
  });
  //
  // console.log("me", me.root?._refs.bookReviews?.id);
  //
  // const bookReviews = useCoState(
  //   ListOfBookReviews,
  //   me.root?._refs.bookReviews?.id,
  //   {},
  // );

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Link className="rounded bg-black p-2 text-white" href="/add">
          Add book
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {me?.root?.bookReviews?.map((bookReview) => (
          <BookReviewComponent key={bookReview.id} id={bookReview.id} />
        ))}
      </div>
    </div>
  );
}
