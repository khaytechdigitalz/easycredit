import * as Yup from 'yup';

import { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
// next
import Head from 'next/head';

// form
import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import {
  Card,
  Table,
  TableBody,
  Container,
  TableContainer,
  Button,
  Stack,
  Box,
  Grid,
  Dialog, // Added Dialog for the modal
  DialogTitle, // Added DialogTitle
  DialogContent, // Added DialogContent
  IconButton, // Added IconButton for closing the modal
  CircularProgress, // Added for a proper loading state in the main page
} from '@mui/material';

import { LoadingButton } from '@mui/lab';

// redux
import axios from '../../../utils/axios';
// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// layouts
import DashboardLayout from '../../../layouts/dashboard';

// components
import { useSettingsContext } from '../../../components/settings';
import {
  useTable,
  getComparator,
  emptyRows,
  TableNoData,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from '../../../components/table';
import Iconify from '../../../components/iconify';
import { useSnackbar } from '../../../components/snackbar';
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
// sections
import { ProductTableRow } from '../../../sections/@dashboard/loans/purpose';

import FormProvider, {
  RHFTextField,
} from '../../../components/hook-form';

// ----------------------------------------------------------------------
// Define the specific structure of the data row (loan purpose)
export interface ICustomerItem {
  _id: string;
  text: string;
}

// Define the structure for your table header
interface HeadLabel {
  id: keyof ICustomerItem | 'actions' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

const TABLE_HEAD: HeadLabel[] = [
  { id: '_id', label: 'ID', align: 'left' },
  { id: 'text', label: 'Loan Purpose', align: 'left' },
];

// --- Form Definitions for Loan Purpose ---

// 1. Schema for Loan Purpose (Corrected from FAQ schema)
const LoanPurposeSchema = Yup.object().shape({
  text: Yup.string().required('Loan Purpose text is required'),
});

// 2. Type definition for the form values (Corrected from FAQ)
interface LoanPurposeFormValuesProps {
  text: string;
}

// ----------------------------------------------------------------------

// 3. The Loan Purpose Form Component inside the Modal (Refactored and fixed)
// Now accepts a callback function to run *after* successful submission (e.g., to close the modal and refresh data)
const LoanPurposeFormModal = ({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) => {
  const { enqueueSnackbar } = useSnackbar();
 
  // 4. Form methods are defined LOCALLY within the component
  const methods = useForm<LoanPurposeFormValuesProps>({
    resolver: yupResolver(LoanPurposeSchema),
    defaultValues: {
      text: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  // 5. Corrected onSubmit to post to the Loan Purpose endpoint and handle success/error
  const onSubmit = async (formState: LoanPurposeFormValuesProps) => {

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // 6. Corrected API endpoint to '/admin/loan/loan-purposes'
      const response = await axios.post('/admin/loan/loan-purposes', {
        text: formState.text, // Ensure the payload matches the expected structure
      });

      console.log(response.data);
      enqueueSnackbar(response.data.message || 'New Loan Purpose created successfully!');

      reset();
      onSubmitted(); // Call the callback to close the modal AND trigger a data refresh

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'An error occurred during submission.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  return (
    <Stack spacing={3} sx={{ pt: 1 }}>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <Card sx={{ p: 3 }}>
              <Box
                rowGap={3}
                columnGap={1}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(1, 1fr)',
                }}
              >
                {/* 7. Changed RHFTextField name from 'title'/'content' to 'text' */}
                <RHFTextField name="text" label="Loan Purpose Text" />
              </Box>


              <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Create Purpose
                </LoadingButton>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </FormProvider>
    </Stack>
  );
};

// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function CustomerListPage() {
  const { enqueueSnackbar } = useSnackbar();
  // 8. Added state to manually trigger a data fetch/refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. State for controlling the modal
  const [openModal, setOpenModal] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true); // Added loading state for data fetch

  const handleOpenModal = () => setOpenModal(true);

  // Use useCallback to prevent unnecessary re-renders in the modal component
  const handleCloseModal = useCallback(() => setOpenModal(false), []);

  // 9. Callback function to close modal AND trigger data refresh
  const handleFormSubmissionSuccess = useCallback(() => {
    handleCloseModal(); // Close the modal
    setRefreshTrigger(prev => prev + 1); // Increment trigger to refetch data
  }, [handleCloseModal]);


  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    selected,
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({
    defaultOrderBy: 'text', // Changed defaultOrderBy to a valid key
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<ICustomerItem[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<ICustomerItem[] | null>(null);

  // 10. Added refreshTrigger to dependency array to automatically refetch data after form submission
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsFetchingData(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        };

        const requestResponse = await axios.get('/admin/loan/loan-purposes', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
          setDashlog(requestResponse.data.data.data as ICustomerItem[]);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching loan purpose:", error);
        enqueueSnackbar('Failed to fetch loan purpose.', { variant: 'error' });
        setDashlog([]);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchDashboardData();
  }, [enqueueSnackbar, refreshTrigger]); // Dependency added

  useEffect(() => {
    if (responselog && Array.isArray(responselog)) {
      setTableData(responselog);
    }
  }, [responselog]);

  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
  }), [tableData, order, orderBy, filterName]);


  const denseHeight = dense ? 60 : 80;


  // 11. Used isFetchingData to indicate loading state instead of useSelector(state.product.isLoading)
  const isNotFound = (!dataFiltered.length && !!filterName) || (!isFetchingData && !dataFiltered.length);

  // ----------------------------------------------------------------------
  // 💾 CSV Export Function (Export logic remains the same)
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    // ... (CSV export logic)
    const headers = TABLE_HEAD
      .map(head => head.label)
      .join(',');

    const csvRows = dataFiltered.map((row) => {
      const rowData: ICustomerItem = row;
      const values = [
        rowData._id,
        rowData.text,
      ].map(value => {
        const stringValue = String(value);
        if (stringValue.includes(',')) {
          return `"${stringValue}"`;
        }
        return stringValue;
      }).join(',');

      return values;
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'loan_purpose_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------------------------------------
  // 📊 Excel Export Function (Export logic remains the same)
  // ----------------------------------------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD.map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: ICustomerItem = row;
      const rowValues = [
        rowData._id,
        rowData.text,
      ].map(value => `<td>${value}</td>`).join('');

      return `<tr>${rowValues}</tr>`;
    }).join('');

    const tableHTML = `
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
          <meta charset="utf-8">
          </head>
      <body>
        ${tableHTML}
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'loan_purpose_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Loan: Loan Purposes | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Loan Purposes"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Loan Purposes',
              href: PATH_DASHBOARD.loan.root,
            },
            { name: 'Loan Purposes' },
          ]}
          // 2. Updated action button to open the modal
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenModal} // Use onClick handler
            >
              New Purpose
            </Button>
          }
        />

        <Card>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ p: 1.5, pr: 3, pt: 0 }}
          >
            <Button
              variant="outlined"
              onClick={exportToCsv}
              startIcon={<Iconify icon="eva:file-text-fill" />}
              disabled={!dataFiltered.length}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              onClick={exportToExcel}
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
              disabled={!dataFiltered.length}
            >
              Export XLS
            </Button>
          </Stack>


          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>

            <Scrollbar>
              <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={selected.length}
                  onSort={onSort}
                />

                <TableBody>
                  {(isFetchingData ? [...Array(rowsPerPage)] : dataFiltered) // Use local fetching state
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <ProductTableRow
                          key={row._id}
                          row={row as any}
                          selected={selected.includes(row._id)}
                        />
                      ) : (
                        !isNotFound && <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      )
                    )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)}
                  />

                  {/* Show a proper loader if data is currently being fetched */}
                  {isFetchingData && (
                    <Stack justifyContent="center" alignItems="center" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255, 255, 255, 0.8)', zIndex: 1 }}>
                      <CircularProgress />
                    </Stack>
                  )}

                  <TableNoData isNotFound={isNotFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onChangePage}
            onRowsPerPageChange={onChangeRowsPerPage}
            //
            dense={dense}
            onChangeDense={onChangeDense}
          />
        </Card>
      </Container>

      {/* 3. The Modal Component */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm" // Adjust size as needed
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Create New Loan Purpose
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* 12. Pass the success handler to the form component */}
          <LoanPurposeFormModal onClose={handleCloseModal} onSubmitted={handleFormSubmissionSuccess} />
        </DialogContent>
      </Dialog>

    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: ICustomerItem[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): ICustomerItem[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: ICustomerItem[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    filteredData = filteredData.filter(
      (product) => product.text.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}