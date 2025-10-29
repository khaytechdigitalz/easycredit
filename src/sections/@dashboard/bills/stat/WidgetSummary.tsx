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
          width: 120,
          height: 120,
          lineHeight: 0,
          borderRadius: '50%',
          bgcolor: 'background.neutral',
        }}
      >
        <Image
                alt="icon"
                src={image}
                sx={{ mb: 1, maxWidth: 100 }}
              />
        
      </Box>
    </Card>
  );
}
