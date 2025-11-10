import { useEffect, useState } from 'react';
// @mui
import { Card, Stack, Paper, Typography } from '@mui/material';
// @types
import { IUserAccountBillingCreditCard } from '../../../../../@types/user';
import axios from '../../../../../utils/axios';

// components
import Image from '../../../../../components/image';
import { fCurrency } from '../../../../../utils/formatNumber';

// section
 
// ----------------------------------------------------------------------

type Props = {
  cards: IUserAccountBillingCreditCard[];
};

export default function AccountBillingPaymentMethod({ cards }: Props) {
  
  const urlPath = window.location.pathname;
  const id = urlPath.split('/').filter(Boolean).pop(); 
  const [responseData, setResponseData] = useState<any>(null);
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        const response = await axios.get(`/admin/users/${id}/wallets`, config);
        setResponseData(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]); 


  return (
       <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{
              flexGrow: 1,
              color: 'text.secondary',
            }}
          >
            Wallets
          </Typography> 
        </Stack>

        <Stack
          spacing={2}
          direction={{
            xs: 'column',
            md: 'row',
          }}
        >
        {responseData?.data.map((wallet: { id: string; type: string; balance: string; currency: string; }) => (
            <Paper
              key={wallet.id}
              variant="outlined"
              sx={{
                p: 3,
                width: 1,
                position: 'relative',
              }}
            >
              <Image
                alt="icon"
                src={
                  wallet.type === 'loan'
                    ? '/assets/icons/payments/8.png'
                    : '/assets/icons/payments/9.png'
                }
                sx={{ mb: 1, maxWidth: 36 }}
              />
              {wallet.type}
              <Typography variant="subtitle2">₦{fCurrency(wallet.balance)} {wallet.currency}</Typography>
 
            </Paper>
          ))}
        </Stack>
      </Card>
  );
}
