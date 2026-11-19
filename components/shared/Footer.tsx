import Image from "next/image";
import Link from "next/link";

const footerConfig = {
  email: "",
  phone: "",
  address: "",
  facebook: "",
  instagram: "",
  x: "",
};

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Menu", href: "/menu" },
  { label: "Pizza Categories", href: "/#categories" },
  { label: "How It Works", href: "/#how-it-works" },
];

const accountLinks = [
  { label: "Sign In", href: "/sign-in" },
  { label: "Create an Account", href: "/sign-up" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile Settings", href: "/profile" },
];

const linkStyles =
  "rounded text-sm leading-6 text-stone-300 transition-colors " +
  "hover:text-orange-300 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-orange-300 " +
  "focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950";

export default function Footer() {
  const socials = [
    { label: "Facebook", href: footerConfig.facebook },
    { label: "Instagram", href: footerConfig.instagram },
    { label: "X", href: footerConfig.x },
  ].filter((social) => social.href.trim() !== "");

  const hasContact =
    footerConfig.email || footerConfig.phone || footerConfig.address;

  return (
    <footer className="border-t border-stone-800 bg-stone-950 text-white">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="PizzaHub home"
              className="inline-flex rounded-xl bg-[#fffaf3] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950"
            >
              <Image
                src="/images/pizzahub-logo.png"
                alt="PizzaHub"
                width={180}
                height={60}
                className="h-auto w-40"
              />
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-stone-400">
              Discover local pizza shops, explore delicious menus,
              and find your next favorite slice—all in one place.
            </p>

            <p className="mt-5 text-sm font-semibold text-orange-300">
              Make it a pizza night.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h2 className="text-base font-bold">Explore PizzaHub</h2>

            <ul className="mt-5 space-y-3">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkStyles}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account links */}
          <nav aria-label="Account navigation">
            <h2 className="text-base font-bold">Your account</h2>

            <ul className="mt-5 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkStyles}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact and social links */}
          <div>
            <h2 className="text-base font-bold">Get in touch</h2>

            {hasContact ? (
              <address className="mt-5 space-y-3 text-sm not-italic leading-7 text-stone-300">
                {footerConfig.email && (
                  <a
                    href={`mailto:${footerConfig.email}`}
                    className={`block break-all ${linkStyles}`}
                  >
                    {footerConfig.email}
                  </a>
                )}

                {footerConfig.phone && (
                  <a
                    href={`tel:${footerConfig.phone.replace(/[^\d+]/g, "")}`}
                    className={`block ${linkStyles}`}
                  >
                    {footerConfig.phone}
                  </a>
                )}

                {footerConfig.address && (
                  <p>{footerConfig.address}</p>
                )}
              </address>
            ) : (
              <p className="mt-5 text-sm leading-7 text-stone-400">
                Contact information will be available soon.
              </p>
            )}

            {socials.length > 0 && (
              <nav aria-label="Social media" className="mt-6">
                <ul className="flex flex-wrap gap-3">
                  {socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} (opens in a new tab)`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-700 px-3 text-sm text-stone-300 transition-colors hover:border-orange-300 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950"
                      >
                        {social.label === "X" ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
                          </svg>
                        ) : (
                          social.label
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-stone-800 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs leading-6 text-stone-400">
            © {new Date().getFullYear()} PizzaHub. All rights reserved.
          </p>

          <p className="text-xs leading-6 text-stone-400">
            Local flavors. More choices. Your next favorite.
          </p>
        </div>
      </div>
    </footer>
  );
}