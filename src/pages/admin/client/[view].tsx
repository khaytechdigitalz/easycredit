import { useState } from 'react';
// next
import Head from 'next/head';
// @mui
import { Container, Tab, Tabs, Box } from '@mui/material';
// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// layouts
import DashboardLayout from '../../../layouts/dashboard';
// components
import Iconify from '../../../components/iconify';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
import { useSettingsContext } from '../../../components/settings';
// sections
import {
  AccountGeneral,
  AccountBilling,
  AccountLoans,
  AccountBills,
  AccountTransfer,
  AccountChangePassword,
} from '../../../sections/@dashboard/users/account';

// ----------------------------------------------------------------------

UserAccountPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// ----------------------------------------------------------------------

export default function UserAccountPage() {
  const { themeStretch } = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('general');

  const TABS = [
    {
      value: 'general',
      label: 'Account',
      icon: <Iconify icon="ic:round-account-box" />,
      component: <AccountGeneral />,
    },
    {
      value: 'billing',
      label: 'Wallet',
      icon: <Iconify icon="ic:round-wallet" />,
      component: (
        <AccountBilling
          cards={[]}
          addressBook={[]}
        />
      ),
    },

    {
      value: 'loan',
      label: 'Loans',
      icon: <Iconify icon="ic:round-money" />,
      component: <AccountLoans />,
    },

    {
      value: 'bills',
      label: 'Bills',
      icon: <Iconify icon="ic:round-shopping-cart" />,
      component: <AccountBills />,
    },

    {
      value: 'transfer',
      label: 'Tranfer',
      icon: <Iconify icon="ic:round-money" />,
      component: <AccountTransfer />,
    },
    
    {
      value: 'change_password',
      label: 'Change password',
      icon: <Iconify icon="ic:round-vpn-key" />,
      component: <AccountChangePassword />,
    },
  ];

  return (
    <>
      <Head>
        <title> User: Customers Details | EasyCredit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Customer Details"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            { name: 'Customers', href: PATH_DASHBOARD.user.root },
            { name: 'Details' },
          ]}
        />

        <Tabs value={currentTab} onChange={(event, newValue) => setCurrentTab(newValue)}>
          {TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
          ))}
        </Tabs>

        {TABS.map(
          (tab) =>
            tab.value === currentTab && (
              <Box key={tab.value} sx={{ mt: 5 }}>
                {tab.component}
              </Box>
            )
        )}
      </Container>
    </>
  );
}
