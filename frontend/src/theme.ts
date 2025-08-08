import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4', // 시안색 계열로 변경
      light: '#4dd0e1',
      dark: '#00838f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0', // 더 밝게 변경
    },
    divider: '#424242',
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.26)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    // 시스템 폰트 사용 - Google Fonts 없이도 깔끔한 폰트
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont', 
      '"Segoe UI"',
      'Roboto',  // 시스템에 있는 Roboto 사용
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    allVariants: {
      color: '#ffffff',
    },
    h1: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    h2: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    h3: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    h4: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    h5: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    h6: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#e0e0e0',
    },
    caption: {
      color: '#b0b0b0',
    },
    subtitle1: {
      color: '#ffffff',
    },
    subtitle2: {
      color: '#e0e0e0',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          color: '#ffffff',
        },
        '*': {
          color: 'inherit',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-root': {
            color: 'inherit',
          },
        },
        h1: {
          color: '#ffffff !important',
        },
        h2: {
          color: '#ffffff !important',
        },
        h3: {
          color: '#ffffff !important',
        },
        h4: {
          color: '#ffffff !important',
        },
        h5: {
          color: '#ffffff !important',
        },
        h6: {
          color: '#ffffff !important',
        },
        body1: {
          color: '#ffffff !important',
        },
        body2: {
          color: '#e0e0e0 !important',
        },
        caption: {
          color: '#b0b0b0 !important',
        },
        subtitle1: {
          color: '#ffffff !important',
        },
        subtitle2: {
          color: '#e0e0e0 !important',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#333333',
            '& fieldset': {
              borderColor: '#616161',
            },
            '&:hover fieldset': {
              borderColor: '#9e9e9e',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00bcd4',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b0b0',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#00bcd4',
          },
          '& .MuiOutlinedInput-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          color: '#ffffff',
        },
        contained: {
          backgroundColor: '#00bcd4',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#00838f',
          },
          '&:disabled': {
            backgroundColor: '#616161',
            color: '#9e9e9e',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#333333',
          color: '#ffffff',
          '& .MuiChip-icon': {
            color: '#ffffff',
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#00bcd4',
            color: '#ffffff',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#4caf50',
            color: '#ffffff',
          },
          '&.MuiChip-colorError': {
            backgroundColor: '#f44336',
            color: '#ffffff',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: '#ff9800',
            color: '#ffffff',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
      },
    },
  },
});

export default theme;
