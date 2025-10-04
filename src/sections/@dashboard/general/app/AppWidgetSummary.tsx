import { ApexOptions } from 'apexcharts';
// @mui
import { Box, Card, Typography, CardProps } from '@mui/material';
// utils
import { fNumber } from '../../../../utils/formatNumber';
// components 

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title: string;
  total: number;
}

export default function AppWidgetSummary({ title , total, sx, ...other }: Props) {

  return (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 3, ...sx }} {...other}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="h3">{fNumber(total)}</Typography>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------
 
