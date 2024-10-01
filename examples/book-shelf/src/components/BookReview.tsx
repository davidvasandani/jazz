"use client";

import { BookReview } from "../schema";
import { ID } from "jazz-tools";
import { useCoState } from "@/components/JazzAndAuth";
import Link from "next/link";

export function BookReviewComponent({ id }: { id: ID<BookReview> }) {
  const bookReview = useCoState(BookReview, id);

  console.log("book review component", bookReview);

  if (!bookReview) return <></>;

  return (
    <Link href={`/book/${bookReview.id}`} className="border p-3">
      <h2>{bookReview.title}</h2>
      <p>by {bookReview.author}</p>
      {bookReview.review && <p>{bookReview.review}</p>}
      <p>Rating: {bookReview.rating}</p>
    </Link>
  );
}
