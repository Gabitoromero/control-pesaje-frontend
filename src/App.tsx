import { UsuarioRol } from './shared/types'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Control de Pesaje
      </h1>
      <p className="text-gray-700 text-lg">
        Bienvenido al sistema de control de pesaje.
      </p>
      <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Frontend inicializado con React, Vite y Tailwind CSS.
        </p>
        <p className="text-xs font-mono bg-blue-50 text-blue-700 py-1 px-2 rounded">
          Roles compartidos: {Object.values(UsuarioRol).join(', ')}
        </p>
      </div>
    </div>
  )
}

export default App
