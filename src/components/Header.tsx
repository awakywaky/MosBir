import { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Autocomplete, 
  TextField, 
  Box,
  Paper,
  Popper,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Badge
} from '@mui/material';
import { Search as SearchIcon, Star as StarIcon, StarBorder as StarBorderIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import type { StockSymbol } from '../services/api';

interface HeaderProps {
  onSymbolSelect: (symbol: string) => void;
}

const Header = ({ onSymbolSelect }: HeaderProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<StockSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const savedFavorites = localStorage.getItem('favoriteStocks');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const stocks = await apiService.searchStocks(inputValue);
        setSuggestions(stocks);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [inputValue]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteStocks');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteStocks', JSON.stringify(favorites));
  }, [favorites]);

  const handleSearch = async (value: string) => {
    setInputValue(value);
    if (value.length >= 2) {
      try {
        const results = await apiService.searchStocks(value);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (symbol: string) => {
    onSymbolSelect(symbol);
    setInputValue('');
    setSuggestions([]);
  };

  const toggleFavorite = (symbol: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleFavoritesClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFavoritesClose = () => {
    setAnchorEl(null);
  };

  const removeFavorite = (symbol: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavorites(prev => prev.filter(s => s !== symbol));
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        minHeight: { xs: 56, sm: 64 },
        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: { xs: 1.5, sm: 2, md: 3 },
        minHeight: { xs: 56, sm: 64 },
        gap: 2
      }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h1" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: '#ffffff',
            mr: 2
          }}
        >
          Московская биржа
        </Typography>
        <Box sx={{ width: { xs: '100%', sm: 400 }, mr: 2 }}>
          <Autocomplete
            value={selectedStock}
            onChange={(_, newValue) => {
              setSelectedStock(newValue);
              if (newValue) {
                onSymbolSelect(newValue.symbol);
              }
            }}
            inputValue={inputValue}
            onInputChange={(_, newValue) => {
              handleSearch(newValue);
            }}
            options={suggestions}
            getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Поиск акций..."
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box 
                component="li" 
                {...props}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {option.symbol}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => toggleFavorite(option.symbol, e)}
                  sx={{ 
                    ml: 1,
                    color: favorites.includes(option.symbol) ? 'warning.main' : 'action.active'
                  }}
                >
                  {favorites.includes(option.symbol) ? (
                    <StarIcon fontSize="small" />
                  ) : (
                    <StarBorderIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            )}
            PopperComponent={(props) => (
              <Popper
                {...props}
                placement="bottom-start"
                modifiers={[
                  {
                    name: 'flip',
                    enabled: false,
                  },
                  {
                    name: 'preventOverflow',
                    enabled: true,
                    options: {
                      altAxis: true,
                      altBoundary: true,
                      tether: true,
                      rootBoundary: 'viewport',
                      padding: 8,
                    },
                  },
                ]}
              />
            )}
            PaperComponent={(props) => (
              <Paper
                {...props}
                elevation={2}
                sx={{
                  mt: 1,
                  '& .MuiAutocomplete-listbox': {
                    p: 0,
                    '& .MuiAutocomplete-option': {
                      p: 2,
                    },
                  },
                }}
              />
            )}
            noOptionsText="Акции не найдены"
            loadingText="Загрузка..."
          />
        </Box>

        <IconButton 
          color="inherit" 
          onClick={handleFavoritesClick}
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Badge badgeContent={favorites.length} color="warning">
            <StarIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleFavoritesClose}
          PaperProps={{
            sx: {
              maxHeight: 300,
              width: 250,
            },
          }}
        >
          {favorites.length === 0 ? (
            <MenuItem disabled>
              <ListItemText primary="Нет избранных акций" />
            </MenuItem>
          ) : (
            favorites.map((symbol) => (
              <MenuItem
                key={symbol}
                onClick={() => {
                  handleSelect(symbol);
                  handleFavoritesClose();
                }}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <ListItemText primary={symbol} />
                <IconButton
                  size="small"
                  onClick={(e) => removeFavorite(symbol, e)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 