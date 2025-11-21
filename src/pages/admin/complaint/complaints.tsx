/* eslint-disable arrow-body-style */
/* eslint-disable react-hooks/rules-of-hooks */
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
  Chip,
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
import FormProvider, { RHFTextField } from '../../../components/hook-form';

// ----------------------------------------------------------------------
// 1. DATA STRUCTURES & HEADERS
// ----------------------------------------------------------------------

export interface IComplaintResponse {
  message: string;
  responderId: string;
  responderName: string;
  createdAt: string;
}

export interface IComplaintItem {
  _id: string;
  categoryId: string;
  subject: string;
  message: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  responses: IComplaintResponse[];
}

interface HeadLabel {
  id: keyof Omit<IComplaintItem, 'responses'> | 'actions' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

const TABLE_HEAD: HeadLabel[] = [
  { id: '_id', label: 'ID', align: 'left' },
  { id: 'subject', label: 'Subject', align: 'left' },
  { id: 'message', label: 'Initial Message', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
  { id: 'createdAt', label: 'Created At', align: 'left' },
  { id: 'updatedAt', label: 'Updated At', align: 'left' },
  { id: 'categoryId', label: 'Category ID', align: 'left' },
  { id: 'createdBy', label: 'User ID', align: 'left' },
  { id: 'actions', label: 'Action', align: 'center' },
];

// Helper function to format ISO date string
const formatDate = (isoString: string) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
};

// Helper function to determine the color of the status badge
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'error'; // Red
    case 'in-progress':
      return 'warning'; // Orange
    case 'closed':
    case 'close':
      return 'success'; // Green
    default:
      return 'default'; // Grey/Default
  }
};

// --- Form Definitions for Reply ---
const ReplySchema = Yup.object().shape({
  message: Yup.string().required('Reply message is required'),
});

interface ReplyFormValuesProps {
  message: string;
}

// ----------------------------------------------------------------------
// 2. MODAL AND THREAD COMPONENTS
// ----------------------------------------------------------------------

