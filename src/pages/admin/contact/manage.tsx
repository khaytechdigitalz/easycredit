import * as Yup from 'yup';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Tooltip, // Added Tooltip for the Edit button
} from '@mui/material';

import { LoadingButton } from '@mui/lab';

import TableRow from '@mui/material/TableRow'; // Import TableRow
import TableCell from '@mui/material/TableCell'; // Import TableCell
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
// sections (Renaming ProductTableRow to ContactTableRow for context)
// import { ProductTableRow } from '../../../sections/@dashboard/contact'; // This line needs to be replaced or the component defined
 
import FormProvider, {
  RHFTextField,
} from '../../../components/hook-form';

// ----------------------------------------------------------------------
// Define the specific structure of the data row (loan purpose)
export interface ICustomerItem {
  _id: string;
  name: string;
  value: string;
}

// Define the structure for your table header
interface HeadLabel {
  id: keyof ICustomerItem | 'actions' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

const TABLE_HEAD: HeadLabel[] = [
  { id: '_id', label: 'ID', align: 'left' },
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'value', label: 'Value', align: 'left' },
  { id: 'actions', label: 'Action', align: 'center' }, // Corrected ID to 'actions'
];

// --- Form Definitions for Loan Purpose ---

// 1. Schema for Loan Purpose (Corrected from FAQ schema)
const LoanPurposeSchema = Yup.object().shape({
  name: Yup.string().required('Name text is required'),
  value: Yup.string().required('Value text is required'),
});

// 2. Type definition for the form values (Corrected from FAQ)
interface ContactPurposeFormValuesProps {
  name: string;
  value: string;
}

