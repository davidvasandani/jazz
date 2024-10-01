"use client";

import { useAccount } from "@/components/JazzAndAuth";
import Link from "next/link";

export function Nav() {
  const { me, logOut } = useAccount();
  return (
    <nav className="mx-auto mb-8 flex max-w-4xl justify-between gap-4 border-b py-3">
      <Link href="/">Jazz Book Shelf</Link>
      <div className="flex items-center gap-2 text-sm">
        <p>{me?.profile?.name}</p> · <button onClick={logOut}>Log out</button>
      </div>
    </nav>
  );
}
