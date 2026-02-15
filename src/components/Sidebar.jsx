import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [isProgramacionOpen, setIsProgramacionOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
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
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsProgramacionOpen(!isProgramacionOpen)}
                      className="w-full flex items-center justify-between px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span
                        className={`transform transition-transform ${
                          isProgramacionOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                    {isProgramacionOpen && (
                      <div className="bg-gray-800">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            onClick={() => setIsOpen(false)}
                            className={`block px-6 py-3 pl-16 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                              isActive(subItem.path)
                                ? 'bg-gray-700 text-white border-l-4 border-blue-500'
                                : ''
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
