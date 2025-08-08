import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <Outlet />
    </div>
  )
}

export default App
