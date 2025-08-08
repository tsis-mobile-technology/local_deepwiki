import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import DocumentationPage from './pages/DocumentationPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'docs',
        element: <DocumentationPage />,
      },
    ],
  },
])
