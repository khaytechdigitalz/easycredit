// next
import Head from 'next/head';
// @mui
import { useTheme } from '@mui/material/styles';
import { Container, Grid, CircularProgress } from '@mui/material'; // Added CircularProgress for loading
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios'; // Assuming '../../utils/axios' is configured

// layouts
import DashboardLayout from '../../layouts/dashboard';
// _mock_
import { 
  _appInvoices,
} from '../../_mock/arrays';
// components
import { useSettingsContext } from '../../components/settings';
// sections
import {
  AppWelcome,
  AppNewInvoice,  
  AppAreaInstalled,
  AppWidgetSummary,
  AppCurrentDownload,
 } from '../../sections/@dashboard/general/app';
// assets
import { SeoIllustration } from '../../assets/illustrations';


// --- Interface defined outside or above the component ---
interface DashStats {
  loanDisbursed: number;
  totalRepayment: number;
  totalOutstanding: number;
  totalArrears: number;
  // Include nested objects/arrays if you plan to use them for charts
}
// ----------------------------------------------------------------------

GeneralAppPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// ----------------------------------------------------------------------

export default function GeneralAppPage() {
  // 1. Define state for data, loading, and error
  const [dashStat, setDashStat] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Use useEffect for data fetching
  useEffect(() => {
    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            if (!accessToken) {
                // Handle case where token is missing (e.g., redirect to login)
                throw new Error("Access token not found. Please log in.");
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }; 
            
            // Use the DashStats type parameter for type-safe response data
            const response = await axios.get<DashStats>('/admin-dashboard/d/stats', config); 
            
            // 3. Save the data to state
            setDashStat(response.data); 
            console.info("Dashboard stats fetched:", response.data);

        } catch (err) { 
            console.error(err);
            // Properly handle and set error state
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data.');
        } finally {
            setIsLoading(false);
        }
    };

    fetchStats();
  }, []); // Run once on component mount
// END GET DASHBOARD STAT
 
  const theme = useTheme();

  const { themeStretch } = useSettingsContext();

  // 4. Handle Loading and Error states in the component render
  if (isLoading) {
    return (
        <Container maxWidth={themeStretch ? false : 'xl'} style={{ textAlign: 'center', padding: '50px' }}>
            <CircularProgress />
            <p>Loading dashboard...</p>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth={themeStretch ? false : 'xl'} style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <p>Error: {error}</p>
        </Container>
    );
  }

  // Ensure data exists before accessing its properties in JSX
  const stats = dashStat || ({} as DashStats); 

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
             
          {/* 5. Use the dashStat state to populate AppWidgetSummary components */}
          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Loan Disbursed"
              total={stats.loanDisbursed || 0} // Use the fetched data
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Repayment"
               total={stats.totalRepayment || 0} // Use the fetched data
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Outstanding"
               total={stats.totalOutstanding || 0} // Use the fetched data
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Arrears"
               total={stats.totalArrears || 0} // Use the fetched data
            />
          </Grid>

          {/* ... rest of the components remain the same unless they also need API data */}

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
                  { label: 'Awaiting Disbursement', value: 12244 },
                  { label: 'Pending Approval', value: 78343 },
                  { label: 'Rejected', value: 53345 },
                  { label: 'Closed', value: 44313 },
                  { label: 'Active', value: 78343 },
                ],
              }}
            />
          </Grid>

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

          <Grid item xs={12} lg={12}>
            <AppNewInvoice
              title="Recent Loan"
              tableData={_appInvoices}
              tableLabels={[
                { id: 'id', label: 'Loan ID' },
                { id: 'category', label: 'Loan Type' },
                { id: 'price', label: 'Amount' },
                { id: 'status', label: 'Status' },
                { id: '' },
              ]}
            />
          </Grid>

          {/* ... rest of the JSX body */}
           
        </Grid>
      </Container>
    </>
  );
}


/*
// next
import Head from 'next/head';
// @mui
import { useTheme } from '@mui/material/styles';
import { Container, Grid } from '@mui/material';
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';


// layouts
import DashboardLayout from '../../layouts/dashboard';
// _mock_
import { 
  _appInvoices,
} from '../../_mock/arrays';
// components
import { useSettingsContext } from '../../components/settings';
// sections
import {
  AppWelcome,
  AppNewInvoice,  
  AppAreaInstalled,
  AppWidgetSummary,
  AppCurrentDownload,
 } from '../../sections/@dashboard/general/app';
// assets
import { SeoIllustration } from '../../assets/illustrations';

// ----------------------------------------------------------------------

GeneralAppPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// ----------------------------------------------------------------------

export default function GeneralAppPage() {

// GET DASHBOARD STAT

(async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }; 
        const response = await axios.get('/admin-dashboard/d/stats', config); 
        const  dashstat = response.data; 
        console.info(dashstat);
    } catch (error) { 
        console.error(error);
    }
})();

// END GET DASHBOARD STAT
 
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
              action={<Button variant="contained">Go Now</Button>} 
            />
          </Grid>
             

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Loan Disbursed"
              total={43} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Repayment"
               total={4876} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Outstanding"
               total={678} 
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <AppWidgetSummary
              title="Total Arears"
               total={678} 
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
                  { label: 'Awaiting Disbursement', value: 12244 },
                  { label: 'Pending Approval', value: 78343 },
                  { label: 'Rejected', value: 53345 },
                  { label: 'Closed', value: 44313 },
                  { label: 'Active', value: 78343 },
                ],
              }}
            />
          </Grid>

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

          <Grid item xs={12} lg={12}>
            <AppNewInvoice
              title="Recent Loan"
              tableData={_appInvoices}
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
*/
