import { Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { differenceInMinutes, setHours, setMinutes } from 'date-fns';

const Footer = () => {
  const [timeUntilClose, setTimeUntilClose] = useState('');

  useEffect(() => {
    const updateTimeUntilClose = () => {
      const now = new Date();
      const marketClose = setMinutes(setHours(now, 19), 0);
      
      if (now > marketClose) {
        setTimeUntilClose('Биржа закрыта');
        return;
      }

      const minutesUntilClose = differenceInMinutes(marketClose, now);
      const hours = Math.floor(minutesUntilClose / 60);
      const minutes = minutesUntilClose % 60;
      
      setTimeUntilClose(`До закрытия биржи: ${hours}ч ${minutes}м`);
    };

    updateTimeUntilClose();
    const interval = setInterval(updateTimeUntilClose, 60000);

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
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        {timeUntilClose}
      </Typography>
    </Box>
  );
};

export default Footer; 