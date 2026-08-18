import Link from 'next/link';
import { Clock, Leaf, Mail, MapPin } from 'lucide-react';
import HomeHashLink from './HomeHashLink';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">VFresh</span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            A healthy food platform by Zenara Jaya. Local kitchens, delivered
            in the Miri area.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white">
            Order
          </h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <HomeHashLink hash="menu" className="hover:text-emerald-600">
                Menu
              </HomeHashLink>
            </li>
            <li>
              <Link href="/cart" className="hover:text-emerald-600">
                Your cart
              </Link>
            </li>
            <li>
              <Link href="/order-confirmation" className="hover:text-emerald-600">
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="hover:text-emerald-600">
                Delivery desk
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white">
            Company
          </h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <HomeHashLink hash="about" className="hover:text-emerald-600">
                About us
              </HomeHashLink>
            </li>
            <li>
              <HomeHashLink hash="location" className="hover:text-emerald-600">
                Locations
              </HomeHashLink>
            </li>
            <li>
              <HomeHashLink hash="vendors" className="hover:text-emerald-600">
                Vendors
              </HomeHashLink>
            </li>
            <li>
              <Link href="/login" className="hover:text-emerald-600">
                Login
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-white">
            Contact
          </h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              Miri, Sarawak
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-emerald-500" />
              vfresh.com
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-emerald-500" />
              Mon–Fri, 7:30am–4:00pm
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-4 py-5 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        © {new Date().getFullYear()} Zenara Jaya. VFresh. All rights reserved.
      </div>
    </footer>
  );
}