// ----------------------------------------------------------------------
// 🏆 NEW: Edit Modal Form Component
// ----------------------------------------------------------------------
const LoanPurposeEditFormModal = ({ onClose, onSubmitted, currentData }: { onClose: () => void; onSubmitted: () => void; currentData: ICustomerItem | null }) => {
  const { enqueueSnackbar } = useSnackbar();

  // Set default values based on currentData for editing
  const defaultValues = useMemo(() => ({
    name: currentData?.name || '',
    value: currentData?.value || '',
  }), [currentData]);
 
  // Form methods are defined LOCALLY within the component
  const methods = useForm<ContactPurposeFormValuesProps>({
    resolver: yupResolver(LoanPurposeSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Reset form when currentData changes
  useEffect(() => {
      reset(defaultValues);
  }, [defaultValues, reset]);


  // Corrected onSubmit to patch to the Loan Purpose endpoint and handle success/error
  const onSubmit = async (formState: ContactPurposeFormValuesProps) => {
    if (!currentData?._id) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Corrected API endpoint to PATCH for update
      const response = await axios.patch(`/admin/contact-us/${currentData._id}`, {
        name: formState.name,
        value: formState.value,
      });

      console.log(response.data);
      enqueueSnackbar(response.data.message || 'Contact data updated successfully!');

      onSubmitted(); // Call the callback to close the modal AND trigger a data refresh

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'An error occurred during update.';
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
                <RHFTextField name="name" label="Contact Name" />
                <RHFTextField name="value" label="Contact Value" />
              </Box>

              <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Save Changes
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

// 3. The Loan Purpose Form Component inside the Modal (Refactored and fixed)
const LoanPurposeFormModal = ({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) => {
  const { enqueueSnackbar } = useSnackbar();
 
  // Form methods are defined LOCALLY within the component
  const methods = useForm<ContactPurposeFormValuesProps>({
    resolver: yupResolver(LoanPurposeSchema),
    defaultValues: {
      name: '',
      value: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  // Corrected onSubmit to post to the Loan Purpose endpoint and handle success/error
  const onSubmit = async (formState: ContactPurposeFormValuesProps) => {

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Corrected API endpoint to '/admin/contact-us'
      const response = await axios.post('/admin/contact-us', {
        name: formState.name,
        value: formState.value,
      });

      console.log(response.data);
      enqueueSnackbar(response.data.message || 'New contact data created successfully!');

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
                <RHFTextField name="name" label="Contact Name" />
                <RHFTextField name="value" label="Contact Value" />
              </Box>


              <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Create Data
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


// 🏆 NEW: ContactTableRow Component definition (since it was missing)
// This replaces the ProductTableRow import and provides the Edit button
interface ContactTableRowProps {
  row: ICustomerItem;
  onEditRow: (row: ICustomerItem) => void;
}

function ContactTableRow({ row, onEditRow }: ContactTableRowProps) {
  const { _id, name, value } = row;

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{_id}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{value}</TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => onEditRow(row)}>
            <Iconify icon="eva:edit-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function CustomerListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. State for controlling the CREATE modal
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // 🏆 NEW: State for controlling the EDIT modal and holding the current row data
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentEditRow, setCurrentEditRow] = useState<ICustomerItem | null>(null);

  const [isFetchingData, setIsFetchingData] = useState(true);

  // Handlers for CREATE Modal
  const handleOpenCreateModal = () => setOpenCreateModal(true);
  const handleCloseCreateModal = useCallback(() => setOpenCreateModal(false), []);

  // Handlers for EDIT Modal
  const handleOpenEditModal = useCallback((row: ICustomerItem) => {
    setCurrentEditRow(row);
    setOpenEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setOpenEditModal(false);
    setCurrentEditRow(null); // Clear the row data when modal closes
  }, []);


  // Callback function to close modal AND trigger data refresh
  const handleFormSubmissionSuccess = useCallback(() => {
    handleCloseCreateModal(); // Close create modal if open
    handleCloseEditModal();   // Close edit modal if open
    setRefreshTrigger(prev => prev + 1); // Increment trigger to refetch data
  }, [handleCloseCreateModal, handleCloseEditModal]);


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
    defaultOrderBy: 'name', // Changed defaultOrderBy to a valid key
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<ICustomerItem[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<ICustomerItem[] | null>(null);

  // Data fetching logic (unchanged, but now uses refreshTrigger)
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

        const requestResponse = await axios.get('/admin/contact-us', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
          setDashlog(requestResponse.data.data.data as ICustomerItem[]);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching contact log:", error);
        enqueueSnackbar('Failed to fetch contact log.', { variant: 'error' });
        setDashlog([]);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchDashboardData();
  }, [enqueueSnackbar, refreshTrigger]);

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


  const isNotFound = (!dataFiltered.length && !!filterName) || (!isFetchingData && !dataFiltered.length);

  // ----------------------------------------------------------------------
  // 💾 CSV Export Function (Export logic remains the same)
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .map(head => head.label)
      .filter(label => label !== 'Action') // Exclude the Action column
      .join(',');

    const csvRows = dataFiltered.map((row) => {
      const rowData: ICustomerItem = row;
      const values = [
        rowData._id,
        rowData.name,
        rowData.value,
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
    link.setAttribute('download', 'contact_data_list.csv');
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

    const headers = TABLE_HEAD
      .filter(head => head.label !== 'Action')
      .map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: ICustomerItem = row;
      const rowValues = [
        rowData._id,
        rowData.name,
        rowData.value,
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
    link.setAttribute('download', 'contact_data_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Contact: Contact Data | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Contact Data"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Contact Data',
              href: PATH_DASHBOARD.contact.root,
            },
            { name: 'Contact Data' },
          ]}
          // Action button to open the CREATE modal
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenCreateModal}
            >
              New Data
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
                  {(isFetchingData ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        // Use the new ContactTableRow with onEditRow prop
                        <ContactTableRow
                          key={row._id}
                          row={row as any}
                          onEditRow={handleOpenEditModal} // Pass the handler to open the edit modal
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

      {/* 3. The Modal Component for CREATE */}
      <Dialog
        open={openCreateModal}
        onClose={handleCloseCreateModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Create New Contact Data
          <IconButton
            aria-label="close"
            onClick={handleCloseCreateModal}
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
          <LoanPurposeFormModal onClose={handleCloseCreateModal} onSubmitted={handleFormSubmissionSuccess} />
        </DialogContent>
      </Dialog>

      {/* 🏆 NEW: The Modal Component for EDIT */}
      <Dialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Edit Contact Data
          <IconButton
            aria-label="close"
            onClick={handleCloseEditModal}
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
          {/* Render the edit form only if currentEditRow has data */}
          {currentEditRow && (
            <LoanPurposeEditFormModal
              onClose={handleCloseEditModal}
              onSubmitted={handleFormSubmissionSuccess}
              currentData={currentEditRow}
            />
          )}
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
      (product) => product.name.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}