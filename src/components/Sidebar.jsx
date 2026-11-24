import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  {
    label: 'Programación',
    icon: '📅',
    submenu: [
      { path: '/precargar', label: 'Precargar' },
      { path: '/historico', label: 'Histórico' },
    ],
  },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { pathname } = useLocation();
  // Arranca abierto si la ruta actual pertenece al submenú.
  const [openMenus, setOpenMenus] = useState(() =>
    Object.fromEntries(
      menuItems
        .filter((item) => item.submenu?.some((sub) => sub.path === pathname))
        .map((item) => [item.label, true])
    )
  );

  const toggleMenu = (label) => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold">Admin System</h1>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
              className="lg:hidden text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) =>
              item.submenu ? (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    aria-expanded={!!openMenus[item.label]}
                    className="w-full flex items-center justify-between px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`transform transition-transform ${
                        openMenus[item.label] ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {openMenus[item.label] && (
                    <div className="bg-gray-800">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `block px-6 py-3 pl-16 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                              isActive ? 'bg-gray-700 text-white border-l-4 border-blue-500' : ''
                            }`
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                      isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              )
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
