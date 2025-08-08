import { Outlet } from 'react-router-dom'
import { CssBaseline, Box } from '@mui/material'

function App() {
  return (
    <>
      <CssBaseline />
      <Box 
        sx={{ 
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#121212 !important',
          color: '#ffffff !important',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0,
          '*': {
            color: 'inherit !important'
          }
        }}
      >
        <Outlet />
      </Box>
    </>
  )
}

export default App
