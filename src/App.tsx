import { useState, useEffect } from 'react';
import { Container, Box, CssBaseline, ThemeProvider, createTheme, Typography } from '@mui/material';
import Header from './components/Header';
import StockChart from './components/StockChart';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          boxShadow: '0 2px 4px rgba(33, 150, 243, .2)',
          width: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function Footer() {
  const calculateTimeToClose = () => {
    const now = new Date();
    const closeTime = new Date();
    closeTime.setHours(19, 0, 0, 0);

    if (now > closeTime) {
      return 'Биржа закрыта';
    }

    const diff = closeTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `До закрытия биржи: ${hours}ч ${minutes}м`;
  };

  const [timeToClose, setTimeToClose] = useState<string>(calculateTimeToClose());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeToClose(calculateTimeToClose());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="body2" color="text.secondary" align="center">
          {timeToClose}
        </Typography>
      </Container>
    </Box>
  );
}

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const savedSymbol = localStorage.getItem('selectedStock');
    return savedSymbol || '';
  });

  useEffect(() => {
    if (selectedSymbol) {
      localStorage.setItem('selectedStock', selectedSymbol);
    } else {
      localStorage.removeItem('selectedStock');
    }
  }, [selectedSymbol]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          width: '100vw',
          overflowX: 'hidden',
        }}
      >
        <Header onSymbolSelect={setSelectedSymbol} />
        <Box 
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3, md: 4 },
            width: '100%',
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                width: '100%',
                margin: '0 auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <StockChart symbol={selectedSymbol} />
            </Box>
          </Container>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
