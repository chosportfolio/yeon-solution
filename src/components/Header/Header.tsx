import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { businessCategories } from "../../data/business";
import "./Header.css";

type MenuLink = { name: string; path: string; note?: string };
type Menu = MenuLink & { subMenu: MenuLink[]; isBusiness?: boolean; description?: string; subMenuAlign?: "start" | "end" };

const menus: Menu[] = [
  {
    name: "회사 소개", path: "/company",
    subMenu: [
      { name: "인사말", path: "/company/greeting" },
      { name: "개요", path: "/company/overview" },
      { name: "CI", path: "/company/ci" },
      { name: "연혁", path: "/company/history" },
      { name: "오시는 길", path: "/company/location" },
    ],
  },
  ...businessCategories.map((category) => ({
    name: category.name,
    path: `/business/${category.slug}`,
    description: category.description,
    isBusiness: true,
    subMenu: category.products.map((product) => ({
      name: product.name,
      note: product.note,
      path: product.path ?? `/business/${category.slug}#${product.slug}`,
    })),
  })),
  {
    name: "시공 사례", path: "/projects",
    subMenu: [],
  },
  {
    name: "고객 지원", path: "/support",
    subMenuAlign: "end",
    subMenu: [
      { name: "견적 문의", path: "/support/estimate" },
      { name: "자주 묻는 질문", path: "/support/faq" },
    ],
  },
];

export default function Header() {
  const { pathname } = useLocation();
  const [isAtTop, setIsAtTop] = useState(() => window.scrollY <= 0);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const menuTriggerRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const subMenuLinksRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const selectedMenu = activeMenu === null ? undefined : menus[activeMenu];
  const isSubMenuOpen = Boolean(selectedMenu?.subMenu.length);
  const closeMenu = () => { setIsMobileMenuOpen(false); setActiveMenu(null); };

  useEffect(() => {
    const updateHeader = () => setIsAtTop(window.scrollY <= 0);
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setActiveMenu(null);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useLayoutEffect(() => {
    const links = subMenuLinksRef.current;
    if (!links || activeMenu === null || menus[activeMenu].isBusiness) return;
    const trigger = menuTriggerRefs.current[activeMenu];
    const anchor = menus[activeMenu].subMenuAlign === "end" ? links.lastElementChild : links.firstElementChild;
    if (!trigger || !anchor) return;
    const alignSubMenu = () => {
      links.style.transform = "";
      const triggerBounds = trigger.getBoundingClientRect();
      const anchorBounds = anchor.getBoundingClientRect();
      const offset = triggerBounds.left + triggerBounds.width / 2 - anchorBounds.left - anchorBounds.width / 2;
      links.style.transform = `translateX(${offset}px)`;
    };
    alignSubMenu();
    const observer = new ResizeObserver(alignSubMenu);
    observer.observe(trigger);
    observer.observe(links);
    window.addEventListener("resize", alignSubMenu);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignSubMenu);
      links.style.transform = "";
    };
  }, [activeMenu]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`header${pathname === "/" && isAtTop && !isMobileMenuOpen && !isSubMenuOpen ? " header--transparent" : ""}${isMobileMenuOpen ? " is-mobile-menu-open" : ""}`}
      onMouseLeave={() => setActiveMenu(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActiveMenu(null);
      }}
    >
      <div className="header-inner">
        <Link to="/" className="logo" onClick={closeMenu} aria-label="연솔루션 홈">
          <span className="header-wordmark">
            <strong>연솔루션</strong>
            <small aria-label="YEON SOLUTION">
              {Array.from("YEON SOLUTION").map((character, index) => (
                <span key={index} aria-hidden="true">{character === " " ? "\u00a0" : character}</span>
              ))}
            </small>
          </span>
          <span className="header-partner"><strong>LG전자</strong><small>시스템에어컨 전문점</small></span>
        </Link>

        <div className={`gnb-wrap${isMobileMenuOpen ? " is-mobile-open" : ""}`} id="primary-navigation">
          <nav className="gnb" aria-label="주요 메뉴">
            {menus.map((menu, index) => (
              <div className="gnb-item" key={menu.path} onMouseEnter={() => setActiveMenu(index)}>
                <Link
                  ref={(node) => { menuTriggerRefs.current[index] = node; }}
                  to={menu.path}
                  className={`${activeMenu === index || pathname.startsWith(menu.path) ? "active" : ""}${menu.subMenu.length ? " has-submenu" : ""}`}
                  aria-expanded={menu.subMenu.length ? activeMenu === index : undefined}
                  aria-controls={menu.subMenu.length ? "desktop-submenu" : undefined}
                  onClick={closeMenu}
                  onFocus={() => setActiveMenu(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && menu.subMenu.length) {
                      event.preventDefault();
                      setActiveMenu(index);
                      requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>("#desktop-submenu a")?.focus());
                    }
                  }}
                >{menu.name}</Link>
                {menu.subMenu.length > 0 && (
                  <details className="mobile-menu-group" name="mobile-navigation">
                    <summary>{menu.name}</summary>
                    <div className="mobile-submenu">
                      {menu.isBusiness && <Link className="mobile-menu-overview" to={menu.path} onClick={closeMenu}>{menu.name} 전체 보기 <span aria-hidden="true">→</span></Link>}
                      {menu.subMenu.map((item) => (
                        <Link key={item.path} to={item.path} onClick={closeMenu}>
                          {item.name}{item.note && <small>{item.note}</small>}
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </nav>
        </div>

        <Link to="/support/estimate" className="contact" onClick={closeMenu}>견적 문의</Link>
        <button
          type="button" className={`menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
          aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isMobileMenuOpen} aria-controls="primary-navigation"
          onClick={() => { setIsMobileMenuOpen((current) => !current); setActiveMenu(null); }}
        >
          <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        </button>
      </div>

      <div
        id="desktop-submenu"
        className={`sub-menu${isSubMenuOpen ? " is-open" : ""}${selectedMenu?.isBusiness ? " is-business" : ""}`}
        aria-hidden={!isSubMenuOpen}
        inert={!isSubMenuOpen}
      >
        <div className="sub-menu-clip">
          <div className="sub-menu-inner">
            {isSubMenuOpen && selectedMenu && <>
              {selectedMenu.isBusiness && (
                <div className="sub-menu-intro">
                  <strong>{selectedMenu.name}</strong>
                  <p>{selectedMenu.description}</p>
                  <Link to={selectedMenu.path} onClick={closeMenu}>전체 보기 <span aria-hidden="true">→</span></Link>
                </div>
              )}
              <div className="sub-menu-links" ref={subMenuLinksRef}>
                {selectedMenu.subMenu.map((item) => (
                  <Link key={item.path} to={item.path} onClick={closeMenu}>
                    {item.name}{item.note && <small>{item.note}</small>}
                  </Link>
                ))}
              </div>
            </>}
          </div>
        </div>
      </div>
    </header>
  );
}
