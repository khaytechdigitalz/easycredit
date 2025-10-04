import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useTheme } from '@mui/material/styles';
import { Container, Grid } from '@mui/material';
import axios from '../../utils/axios';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import {
  AppWelcome,
  AppNewInvoice,
   AppWidgetSummary,
  AppCurrentDownload,
} from '../../sections/@dashboard/general/app';
import { SeoIllustration } from '../../assets/illustrations';

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
            <AppWidgetSummary
              title="Loan Disbursed"
              total={dashstat?.loanDisbursed || 0} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Repayment"
              total={dashstat?.totalRepayment || 0} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Outstanding"
              total={dashstat?.totalOutstanding || 0} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Arears"
              total={dashstat?.totalArrears || 0} 
            />
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
            
          { /*
          <Grid item xs={12} md={6} lg={8}>
            <AppAreaInstalled
              title="Collection Statistics"
              subheader="Collection statistics on the platform"
              chart={{
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep','Oct','Nov', 'Dec'],
                series: [
                  {
                    year: '2019',
                    data: [
                      { name: 'Asia', data: [10, 41, 35, 51, 49, 62, 69, 91, 148,234,234,232] },
                      { name: 'America', data: [10, 34, 13, 56, 77, 88, 99, 77, 45,234,234,232] },
                    ],
                  },
                  {
                    year: '2020',
                    data: [
                      { name: 'Asia', data: [148, 91, 69, 62, 49, 51, 35, 41, 10] },
                      { name: 'America', data: [45, 77, 99, 88, 77, 56, 13, 34, 10] },
                    ],
                  },
                ],
              }}
            />
          </Grid>
          */ }

          <Grid item xs={12} md={6} lg={8}>
            <AppNewInvoice
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