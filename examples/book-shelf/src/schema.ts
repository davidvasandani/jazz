import { CoMap, co, CoList, Account, Profile, Group } from "jazz-tools";

export class BookReview extends CoMap {
  title = co.string;
  author = co.string;
  dateRead? = co.number;
  rating? = co.literal(1, 2, 3, 4, 5);
  review? = co.string;
}

export class ListOfBookReviews extends CoList.Of(co.ref(BookReview)) {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class AccountRoot extends CoMap {
  bookReviews = co.ref(ListOfBookReviews);
}

export class JazzAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(AccountRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    const group = Group.create({ owner: this });
    group.addMember("everyone", "reader");

    if (!this._refs.root) {
      this.root = AccountRoot.create(
        {
          bookReviews: ListOfBookReviews.create([], { owner: group }),
        },
        { owner: group },
      );
    }
  }
}
