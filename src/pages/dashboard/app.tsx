import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useTheme } from '@mui/material/styles';
import { Container, Grid } from '@mui/material';
import axios from '../../utils/axios';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import {
  AppWelcome,
  AppLoanLog,
  AppCurrentDownload,
} from '../../sections/@dashboard/general/dashboard';
import { SeoIllustration,BookingIllustration } from '../../assets/illustrations';
 
import { 
  BookingWidgetSummary, 
} from '../../sections/@dashboard/loans/stat';

GeneralAppPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

export default function GeneralAppPage() {
  const [dashstat, setDashstat] = useState<any>(null);
  const [dashlog, setDashlog] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        };

        const response = await axios.get('/admin-dashboard/d/stats', config);
        setDashstat(response.data);

        const loansResponse = await axios.get('/admin-dashboard/d/recent-loans', config);
        setDashlog(loansResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, []);

  const theme = useTheme();
  const { themeStretch } = useSettingsContext();

  return (
    <>
      <Head>
        <title> Admin Dashboard | EasyCredit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <AppWelcome
              title={`Welcome back! \n Super Admin`}
              description="Welcome back to your admin dashboard. Please find below the system transactions and operational overview."
              img={
                <SeoIllustration
                  sx={{
                    p: 3,
                    width: 360,
                    margin: { xs: 'auto', md: 'inherit' },
                  }}
                />
              }
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
              <BookingWidgetSummary image="/assets/icons/payments/5.png" title="Loan Disbursed" total={dashstat?.loanDisbursed || 0} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={3}>
              <BookingWidgetSummary image="/assets/icons/payments/4.png" title="Total Repayment" total={dashstat?.totalRepayment || 0}  icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={3}>
              <BookingWidgetSummary image="/assets/icons/payments/7.png" title="Total Outstanding" total={dashstat?.totalOutstanding || 0} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={3}>
              <BookingWidgetSummary image="/assets/icons/payments/1.png" title="Total Arrears" total={dashstat?.totalArrears || 0}  icon={<BookingIllustration />} />
            </Grid>

           
          
          <Grid item xs={12} md={6} lg={4}>
            <AppCurrentDownload
              title="Loan Disbursement Statistics"
              chart={{
                colors: [
                  theme.palette.primary.main,
                  theme.palette.info.main,
                  theme.palette.error.main,
                  theme.palette.warning.main,
                ],
                series: [
                  { label: 'Awaiting Disbursement', value: dashstat?.loanAwaitingDisbursement || 0 },
                  { label: 'Pending Approval', value: dashstat?.loanPendingApproval || 0 },
                  { label: 'Rejected', value: dashstat?.loanRejected || 0 },
                  { label: 'Closed', value: dashstat?.loanClosed || 0 },
                  { label: 'Active', value: dashstat?.loanActive || 0 },
                ],
              }}
            />
          </Grid>
             
          <Grid item xs={12} md={6} lg={8}>
            <AppLoanLog
              title="Recent Loan"
              tableData={dashlog || []}
              tableLabels={[
                { id: 'id', label: 'Loan ID' },
                { id: 'category', label: 'Loan Type' },
                { id: 'price', label: 'Amount' },
                { id: 'status', label: 'Status' },
                { id: '' },
              ]}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}