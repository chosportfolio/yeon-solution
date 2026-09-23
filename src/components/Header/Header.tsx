import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Header.css";

type MenuLink = {
  name: string;
  path: string;
};

type MenuGroup = {
  name: string;
  path: string;
  items: MenuLink[];
  column: number;
};

type Menu = MenuLink & {
  subMenu: MenuLink[];
  groups?: MenuGroup[];
};

const menus: Menu[] = [
  {
    name: "회사 소개",
    path: "/company",
    subMenu: [
      { name: "인사말", path: "/company/greeting" },
      { name: "개요", path: "/company/overview" },
      { name: "CI", path: "/company/ci" },
      { name: "연혁", path: "/company/history" },
      { name: "오시는 길", path: "/company/location" },
    ],
  },

  {
    name: "냉난방 시스템",
    path: "/business/cooling",
    subMenu: [],
    groups: [
      {
        name: "중대형 빌딩 시스템",
        path: "/business/cooling/building",
        column: 1,
        items: [
          { name: "멀티 V 실외기", path: "/business/cooling/multi-v-outdoor" },
          { name: "멀티 V 실내기", path: "/business/cooling/multi-v-indoor" },
          { name: "GHP", path: "/business/cooling/ghp" },
          { name: "멀티V-GHP 하이브리드", path: "/business/cooling/hybrid" },
        ],
      },
      {
        name: "중소형 빌딩 시스템",
        path: "/business/cooling/small-building",
        column: 1,
        items: [
          { name: "SINGLE", path: "/business/cooling/single" },
        ],
      },
      {
        name: "주거형 시스템",
        path: "/business/cooling/residential",
        column: 1,
        items: [
          { name: "멀티 V S 주거", path: "/business/cooling/multi-v-s" },
          { name: "멀티올인원", path: "/business/cooling/multi-all-in-one" },
          { name: "멀티올인원(프리미엄)", path: "/business/cooling/multi-all-in-one-premium" },
          { name: "멀티 V S 주거 (프리미엄)", path: "/business/cooling/multi-v-s-premium" },
        ],
      },
      {
        name: "중앙공조 시스템",
        path: "/business/cooling/hvac",
        column: 2,
        items: [
          { name: "열원장비(칠러)", path: "/business/cooling/chiller" },
          { name: "공조장비", path: "/business/cooling/hvac-equipment" },
        ],
      },
      {
        name: "바닥난방·급탕 시스템",
        path: "/business/cooling/heating",
        column: 2,
        items: [
          { name: "시스템보일러", path: "/business/cooling/boiler" },
          { name: "일체형 시스템보일러", path: "/business/cooling/all-in-one-boiler" },
        ],
      },
      {
        name: "환기 시스템",
        path: "/business/cooling/ventilation",
        column: 2,
        items: [
          { name: "상업용 환기 시스템", path: "/business/cooling/commercial-ventilation" },
          { name: "주거용 환기 시스템", path: "/business/cooling/residential-ventilation" },
        ],
      },
      {
        name: "시스템 공기청정기",
        path: "/business/cooling/air-cleaner",
        column: 2,
        items: [],
      },
      {
        name: "버스에어시스템",
        path: "/business/cooling/bus-air-system",
        column: 2,
        items: [],
      },
      {
        name: "콜드체인 시스템",
        path: "/business/cooling/cold-chain",
        column: 3,
        items: [
          { name: "싱글 CDU", path: "/business/cooling/single-cdu" },
          { name: "인버터 CDU", path: "/business/cooling/inverter-cdu" },
          { name: "멀티 V 슈퍼콤비", path: "/business/cooling/super-combi" },
        ],
      },
      {
        name: "제어 솔루션",
        path: "/business/cooling/control-solution",
        column: 3,
        items: [
          { name: "냉난방 제어솔루션", path: "/business/cooling/control" },
          { name: "빌딩솔루션(BMS)", path: "/business/cooling/bms" },
          { name: "에너지솔루션", path: "/business/cooling/energy" },
          { name: "유지보수 서비스", path: "/business/cooling/maintenance" },
          { name: "세척 서비스", path: "/business/cooling/cleaning" },
        ],
      },
    ],
  },

  {
    name: "B2B 가전",
    path: "/business/appliance",
    subMenu: [],
    groups: [
      {
        name: "TV",
        path: "/business/appliance/tv",
        column: 1,
        items: [
          { name: "QNED TV", path: "/business/appliance/tv/qned" },
          { name: "울트라 HD TV", path: "/business/appliance/tv/ultra-hd" },
          { name: "일반 LED TV", path: "/business/appliance/tv/led" },
          {
            name: "라이프스타일 스크린",
            path: "/business/appliance/tv/lifestyle-screen",
          },
        ],
      },
      {
        name: "청소기",
        path: "/business/appliance/vacuum",
        column: 1,
        items: [
          { name: "코드제로 A9S", path: "/business/appliance/vacuum/a9s" },
          { name: "코드제로 R9", path: "/business/appliance/vacuum/r9" },
          { name: "코드제로 M9", path: "/business/appliance/vacuum/m9" },
        ],
      },
      {
        name: "광파오븐",
        path: "/business/appliance/oven",
        column: 2,
        items: [
          { name: "스팀형", path: "/business/appliance/oven/steam" },
          { name: "논스팀형", path: "/business/appliance/oven/non-steam" },
        ],
      },
      {
        name: "건조기",
        path: "/business/appliance/dryer",
        column: 2,
        items: [
          { name: "전기식", path: "/business/appliance/dryer/electric" },
          {
            name: "상업용 건조기",
            path: "/business/appliance/dryer/commercial",
          },
        ],
      },
      {
        name: "전기레인지(인덕션)",
        path: "/business/appliance/induction",
        column: 2,
        items: [],
      },
      {
        name: "식기세척기",
        path: "/business/appliance/dishwasher",
        column: 2,
        items: [],
      },
      {
        name: "세탁기",
        path: "/business/appliance/washer",
        column: 3,
        items: [
          { name: "드럼형 세탁기", path: "/business/appliance/washer/drum" },
          { name: "미니 세탁기", path: "/business/appliance/washer/mini" },
          { name: "일반형 세탁기", path: "/business/appliance/washer/general" },
          {
            name: "상업용 세탁기",
            path: "/business/appliance/washer/commercial",
          },
        ],
      },
      {
        name: "냉장고",
        path: "/business/appliance/refrigerator",
        column: 3,
        items: [
          {
            name: "상냉장/하냉동",
            path: "/business/appliance/refrigerator/bottom-freezer",
          },
          {
            name: "양문형",
            path: "/business/appliance/refrigerator/side-by-side",
          },
          { name: "일반형", path: "/business/appliance/refrigerator/general" },
          {
            name: "비즈니스",
            path: "/business/appliance/refrigerator/business",
          },
        ],
      },
    ],
  },

  {
    name: "시공 사례",
    path: "/projects",
    subMenu: [
      { name: "시스템 에어컨", path: "/projects/air-conditioner" },
      { name: "시스템 보일러", path: "/projects/boiler" },
      { name: "중앙 공조시스템", path: "/projects/hvac" },
      { name: "환기 시스템", path: "/projects/ventilation" },
      { name: "빌트인 가전", path: "/projects/builtin" },
    ],
  },

  {
    name: "고객 지원",
    path: "/support",
    subMenu: [],
  },
];

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSubMenuOpen =
    activeMenu !== null &&
    (menus[activeMenu].subMenu.length > 0 ||
      Boolean(menus[activeMenu].groups?.length));

  const isMegaMenuOpen =
    activeMenu !== null && Boolean(menus[activeMenu].groups?.length);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`header${isMobileMenuOpen ? " is-mobile-menu-open" : ""}`}
      onMouseLeave={() => setActiveMenu(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setActiveMenu(null);
        }
      }}
    >
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src={logo} alt="" />
          연솔루션
        </Link>

        <div
          className={`gnb-wrap${isMobileMenuOpen ? " is-mobile-open" : ""}`}
          id="primary-navigation"
          onMouseLeave={() => setActiveMenu(null)}
        >
          <nav className="gnb" aria-label="주요 메뉴">
            {menus.map((menu, index) => (
              <div
                className="gnb-item"
                key={menu.path}
                onMouseEnter={() => setActiveMenu(index)}
              >
                <Link
                  to={menu.path}
                  className={`${activeMenu === index ? "active" : ""}${
                    menu.subMenu.length > 0 || menu.groups?.length
                      ? " has-submenu"
                      : ""
                  }`}
                  onClick={closeMobileMenu}
                  onFocus={() => setActiveMenu(index)}
                >
                  {menu.name}
                </Link>

                {(menu.subMenu.length > 0 || menu.groups?.length) && (
                  <details className="mobile-menu-group" name="mobile-navigation">
                    <summary>{menu.name}</summary>
                    <div className="mobile-submenu">
                      {menu.groups
                        ? menu.groups.map((group) => (
                            <div className="mobile-menu-section" key={group.path}>
                              <Link
                                className="mobile-menu-heading"
                                to={group.path}
                                onClick={closeMobileMenu}
                              >
                                {group.name}
                              </Link>
                              {group.items.map((item) => (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  onClick={closeMobileMenu}
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          ))
                        : menu.subMenu.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={closeMobileMenu}
                            >
                              {item.name}
                            </Link>
                          ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </nav>

          <div
            className={`sub-menu${isSubMenuOpen ? " is-open" : ""}${
              isMegaMenuOpen ? " is-mega" : ""
            }`}
            aria-hidden={!isSubMenuOpen}
          >
            <div
              className={`sub-menu-inner${
                activeMenu === 0 ? " sub-menu-inner--first" : ""
              }`}
            >
              {activeMenu !== null && menus[activeMenu].groups ? (
                <div className="mega-menu">
                  {[1, 2, 3].map((column) => (
                    <div className="mega-menu-column" key={column}>
                      {menus[activeMenu].groups
                        ?.filter((group) => group.column === column)
                        .map((group) => (
                          <div className="mega-menu-group" key={group.path}>
                            <Link className="mega-menu-heading" to={group.path}>
                              {group.name}
                              <span aria-hidden="true">›</span>
                            </Link>
                            <div className="mega-menu-links">
                              {group.items.map((item) => (
                                <Link key={item.path} to={item.path}>
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                activeMenu !== null &&
                menus[activeMenu].subMenu.map((item) => (
                  <Link key={item.path} to={item.path}>
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <Link to="/support" className="contact">
          견적 문의
        </Link>

        <button
          type="button"
          className={`menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
          aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => {
            setIsMobileMenuOpen((current) => !current);
          }}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
