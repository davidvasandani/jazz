import { BookReview } from "@/schema";

export function BookReviewForm({ bookReview }: { bookReview: BookReview }) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm text-gray-600">
        Title
        <input
          className="rounded border border-gray-300 px-2 py-1 shadow-sm"
          type="text"
          value={bookReview.title}
          required
          onChange={(e) => (bookReview.title = e.target.value)}
        ></input>
      </label>

      <label className="grid gap-1 text-sm text-gray-600">
        Author
        <input
          className="rounded border border-gray-300 px-2 py-1 shadow-sm"
          type="text"
          value={bookReview.author}
          required
          onChange={(e) => (bookReview.author = e.target.value)}
        ></input>
      </label>

      <label className="grid gap-1 text-sm text-gray-600">
        Review
        <textarea
          className="rounded border border-gray-300 px-2 py-1 shadow-sm"
          value={bookReview.review}
          onChange={(e) => (bookReview.review = e.target.value)}
        ></textarea>
      </label>
    </div>
  );
}
