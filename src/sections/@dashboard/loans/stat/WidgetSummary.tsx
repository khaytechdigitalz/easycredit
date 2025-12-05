// @mui
import { Card, Typography, Box, CardProps } from '@mui/material';
// utils
import { fShortenNumber } from '../../../../utils/formatNumber';
import Image from '../../../../components/image';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title: string;
  total: number;
  image: string;
  icon: React.ReactElement;
}

export default function BookingWidgetSummary({ title, total, image, sx, ...other }: Props) {
  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        pl: 3,
        ...sx,
      }}
      {...other}
    >
      <div>
        <Typography variant="h3">{fShortenNumber(total)}</Typography>

        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </div>
 
<Box
  sx={{
    width: 90,
    height: 90,
    lineHeight: 0,
    borderRadius: '50%',
    bgcolor: '#2596be',
    // --- Add these properties for centering ---
    display: 'flex',
    justifyContent: 'center', // Centers horizontally
    alignItems: 'center', // Centers vertically
    // -----------------------------------------
  }}
>
  <Image
    alt="icon"
    src={image}
    // Remove maxWidth: 80 from here, or adjust it if the image is too large.
    // If you need the max width, ensure it's less than the box width (100px).
    sx={{ maxWidth: 60 }}
  />
</Box>
    </Card>
  );
}
