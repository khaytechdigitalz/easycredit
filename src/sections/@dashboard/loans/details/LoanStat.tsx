import { sentenceCase } from 'change-case';

// @mui
import { Button, Card, Typography, Stack, CardProps } from '@mui/material';

import axios from '../../../../utils/axios';
// utils
import { fCurrency } from '../../../../utils/formatNumber';
import { fDate } from '../../../../utils/formatTime';
import Label from '../../../../components/label';
import { useSnackbar } from '../../../../components/snackbar';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title: string;
  sentAmount: number;
  currentBalance: number;
  statistics:any;
}

export default function LoanStat({
  title,
  sentAmount,
  statistics,
  currentBalance,
  sx,
  ...other
}: Props) {
  const totalAmount = currentBalance - sentAmount;



  const urlPath = window.location.pathname;
  const id = urlPath.split('/').filter(Boolean).pop(); 
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenReject = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        const runrequest = await axios.post(`/admin/loans/${id}/reject`, config);
        enqueueSnackbar(runrequest.data.message);
      } catch (error) {
        console.error(error);
      }
    };
  const handleOpenApprove = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        const runrequest = await axios.post(`/admin/loans/${id}/approve`, config);
        enqueueSnackbar(runrequest.data.message);

      } catch (error) {
        console.error(error);
      }
    };

  return (
    <Card sx={{ p: 3, ...sx }} {...other}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>

      <Stack spacing={2}>
        <Typography variant="h3">₦{fCurrency(totalAmount)}</Typography>


        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Application Date
          </Typography>
          <Typography variant="subtitle1">{fDate(statistics?.applicationDate)}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loan ID
          </Typography>
          <Typography variant="body2">{statistics?._id}</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loan Purpose
          </Typography>
          <Typography variant="body2">{statistics?.purpose}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loan Term
          </Typography>
          <Typography variant="body2">{statistics?.term} Days</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Interest Rate
          </Typography>
          <Typography variant="body2">{statistics?.interestRate}%</Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Status
          </Typography>
          <Typography variant="body2">
             <Label
            variant="soft"
            color={
              (statistics?.status === 'paid' && 'success') ||
              (statistics?.status === 'active' && 'warning') ||
              'error'
            }
            sx={{ textTransform: 'capitalize' }}
          >
            {statistics?.status ? sentenceCase(statistics?.status) : ''}
          </Label>
          </Typography>
        </Stack>
        {statistics?.status === 'pending' && (
          <Stack direction="row" spacing={1.5}>
            <Button onClick={handleOpenReject} fullWidth variant="contained" color="warning">
              Reject Request
            </Button>
            <Button onClick={handleOpenApprove} fullWidth variant="contained" color="success">
              Approve Request
            </Button>
          </Stack>
        )}    

      </Stack>
    </Card>
  );
}
