import Header from './Header';
import Footer from './Footer';
import StorefrontCart from './StorefrontCart';

/**
 * Chrome shared by the landing page and every route in the (customer) group.
 * The landing page lives at app/page.tsx, outside that route group, so the
 * header/footer pair can't live in a single layout file.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontCart>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </StorefrontCart>
  );
}
