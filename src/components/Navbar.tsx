import Logo from './Logo'

const links = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
]

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 md:px-14 py-4 sm:py-5">
      <div className="relative flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-semibold text-base tracking-tight text-[#191919]">
            Boomerang
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-[#191919]/70 hover:text-[#191919] transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#demo"
          className="px-5 py-2.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 transition-colors duration-200"
        >
          Book A Demo
        </a>
      </div>
    </nav>
  )
}