const ComplaintThreadViewAndReplyModal = ({ onClose, currentData, onSubmitted }: { onClose: () => void; currentData: IComplaintItem | null; onSubmitted: () => void; }) => {
  const { enqueueSnackbar } = useSnackbar();

  if (!currentData) return null;

  const { _id, subject,  status, createdAt, updatedAt, categoryId, createdBy, responses } = currentData;

  // Form methods for the reply input
  const methods = useForm<ReplyFormValuesProps>({
    resolver: yupResolver(ReplySchema),
    defaultValues: { message: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // CORRECTED: Use currentData.message directly, not a variable implicitly derived from form state.
  const initialMessage: IComplaintResponse = useMemo(() => ({
    message: currentData.message,
    responderId: createdBy,
    responderName: 'Initial Complaint',
    createdAt,
  }), [currentData.message, createdBy, createdAt]);

  // Combine initial message and subsequent responses, sorting by date
  const thread = useMemo(() => {
    return [initialMessage, ...responses]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [responses, initialMessage]);


  // Reply Submission Logic
  const onSubmit = async (formState: ReplyFormValuesProps) => {
    try {
      const response = await axios.post(`/admin/complaints/${_id}/reply`, {
        message: formState.message,
      });

      enqueueSnackbar(response.data.message || 'Reply sent successfully!');
      reset({ message: '' }); // Clear the input field
      onSubmitted(); // Trigger data refresh to show the new message

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'An error occurred while sending the reply.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };


  return (
    <Scrollbar sx={{ maxHeight: 650, px: 1 }}>
      <Stack spacing={2} sx={{ pt: 1 }}>

        {/* Header/Summary Card */}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{subject}</Typography>
          <Grid container spacing={1} sx={{ opacity: 0.8, fontSize: 13 }}>
            <Grid item xs={6}>
              <Typography variant="body2">Status: <Chip
                label={status}
                color={getStatusColor(status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                size="small"
              /></Typography>
              <Typography variant="body2">Category ID: {categoryId}</Typography>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="body2">Created: {formatDate(createdAt)}</Typography>
              <Typography variant="body2">Last Update: {formatDate(updatedAt)}</Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Message Thread */}
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Message Thread ({thread.length})</Typography>

        {thread.map((response, index) => (
          <Card
            key={index}
            sx={{
              p: 2,
              // Simple logic to visually separate user (primary color) from admin/system (grey)
              bgcolor: response.responderName !== 'Initial Complaint' ? 'grey.200' : 'primary.lighter',
              ml: response.responderName !== 'Initial Complaint' ? 'auto' : 0, // Pushes admin messages to the right
              width: '90%',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {response.responderName}
              <Box component="span" sx={{ fontWeight: 'normal', color: 'text.secondary', ml: 1, fontSize: 12 }}>
                ({formatDate(response.createdAt)})
              </Box>
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{response.message}</Typography>
          </Card>
        ))}

        {/* Reply Form Section */}
        <Box sx={{ mt: 4, pt: 2, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Send Reply</Typography>
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <RHFTextField
                name="message"
                label="Reply Message"
                multiline
                rows={3}
                fullWidth
              />
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                startIcon={<Iconify icon="eva:paper-plane-fill" />}
                sx={{ alignSelf: 'flex-end' }}
              >
                Send Reply
              </LoadingButton>
            </Stack>
          </FormProvider>
        </Box>


        <Stack alignItems="flex-end" sx={{ mt: 3, pt: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Close Thread View
          </Button>
        </Stack>
      </Stack>
    </Scrollbar>
  );
};

// ----------------------------------------------------------------------
// 3. TABLE ROW COMPONENT
// ----------------------------------------------------------------------

interface ComplaintTableRowProps {
  row: IComplaintItem;
  onViewRow: (row: IComplaintItem) => void;
}

function ComplaintTableRow({ row, onViewRow }: ComplaintTableRowProps) {
  const { _id, subject, message, categoryId, createdBy, status, createdAt, updatedAt } = row;

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{_id}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</TableCell>

      {/* Status Chip/Badge */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Chip
          label={status}
          color={getStatusColor(status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
          size="small"
        />
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(createdAt)}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(updatedAt)}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{categoryId}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{createdBy}</TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="View Message Thread and Reply">
          <IconButton onClick={() => onViewRow(row)}>
            <Iconify icon="eva:eye-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

ComplaintListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------
// 4. MAIN PAGE COMPONENT
// ----------------------------------------------------------------------

export default function ComplaintListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [openRespondModal, setOpenRespondModal] = useState(false);
  const [currentRespondRow, setCurrentRespondRow] = useState<IComplaintItem | null>(null);

  const [isFetchingData, setIsFetchingData] = useState(true);

  const handleOpenRespondModal = useCallback((row: IComplaintItem) => {
    setCurrentRespondRow(row);
    setOpenRespondModal(true);
  }, []);

  const handleCloseRespondModal = useCallback(() => {
    setOpenRespondModal(false);
    setCurrentRespondRow(null);
  }, []);


  // This callback refreshes the data (thread and table) after a successful reply submission.
  const handleFormSubmissionSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);


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
    defaultOrderBy: 'subject',
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<IComplaintItem[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<IComplaintItem[] | null>(null);

  // Data fetching logic (using the /admin/complaints endpoint)
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

        const requestResponse = await axios.get('/admin/complaints', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
          setDashlog(requestResponse.data.data.data as IComplaintItem[]);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching complaints log:", error);
        enqueueSnackbar('Failed to fetch complaints log.', { variant: 'error' });
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

  // --- Export functions ---

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
      const rowData: IComplaintItem = row;
      const values = [
        rowData._id,
        rowData.subject,
        rowData.message,
        rowData.status,
        rowData.createdAt,
        rowData.updatedAt,
        rowData.categoryId,
        rowData.createdBy,
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
    link.setAttribute('download', 'complaints_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Complaints exported successfully!', { variant: 'success' });
  };


  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .filter(head => head.label !== 'Action')
      .map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: IComplaintItem = row;
      const rowValues = [
        rowData._id,
        rowData.subject,
        rowData.message,
        rowData.status,
        rowData.createdAt,
        rowData.updatedAt,
        rowData.categoryId,
        rowData.createdBy,
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
    link.setAttribute('download', 'complaint_data_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };
  // --- Export functions end ---


  return (
    <>
      <Head>
        <title> Admin: Complaints | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage User Complaints"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            { name: 'Complaints' },
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
                        <ComplaintTableRow
                          key={row._id}
                          row={row as any}
                          onViewRow={handleOpenRespondModal}
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
            dense={dense}
            onChangeDense={onChangeDense}
          />
        </Card>
      </Container>

      {/* The Modal Component for VIEW/REPLY */}
      <Dialog
        open={openRespondModal}
        onClose={handleCloseRespondModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Complaint Message Thread and Reply
          <IconButton
            aria-label="close"
            onClick={handleCloseRespondModal}
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
          {currentRespondRow && (
            <ComplaintThreadViewAndReplyModal
              onClose={handleCloseRespondModal}
              currentData={currentRespondRow}
              onSubmitted={handleFormSubmissionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------------
// 5. FILTER UTILITY FUNCTION
// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: IComplaintItem[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): IComplaintItem[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: IComplaintItem[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    filteredData = filteredData.filter(
      (complaint) => complaint.subject.toLowerCase().includes(filterName.toLowerCase()) ||
                     complaint.message.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}