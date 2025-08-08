import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00796B',
    },
    secondary: {
      main: '#FFC107',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export default theme;