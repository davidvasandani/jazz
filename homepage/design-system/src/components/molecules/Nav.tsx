"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { BreadCrumb } from "./Breadcrumb";
import clsx from "clsx";

export function Nav({
  mainLogo,
  items,
  docNav,
}: {
  mainLogo: ReactNode;
  items: {
    href: string;
    icon?: ReactNode;
    title: string;
    firstOnRight?: boolean;
    newTab?: boolean;
  }[];
  docNav: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    searchOpen && searchRef.current?.focus();
  }, [searchOpen]);

  const pathname = usePathname();

  return (
    <>
      <nav
        className={clsx(
          // "hidden md:flex sticky left-0 right-0 top-0 max-sm:bottom-0 w-full justify-center",
          // "bg-stone-50 dark:bg-stone-950 border-b max-sm:border-t border-stone-50 dark:border-b-stone-950",
          // "max-h-none overflow-hidden transition[max-height] duration-300 ease-in-out",
          // "z-50",
          "hidden sticky inset-x-0 top-0 max-sm:bottom-0 w-full",
          "md:flex justify-center",
          "bg-canvas border-b border-stone-50 max-sm:border-t",
          "max-h-none overflow-hidden",
          "transition[max-height] duration-300 ease-in-out",
          "z-50",
          menuOpen ? "h-[100dvh]" : "h-16",
        )}
      >
        <div className="flex flex-wrap px-8 items-center max-sm:justify-between lg:gap-2 max-w-[80rem] w-full">
          <div className="flex items-center flex-shrink">
            <NavLinkLogo prominent href="/" className="-ml-2">
              {mainLogo}
            </NavLinkLogo>
          </div>
          {items.map((item, i) =>
            "icon" in item ? (
              <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                {item.icon}
              </NavLinkLogo>
            ) : (
              <NavLink
                key={i}
                href={item.href}
                newTab={item.newTab}
                className={clsx(
                  "max-sm:w-full",
                  item.firstOnRight ? "md:ml-auto" : "",
                )}
              >
                {item.title}
              </NavLink>
            ),
          )}
        </div>
      </nav>
      <div className="flex items-center self-stretch px-4 md:hidden dark:text-white">
        <NavLinkLogo prominent href="/" className="mr-auto">
          {mainLogo}
        </NavLinkLogo>
        <button
          className="flex items-center p-3 rounded-xl"
          onMouseDown={() => {
            setMenuOpen((o) => !o);
            setSearchOpen(false);
          }}
        >
          <MenuIcon className="mr-2" />
          <BreadCrumb items={items} />
        </button>
      </div>
      <div
        onClick={() => {
          setMenuOpen(false);
          setSearchOpen(false);
        }}
        className={clsx(
          menuOpen || searchOpen ? "block" : "hidden",
          "fixed top-0 bottom-0 left-0 right-0 bg-stone-200/80 dark:bg-black/80 w-full h-full z-20",
        )}
      ></div>
      <nav
        className={clsx(
          "md:hidden fixed flex flex-col bottom-4 right-4 z-50",
          "bg-stone-50 dark:bg-stone-925 dark:text-white border border-stone-100 dark:border-stone-900 dark:outline dark:outline-1 dark:outline-black/60 rounded-lg shadow-lg",
          menuOpen || searchOpen ? "left-4" : "",
        )}
      >
        <div className={clsx(menuOpen ? "block" : "hidden", " px-2 pb-2")}>
          <div className="flex items-center w-full border-b border-stone-100 dark:border-stone-900">
            <NavLinkLogo
              prominent
              href="/"
              className="mr-auto"
              onClick={() => setMenuOpen(false)}
            >
              {mainLogo}
            </NavLinkLogo>
            {items
              .filter((item) => "icon" in item)
              .map((item, i) => (
                <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                  {item.icon}
                </NavLinkLogo>
              ))}
          </div>

          {pathname === "/docs" && (
            <div className="max-h-[calc(100dvh-15rem)] p-4 border-b border-stone-100 dark:border-stone-900 overflow-x-auto prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
              {docNav}
            </div>
          )}

          <div className="flex justify-end gap-4 -mb-2">
            {items
              .filter((item) => !("icon" in item))
              .slice(0, 3)
              .map((item, i) => (
                <>
                  <NavLink
                    key={i}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    newTab={item.newTab}
                  >
                    {item.title}
                  </NavLink>
                </>
              ))}
          </div>

          <div className="flex justify-end gap-4 border-b border-stone-100 dark:border-stone-900">
            {items
              .filter((item) => !("icon" in item))
              .slice(3)
              .map((item, i) => (
                <NavLink
                  key={i}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  newTab={item.newTab}
                  className={clsx("")}
                >
                  {item.title}
                </NavLink>
              ))}
          </div>
        </div>
        <div className="flex items-center self-stretch justify-end">
          {/* <input
                        type="text"
                        className={clsx(
                            menuOpen || searchOpen ? "" : "hidden",
                            "ml-2 border border-stone-200 dark:border-stone-900 px-2 py-1 rounded w-full"
                        )}
                        placeholder="Search docs..."
                        ref={searchRef}
                    /> */}
          {/* <button
                        className="flex p-3 rounded-xl"
                        onClick={() => {
                            setSearchOpen(true);
                        }}
                        onBlur={(e) => {
                            if (!e.currentTarget.value) {
                                setSearchOpen(false);
                            }
                        }}
                    >
                        <SearchIcon className="" />
                    </button> */}
          <button
            className="flex items-center p-3 rounded-xl"
            onMouseDown={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
          >
            {menuOpen || searchOpen ? (
              <XIcon />
            ) : (
              <>
                <MenuIcon className="mr-2" />
                <BreadCrumb items={items} />
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

export function NavLink({
  href,
  className,
  children,
  onClick,
  newTab,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  newTab?: boolean;
}) {
  const path = usePathname();

  return (
    <Link
      href={href}
      className={clsx(
        "px-2 lg:px-4 py-3 text-sm",
        className,
        path === href
          ? "font-medium text-black dark:text-white cursor-default"
          : "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
      {newTab ? (
        <span className="inline-block text-stone-300 dark:text-stone-700 relative -top-0.5 -left-0.5 -mr-2">
          ⌝
        </span>
      ) : (
        ""
      )}
    </Link>
  );
}

export function NavLinkLogo({
  href,
  className,
  children,
  prominent,
  onClick,
  newTab,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  prominent?: boolean;
  onClick?: () => void;
  newTab?: boolean;
}) {
  const path = usePathname();

  return (
    <Link
      href={href}
      className={clsx(
        "max-sm:px-4 px-2 lg:px-3 py-3 transition-opacity hover:transition-none",
        path === href
          ? "cursor-default"
          : prominent
            ? "hover:opacity-50"
            : "opacity-60 hover:opacity-100",
        "text-black dark:text-white",
        className,
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}

// export function NewsletterButton() {
//     return (
//         <button
//             onClick={() =>
//                 (window as any).ml_account(
//                     "webforms",
//                     "5744530",
//                     "p5o0j8",
//                     "show",
//                 )
//             }
//             className="flex items-center gap-2 px-2 py-1 text-black rounded bg-stone-300 hover:bg-stone-200 dark:bg-stone-950 dark:hover:bg-stone-800 dark:text-white"
//         >
//             <MailIcon className="" size="14" /> Subscribe
//         </button>
//     );
// }

// export function Newsletter() {
//     return (
//         <>
//             <div
//                 id="mlb2-5744530"
//                 className="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-5744530"
//             >
//                 <form
//                     className="flex gap-2"
//                     action="https://static.mailerlite.com/webforms/submit/p5o0j8"
//                     data-code="p5o0j8"
//                     method="post"
//                     target="_blank"
//                 >
//                     <input
//                         aria-label="email"
//                         aria-required="true"
//                         type="email"
//                         className="text-base form-control max-w-[18rem] border border-stone-300 dark:border-transparent shadow-sm dark:bg-stone-925 px-2 py-1 rounded w-full"
//                         data-inputmask=""
//                         name="fields[email]"
//                         placeholder="Email"
//                         autoComplete="email"
//                     />

//                     <input
//                         type="checkbox"
//                         className="hidden"
//                         name="groups[]"
//                         value="112132481"
//                         checked
//                         readOnly
//                     />
//                     <input
//                         type="checkbox"
//                         className="hidden"
//                         name="groups[]"
//                         value="111453104"
//                     />
//                     <input type="hidden" name="ml-submit" value="1" />
//                     <button
//                         type="submit"
//                         className="flex items-center gap-2 px-3 py-1 text-white rounded shadow-sm bg-stone-925 dark:bg-black hover:bg-stone-800"
//                     >
//                         <MailIcon className="" size="14" /> Subscribe
//                     </button>
//                     <input type="hidden" name="anticsrf" value="true" />
//                 </form>
//                 <div
//                     className="ml-form-successBody row-success"
//                     style={{ display: "none" }}
//                 >
//                     <div className="ml-form-successContent">
//                         <p>You&apos;re subscribed 🎉</p>
//                     </div>
//                 </div>
//             </div>
//             <script
//                 dangerouslySetInnerHTML={{
//                     __html: `
// function ml_webform_success_5744530(){var r=ml_jQuery||jQuery;r(".ml-subscribe-form-5744530 .row-success").show(),r(".ml-subscribe-form-5744530 .row-form").hide()}
// `,
//                 }}
//             />
//             {/* eslint-disable-next-line @next/next/no-img-element */}
//             <img
//                 src="https://track.mailerlite.com/webforms/o/5744530/p5o0j8?v1697487427"
//                 width="1"
//                 height="1"
//                 style={{
//                     maxWidth: "1px",
//                     maxHeight: "1px",
//                     visibility: "hidden",
//                     padding: 0,
//                     margin: 0,
//                     display: "block",
//                 }}
//                 alt="."
//             />
//             <script
//                 src="https://static.mailerlite.com/js/w/webforms.min.js?vd4de52e171e8eb9c47c0c20caf367ddf"
//                 type="text/javascript"
//                 defer
//             ></script>
//         </>
//     );
// }
