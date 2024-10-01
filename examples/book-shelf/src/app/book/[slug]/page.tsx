"use client";

import { useCoState } from "@/components/JazzAndAuth";
import { BookReview } from "@/schema";
import { Account, ID } from "jazz-tools";
import { BookReviewHeader } from "@/components/BookReviewHeader";
import Button from "@/components/Button";
import { BookReviewForm } from "@/components/BookReviewForm";

const BookReviewReview = ({ bookReview }: { bookReview: BookReview }) =>
  bookReview.review && (
    <p className="text-sm leading-relaxed text-gray-600">{bookReview.review}</p>
  );

export default function Page({ params }: { params: { slug: string } }) {
  const bookReview = useCoState(BookReview, params.slug as ID<BookReview>);

  if (!bookReview) return <></>;

  return (
    <div className="grid max-w-lg gap-12">
      <BookReviewHeader bookReview={bookReview} />

      {(bookReview._owner as Account).isMe ? (
        <BookReviewForm bookReview={bookReview}></BookReviewForm>
      ) : (
        <BookReviewReview bookReview={bookReview} />
      )}
    </div>
  );
}
