// @mui
import { useEffect, useState } from 'react';

import { Box, Card, Button, Typography, Stack, Divider } from '@mui/material';
// @types
import axios from '../../../../../utils/axios';

// components
import Iconify from '../../../../../components/iconify';

// ----------------------------------------------------------------------
 

export default function AccountBillingAddressBook() {

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
        const response = await axios.get(`/admin/users/${id}/beneficiaries`, config);
        setResponseData(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]); 
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Beneficiary
        </Typography> 
      </Stack>

      <Stack spacing={3} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        {responseData?.data.map((beneficiary: { _id: string; accountName: string; accountNumber: string; bankName: string; }) => (
          <Stack key={beneficiary._id} spacing={1}>
            <Typography variant="subtitle1">{beneficiary.accountName}</Typography>

            <Typography variant="body2">
              <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
                Account Number:
              </Box>
              {`${beneficiary.accountNumber}`}
            </Typography>

            <Typography variant="body2">
              <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
                Bank Name:
              </Box>
              {beneficiary.bankName}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button color="error" size="small" startIcon={<Iconify icon="eva:trash-2-outline" />}>
                Delete
              </Button>

              <Button size="small" startIcon={<Iconify icon="eva:edit-fill" />}>
                Edit
              </Button>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
