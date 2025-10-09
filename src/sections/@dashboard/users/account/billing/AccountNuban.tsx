// @mui
import { useEffect, useState } from 'react';
import { Grid, Card, Typography, Stack } from '@mui/material';
// @types
import {
  IUserAccountBillingCreditCard,
  IUserAccountBillingAddress,
  IUserAccountBillingInvoice,
} from '../../../../../@types/user';
//
import axios from '../../../../../utils/axios';

import AccountBillingAddressBook from './AccountBeneficiary';
import AccountBillingPaymentMethod from './AccountWallets';
import AccountBillingInvoiceHistory from './AccountLoanHistory';
 
// ----------------------------------------------------------------------

type Props = {
  cards: IUserAccountBillingCreditCard[];
  invoices: IUserAccountBillingInvoice[];
  addressBook: IUserAccountBillingAddress[];
};

export default function AccountBilling({ cards, addressBook, invoices }: Props) {
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
        const response = await axios.get(`/admin/users/${id}/virtual-accounts`, config);
        setResponseData(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]);

  return (
    <Grid container spacing={5}>

      

      {responseData?.data.map((data: { id: string; bankName: string; bankCode: string; accountName: string; accountNumber: string; walletId: string; customerId: string;}) => (
        <Grid item xs={12} md={8} key={data.id}>
          <Stack spacing={3}>
            <Card sx={{ p: 3 }}>
              <Typography
                variant="overline"
                sx={{ mb: 3, display: 'block', color: 'text.secondary' }}
              >
                Virtual Account
              </Typography>
              <Typography>Bank Name: {data.bankName}</Typography>
              <Typography>Bank Code: {data.bankCode}</Typography>
              <Typography>Account Name: {data.accountName}</Typography>
              <Typography>Account Number: {data.accountNumber}</Typography>
              <Typography>Wallet ID: {data.walletId}</Typography>
              <Typography>Customer ID: {data.customerId}</Typography>
            </Card>

            <AccountBillingPaymentMethod cards={cards} />

            <AccountBillingAddressBook addressBook={addressBook} />
          </Stack>
        </Grid>
      ))}

      <Grid item xs={12} md={4}>
        <AccountBillingInvoiceHistory invoices={invoices} />
      </Grid>
    </Grid>
  );
}