/* eslint-disable object-shorthand */
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
  Tooltip,
  Typography, 
  Link, 
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

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
import FormProvider, {
  RHFTextField,
} from '../../../components/hook-form';
import { fDateTime } from '../../../utils/formatTime';

// ----------------------------------------------------------------------
// INTERFACES
// ----------------------------------------------------------------------

export interface IKYCItem {
  _id: string;
  userId: string;
  tier: number;
  idType: string;
  idImagePath: string;
  selfieImagePath: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
  approvedAt: string | null;
  approvedBy: string | null;
  reason: string | null;
}

export interface IUserDetails {
  _id: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  first_name: string;
  gender: string;
  last_name: string;
  nationality: string;
  tier: number;
  updatedAt: number;
}

export interface IKYCResponseData {
  kyc: IKYCItem;
  user: IUserDetails;
}

interface HeadLabel {
  id: keyof IKYCItem | 'actions' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface KYCActionFormValuesProps {
  reason: string;
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const TABLE_HEAD: HeadLabel[] = [
  { id: '_id', label: 'KYC ID', align: 'left' },
  { id: 'userId', label: 'User ID', align: 'left' },
  { id: 'tier', label: 'Tier Level', align: 'center' },
  { id: 'idType', label: 'ID Type', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
  { id: 'createdAt', label: 'Submitted On', align: 'left' },
  { id: 'actions', label: 'Action', align: 'center' },
];

const KYCActionSchema = Yup.object().shape({
  reason: Yup.string().optional(),
});

// ----------------------------------------------------------------------
// MODAL COMPONENT: AccountTierEditFormModal
// ----------------------------------------------------------------------

const AccountTierEditFormModal = ({ onClose, onSubmitted, currentData }: { onClose: () => void; onSubmitted: () => void; currentData: IKYCItem | null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fullKYCResponse, setFullKYCResponse] = useState<IKYCResponseData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // 1. Fetch detailed KYC data on mount
  useEffect(() => {
    const fetchKYCDetails = async () => {
      if (!currentData?._id) return;

      setIsLoadingDetails(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        };

        const response = await axios.get(`/admin/kycs/${currentData._id}`, config);
        
        const responseData = response.data.data;
        if (responseData && responseData.kyc && responseData.user) {
            setFullKYCResponse(responseData as IKYCResponseData);
        } else {
            throw new Error("Invalid response structure for KYC details.");
        }

      } catch (error) {
        console.error("Error fetching KYC details:", error);
        enqueueSnackbar('Failed to fetch detailed KYC data.', { variant: 'error' });
        setFullKYCResponse(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchKYCDetails();
  }, [currentData, enqueueSnackbar]);


  const fullKYCData = fullKYCResponse?.kyc;

  const defaultValues = useMemo(() => ({
    reason: fullKYCData?.reason || '',
  }), [fullKYCData]);

  const methods = useForm<KYCActionFormValuesProps>({
    resolver: yupResolver(KYCActionSchema),
    defaultValues,
  });

  const {
    reset,
    getValues,
  } = methods;

  // Reset form when fullKYCData changes
  useEffect(() => {
      reset(defaultValues);
  }, [defaultValues, reset]);


  // Unified function for KYC approval/rejection API call
  const handleKYCAction = async (action: 'approve' | 'reject') => {
    if (!fullKYCData?._id || fullKYCData.status !== 'pending') return;

    const reason = getValues('reason') || (action === 'approve' ? 'Approved by Admin' : 'Rejected by Admin');
    const endpoint = `/admin/kycs/${fullKYCData._id}/approval`;
    
    setIsSubmittingAction(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const config = {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      };

      const payload = {
          action: action,
          reason: reason
      };

      await axios.patch(endpoint, payload, config);

      enqueueSnackbar(`KYC ${action}d successfully!`, { variant: 'success' });

      // After successful action, refresh the parent list and close the modal
      onSubmitted(); 
    } catch (error: any) {
      console.error(`Error performing KYC ${action}:`, error);
      const errorMessage = error.response?.data?.message || `An error occurred during KYC ${action} action.`;
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmittingAction(false);
    }
  };


  if (isLoadingDetails) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if both KYC and User data are loaded
  if (!fullKYCData || !fullKYCResponse?.user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Could not load KYC or User details. Please try again.</Typography>
      </Box>
    );
  }

  const fullUserData = fullKYCResponse.user;

  return (
    <Stack spacing={3} sx={{ pt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Reviewing KYC ID: **{fullKYCData._id}**
      </Typography>
      
      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>KYC Submission Details</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">User ID:</Typography>
          <Typography variant="body1">{fullKYCData.userId}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Tier Level (KYC):</Typography>
          <Typography variant="body1">{fullKYCData.tier}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">ID Type:</Typography>
          <Typography variant="body1">{fullKYCData.idType}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Status:</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{fullKYCData.status}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Submitted On:</Typography>
          <Typography variant="body1">{fDateTime(fullKYCData.createdAt)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">ID Image:</Typography>
          <Link href={fullKYCData.idImagePath} target="_blank" rel="noopener">
            View ID Image
          </Link>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Selfie Image:</Typography>
          <Link href={fullKYCData.selfieImagePath} target="_blank" rel="noopener">
            View Selfie Image
          </Link>
        </Grid>
        {fullKYCData.approvedAt && (
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Approved On:</Typography>
            <Typography variant="body1">{fullKYCData.approvedAt}</Typography>
          </Grid>
        )}
        {fullKYCData.approvedBy && (
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Approved By:</Typography>
            <Typography variant="body1">{fullKYCData.approvedBy}</Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <Typography variant="subtitle2">Admin Reason (Last Action):</Typography>
          <Typography variant="body1">{fullKYCData.reason || 'N/A'}</Typography>
        </Grid>
      </Grid>
      
      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>Associated User Details</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Full Name:</Typography>
          <Typography variant="body1">**{fullUserData.first_name} {fullUserData.last_name}**</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Email:</Typography>
          <Typography variant="body1">{fullUserData.email} ({fullUserData.emailVerified ? 'Verified' : 'Unverified'})</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Phone:</Typography>
          <Typography variant="body1">{fullUserData.phone} ({fullUserData.phoneVerified ? 'Verified' : 'Unverified'})</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Nationality:</Typography>
          <Typography variant="body1">{fullUserData.nationality}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Gender:</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{fullUserData.gender}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Current User Tier:</Typography>
          <Typography variant="body1">{fullUserData.tier}</Typography>
        </Grid>
      </Grid>

      {/* Admin Action Form */}
      <FormProvider methods={methods} >
        <Card sx={{ p: 3, mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Admin Action</Typography>
          <Box
            rowGap={3}
            columnGap={1}
            display="grid"
            gridTemplateColumns="repeat(1, 1fr)"
          >
            <RHFTextField name="reason" label="Admin Notes / Reason" multiline rows={3} />
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <LoadingButton 
              variant="outlined" 
              loading={isSubmittingAction} 
              color="error" 
              onClick={() => handleKYCAction('reject')}
              disabled={fullKYCData.status !== 'pending' || isSubmittingAction}
            >
              Reject KYC
            </LoadingButton>
            <LoadingButton 
              variant="contained" 
              loading={isSubmittingAction} 
              color="success" 
              onClick={() => handleKYCAction('approve')}
              disabled={fullKYCData.status !== 'pending' || isSubmittingAction}
            >
              Approve KYC
            </LoadingButton>
          </Stack>
        </Card>
      </FormProvider>
    </Stack>
  );
};
// ----------------------------------------------------------------------


// TABLE ROW COMPONENT: KYCTableRow
// ----------------------------------------------------------------------
interface KYCTableRowProps {
  row: IKYCItem;
  onEditRow: (row: IKYCItem) => void;
}

function KYCTableRow({ row, onEditRow }: KYCTableRowProps) {
  const { _id, userId, tier, idType, status, createdAt } = row;

  return (
    <TableRow hover>
      <Tooltip title={_id}>
        <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{_id}</TableCell>
      </Tooltip>
      <Tooltip title={userId}>
        <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{userId}</TableCell>
      </Tooltip>
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{tier}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{idType}</TableCell>
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            color: 'white',
            // eslint-disable-next-line no-nested-ternary
            bgcolor: status === 'approved' ? 'success.main' : status === 'rejected' ? 'error.main' : 'warning.main',
            textTransform: 'capitalize',
            display: 'inline-block'
          }}
        >
          {status}
        </Box>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDateTime(createdAt)}</TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Review KYC">
          <IconButton onClick={() => onEditRow(row)}>
            <Iconify icon="eva:menu-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

// MAIN PAGE COMPONENT: CustomerListPage
// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function CustomerListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for controlling the EDIT modal and holding the current row data
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentEditRow, setCurrentEditRow] = useState<IKYCItem | null>(null);

  const [isFetchingData, setIsFetchingData] = useState(true);

  // Handlers for EDIT Modal
  const handleOpenEditModal = useCallback((row: IKYCItem) => {
    setCurrentEditRow(row);
    setOpenEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setOpenEditModal(false);
    setCurrentEditRow(null); // Clear the row data when modal closes
  }, []);


  // Callback function to close modal AND trigger data refresh
  const handleFormSubmissionSuccess = useCallback(() => {
    handleCloseEditModal();   // Close edit modal if open
    setRefreshTrigger(prev => prev + 1); // Increment trigger to refetch data
  }, [handleCloseEditModal]);


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
    defaultOrderBy: 'createdAt',
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<IKYCItem[]>([]);
  const [filterName] = useState('');
  const [responselog, setDashlog] = useState<IKYCItem[] | null>(null);

  // Data fetching logic
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

        const requestResponse = await axios.get('/admin/kycs', config);
        
        // Handle common nested response structures
        if (requestResponse.data?.data?.data && Array.isArray(requestResponse.data.data.data)) { 
          setDashlog(requestResponse.data.data.data as IKYCItem[]);
        } else if (requestResponse.data?.data && Array.isArray(requestResponse.data.data)) { 
            setDashlog(requestResponse.data.data as IKYCItem[]);
        }
        else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching KYC log:", error);
        enqueueSnackbar('Failed to fetch KYC log.', { variant: 'error' });
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

  // CSV Export Function
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .map(head => head.label)
      .filter(label => label !== 'Action')
      .join(',');

    const csvRows = dataFiltered.map((row) => {
      const rowData: IKYCItem = row;
      const values = [
        rowData._id,
        rowData.userId,
        rowData.tier,
        rowData.idType,
        rowData.status,
        fDateTime(rowData.createdAt),
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
    link.setAttribute('download', 'kyc_data_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('KYC data exported successfully!', { variant: 'success' });
  };


  // Excel Export Function
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .filter(head => head.label !== 'Action')
      .map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: IKYCItem = row;
      const rowValues = [
        rowData._id,
        rowData.userId,
        rowData.tier,
        rowData.idType,
        rowData.status,
        fDateTime(rowData.createdAt),
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
    link.setAttribute('download', 'kyc_data_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Account: KYC Management | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage KYC Data"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'KYC Management',
              href: PATH_DASHBOARD.contact.root,
            },
            { name: 'KYC Records' },
          ]}
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
                        <KYCTableRow
                          key={row._id}
                          row={row as any}
                          onEditRow={handleOpenEditModal}
                        />
                      ) : (
                        !isNotFound && <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      )
                    )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)}
                  />

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

      {/* The Modal Component for KYC Review */}
      <Dialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Review KYC Data
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
          {currentEditRow && (
            <AccountTierEditFormModal
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
// HELPER FUNCTION: applyFilter
// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: IKYCItem[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): IKYCItem[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: IKYCItem[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    // Filter on 'userId' or 'idType' for KYC data
    filteredData = filteredData.filter(
      (item) => item.userId.toLowerCase().includes(filterName.toLowerCase()) ||
                 item.idType.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}