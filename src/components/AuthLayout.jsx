const VENTAJAS = [
  {
    titulo: 'Carga masiva desde Excel',
    texto: 'Sube la plantilla y precarga cientos de órdenes de servicio en un paso.',
  },
  {
    titulo: 'Detección de OS duplicadas',
    texto: 'Cada orden repetida queda marcada antes de publicarse.',
  },
  {
    titulo: 'Publicación e histórico',
    texto: 'Publica lo validado y consulta todo lo cargado por fecha.',
  },
];

// Marca en texto. Para usar el logo oficial, reemplazar por <img src="/logo.svg" alt="Applus+" />.
const Marca = ({ className = '' }) => (
  <span className={`font-extrabold tracking-tight ${className}`}>
    Applus<sup className="font-black">+</sup>
  </span>
);

const Check = () => (
  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

/** Pantalla dividida para login y registro: panel de marca + formulario. */
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr] bg-gray-50">
    {/* Panel de marca (solo escritorio) */}
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-linear-to-br from-brand-500 via-brand-600 to-brand-800 p-12 xl:p-16 text-white">
      {/* Decoración: el "+" de la marca y círculos suaves */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-112 w-md rounded-full bg-white/10" />
        <div className="absolute -bottom-40 -left-24 h-128 w-lg rounded-full bg-black/10" />
        <span className="absolute right-10 bottom-0 select-none text-[22rem] leading-none font-black text-white/10">
          +
        </span>
      </div>

      <Marca className="relative text-4xl" />

      <div className="relative max-w-lg">
        <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
          Programación de órdenes de servicio
        </h2>
        <p className="mt-4 text-lg text-white/85">
          Precarga, valida y publica las visitas técnicas en campo desde un solo lugar.
        </p>

        <ul className="mt-10 space-y-5">
          {VENTAJAS.map((item) => (
            <li key={item.titulo} className="flex gap-4">
              <Check />
              <div>
                <p className="font-semibold">{item.titulo}</p>
                <p className="text-sm text-white/80">{item.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-white/70">
        © {new Date().getFullYear()} Applus+ · Sistema Administrativo
      </p>
    </aside>

    {/* Formulario */}
    <main className="flex min-h-screen flex-col lg:min-h-0">
      {/* Franja de marca en móvil */}
      <div className="lg:hidden bg-linear-to-r from-brand-500 to-brand-700 px-6 py-5 text-white">
        <Marca className="text-2xl" />
        <p className="text-sm text-white/85">Programación de órdenes de servicio</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-4 block h-1.5 w-12 rounded-full bg-brand-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-8 text-center text-sm text-gray-600">{footer}</div>}
        </div>
      </div>
    </main>
  </div>
);

export default AuthLayout;
