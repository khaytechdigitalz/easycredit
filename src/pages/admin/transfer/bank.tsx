/* eslint-disable @typescript-eslint/no-shadow */
import { useState, useEffect, useMemo } from 'react';
// next
import Head from 'next/head';

// @mui
import {
  Card,
  Table,
  TableBody,
  Container,
  Grid,
  TableContainer,
  Button,
  Stack,
  // 💡 NEW IMPORTS FOR MODAL
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  // NEW IMPORTS FOR LOCAL ROW COMPONENT
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
// redux
import axios from '../../../utils/axios';
import { useSelector } from '../../../redux/store';
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
  TableSelectedAction,
  TablePaginationCustom,
} from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
import Iconify from '../../../components/iconify';
import { useSnackbar } from '../../../components/snackbar';
// sections (REMOVED ProductTableRow, kept ProductTableToolbar)
import { ProductTableToolbar } from '../../../sections/@dashboard/transfer/list'; 
// utilities
import { fDateTime } from '../../../utils/formatTime';
import { fCurrency } from '../../../utils/formatNumber';
import Label from '../../../components/label';
// NOTE: CustomPopover and usePopover import HAS BEEN REMOVED

import { 
  BookingWidgetSummary, 
} from '../../../sections/@dashboard/transfer/stat';
// assets
import {
  BookingIllustration, 
} from '../../../assets/illustrations';

// ----------------------------------------------------------------------

// Define the specific structure of the data row based on your table
export interface ITransferItem {
  _id: string; // Key for iteration/selection
  date: string; // Mapped from 'paidAt' or 'createdAt'
  userId: string; 
  reference: string;
  bankName: string; // Mapped from providerResponse.transfer.metadata.bankName
  accountNumber: string | number; // Mapped from providerResponse.transfer.metadata.accountNumber
  accountName: string; // Mapped from providerResponse.transfer.metadata.accountName
  amount: number;
  status: string;
}

// Corrected TABLE_HEAD with Action column added
const TABLE_HEAD = [
  { id: 'date', label: 'Date', align: 'left' }, 
  { id: 'userId', label: 'User ID', align: 'left' },
  { id: 'reference', label: 'Reference', align: 'left' },
  { id: 'bankName', label: 'Bank Name', align: 'left' },
  { id: 'accountNumber', label: 'Account Number', align: 'left' }, 
  { id: 'accountName', label: 'Account Name', align: 'left' }, 
  { id: 'amount', label: 'Amount', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
  // 💡 NEW COLUMN
  { id: 'action', label: 'Action', align: 'center', minWidth: 120 }, 
];

const STATUS_OPTIONS = [
  { value: 'success', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' }, 
  { value: 'reversed', label: 'Reversed' }, 
];

// ----------------------------------------------------------------------
// 🌟 NEW LOCAL ROW COMPONENT (Replaces ProductTableRow and removes popover)
// ----------------------------------------------------------------------

interface TransferTableRowProps {
  row: ITransferItem;
  selected: boolean;
  onSelectRow: () => void;
  onFailReverseClick: (row: ITransferItem) => void;
}

function TransferTableRow({
  row,
  selected,
  onSelectRow,
  onFailReverseClick,
}: TransferTableRowProps) {
  const { 
    date, 
    userId, 
    reference, 
    bankName, 
    accountNumber, 
    accountName, 
    amount, 
    status,
  } = row;


  // Helper function to determine the color of the status label
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'successful':
        return 'success';
      case 'failed':
        return 'error';
      case 'reversed':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Logic to show the Fail Reverse button: show only for 'failed' status
  const showFailReverse = status.toLowerCase() === 'failed';

  return (
    <TableRow hover selected={selected}>
      {/* Checkbox column removed for brevity, assuming standard implementation */}

      <TableCell>{fDateTime(date)}</TableCell>
      <TableCell>{userId}</TableCell>
      <TableCell>{reference}</TableCell>
      <TableCell>{bankName}</TableCell>
      <TableCell>{accountNumber}</TableCell>
      <TableCell>{accountName}</TableCell>
      <TableCell>{fCurrency(amount)}</TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(status)}>
          {status}
        </Label>
      </TableCell>

      {/* 💡 ACTION BUTTON CELL */}
      <TableCell align="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          
          {/* Fail Reverse Button */}
          {showFailReverse && (
            <Tooltip title="Fail Reverse: Click to initiate reversal." arrow>
              <IconButton 
                color="error"
                // 🔑 Critical: Call the handler passed from the parent with the current row data
                onClick={() => onFailReverseClick(row)}
              >
                <Iconify icon="eva:flash-fill" /> 
              </IconButton>
            </Tooltip>
          )}

          {/* If the status is NOT failed, show a disabled button/icon */}
          {!showFailReverse && (
             <Tooltip title="Action not available for this status" arrow>
                <IconButton 
                  color="default"
                  disabled
                >
                  <Iconify icon="eva:slash-fill" /> 
                </IconButton>
             </Tooltip>
          )}

        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

TransferPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function TransferPage() {
  const { enqueueSnackbar } = useSnackbar();

  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    //
    selected,
    onSelectRow,
    onSelectAllRows,
    //
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({
    defaultOrderBy: 'date',
  });

  const { themeStretch } = useSettingsContext();


  const { isLoading } = useSelector((state) => state.product);

  const [tableData, setTableData] = useState<ITransferItem[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const [responselog, setDashlog] = useState<any>(null);

  // 💡 NEW STATE FOR MODAL AND ROW DATA
  const [openFailReverseModal, setOpenFailReverseModal] = useState(false);
  const [selectedRowToReverse, setSelectedRowToReverse] = useState<ITransferItem | null>(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        // Endpoint for Bank Transfer Log
        const apiResponse = await axios.get('/admin/bill/history/transfer', config);

        setDashlog(apiResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, []);
 
  
  useEffect(() => {
    const dataFromApi = responselog?.data?.data;

    const processData = (data: any[] | Record<string, any>) => {
      const finalArray: any[] = Array.isArray(data) ? data : Object.values(data || {});

      // 🔑 UPDATED PROCESSING LOGIC
      const processedData: ITransferItem[] = finalArray.map((item) => {
        // Safely access nested metadata
        const metadata = item.providerResponse?.transfer?.metadata || {};
        const transferData = item.providerResponse?.transfer || {};

        return {
          _id: item._id,
          // Use paidAt if available (more accurate completion time), otherwise createdAt
          date: transferData.paidAt || item.createdAt, 
          userId: item.userId,
          reference: item.reference,
          // Extracting nested fields:
          bankName: metadata.bankName || item.providerType || 'N/A',
          accountNumber: metadata.accountNumber || item.recipient || 'N/A', // Fallback to recipient
          accountName: metadata.accountName || item.customerAccountNo || 'N/A', // Fallback to customerAccountNo
          amount: item.amount || transferData.total || 0,
          status: item.status,
        } as ITransferItem;
      });
        
      if (processedData.every(item => item && '_id' in item)) {
          setTableData(processedData);
      } else {
          console.warn('Data structure mismatch or missing primary key.', finalArray);
          setTableData([]);
      }
    };

    if (dataFromApi) {
      processData(dataFromApi);
    } else if (Array.isArray(responselog)) {
      processData(responselog);
    }
  }, [responselog]);


  
  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
  }), [tableData, order, orderBy, filterName, filterStatus]);


  const denseHeight = dense ? 60 : 80;

  const isFiltered = filterName !== '' || !!filterStatus.length;

  const isNotFound = (!dataFiltered.length && !!filterName) || (!isLoading && !dataFiltered.length);
 
  const handleFilterName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleFilterStatus = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setPage(0);
    setFilterStatus(typeof value === 'string' ? value.split(',') : value);
  };
  
  const handleResetFilter = () => {
    setFilterName('');
    setFilterStatus([]);
  };

  // 💡 HANDLERS FOR ACTION BUTTON AND API CALL
  const handleOpenFailReverseModal = (row: ITransferItem) => {
      setSelectedRowToReverse(row);
      setOpenFailReverseModal(true);
  };

  const handleCloseFailReverseModal = () => {
      setOpenFailReverseModal(false);
      setSelectedRowToReverse(null);
  };

  const handleFailReverseAction = async () => {
      if (!selectedRowToReverse) return;

      const transactionId = selectedRowToReverse._id;

      handleCloseFailReverseModal(); // Close modal immediately

      try {
          const accessToken = localStorage.getItem('accessToken');
          const config = {
              headers: {
                  'Authorization': `Bearer ${accessToken}`
              }
          };

          // Call the specified endpoint /admin/bill/fail_reverse/{data._id}
          await axios.put(`/admin/bill/fail_reverse/${transactionId}`, null, config); 

          // Update the table data locally to reflect the change (optional: status update)
          setTableData(prevData =>
              prevData.map(item =>
                  item._id === transactionId ? { ...item, status: 'Reversed' } : item
              )
          );
          
          enqueueSnackbar(`Fail Reverse successful for ID: ${transactionId}`, { variant: 'success' });
      } catch (error) {
          console.error('Fail Reverse Error:', error);
          enqueueSnackbar('Fail Reverse action failed!', { variant: 'error' });
      }
  };


  // ----------------------------------------------------------------------
  // 💾 CSV Export Function (Updated to exclude 'Action')
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
        enqueueSnackbar('No data to export.', { variant: 'warning' });
        return;
    }
    
    // 1. Prepare Headers (use labels from TABLE_HEAD, exclude 'Action')
    const headers = TABLE_HEAD
        .filter(head => head.id !== 'action') 
        .map(head => head.label)
        .join(',');

    // 2. Prepare Data Rows 
    const csvRows = dataFiltered.map((row) => {
        const rowData = row as ITransferItem;
        const values = [
            rowData.date, 
            rowData.userId, 
            rowData.reference, 
            rowData.bankName, 
            rowData.accountNumber, 
            rowData.accountName, 
            rowData.amount, 
            rowData.status,
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
    link.setAttribute('download', 'bank_transfer_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------------------------------------
  // 📊 Excel Export Function (Updated to exclude 'Action')
  // ----------------------------------------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
        enqueueSnackbar('No data to export.', { variant: 'warning' });
        return;
    }

    // 1. Prepare Headers (use labels from TABLE_HEAD, exclude 'Action')
    const headers = TABLE_HEAD
        .filter(head => head.id !== 'action')
        .map(head => `<th>${head.label}</th>`)
        .join('');
    
    const tableRows = dataFiltered.map((row) => {
      const rowData = row as ITransferItem;
      const rowValues = [
          rowData.date, 
          rowData.userId, 
          rowData.reference, 
          rowData.bankName, 
          rowData.accountNumber, 
          rowData.accountName, 
          rowData.amount, 
          rowData.status,
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
    link.setAttribute('download', 'bank_transfer_log.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };

  return (
    <>
      <Head>
        <title> Transfer: Bank Transfer Log | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Transfer Log"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Transfer',
              href: '',
            },
            { name: 'Bank Transfer' },
          ]}
        />
        
        <Grid container spacing={3}>

            <Grid item xs={12} md={12}>
              <BookingWidgetSummary image="/assets/icons/payments/bank.png" title="Total Transfers" total={responselog?.data ? responselog.data.total : '0'} icon={<BookingIllustration />} />
            </Grid>
 
        </Grid>
          <br/>

        <Card>
          {/* 1. Existing Toolbar */}
          <ProductTableToolbar
            filterName={filterName}
            filterStatus={filterStatus}
            onFilterName={handleFilterName}
            onFilterStatus={handleFilterStatus}
            statusOptions={STATUS_OPTIONS}
            isFiltered={isFiltered}
            onResetFilter={handleResetFilter}
          />

          {/* 2. Export Buttons placed right after the toolbar */}
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
          {/* END OF EXPORT BUTTONS */}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={dense}
              numSelected={selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                onSelectAllRows(
                  checked,
                  tableData.map((row) => row._id) // Assuming _id is used for selection
                )
              } 
            />

            <Scrollbar>
              <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={selected.length}
                  onSort={onSort} 
                />

                <TableBody>
                  {(isLoading ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <TransferTableRow // 🌟 USING THE LOCAL COMPONENT
                          key={row?._id}
                          row={row} 
                          selected={selected.includes(row?._id)}
                          onSelectRow={() => onSelectRow(row?._id)}
                          onFailReverseClick={handleOpenFailReverseModal} 
                         />
                      ) : (
                        !isNotFound && <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      )
                    )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, tableData.length)}
                  />

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
 
      {/* 💡 CONFIRMATION MODAL FOR FAIL REVERSE ACTION */}
      <Dialog
          open={openFailReverseModal}
          onClose={handleCloseFailReverseModal}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
      >
          <DialogTitle id="alert-dialog-title">
              Confirm Fail Reverse Action
          </DialogTitle>
          <DialogContent>
              <DialogContentText id="alert-dialog-description">
                  Are you sure you want to trigger the **Fail Reverse** action for this transaction?
                  <br />
                  **Transaction ID:** {selectedRowToReverse?._id}
                  <br />
                  **Reference:** {selectedRowToReverse?.reference}
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseFailReverseModal} color="inherit">
                  Cancel
              </Button>
              <Button 
                  onClick={handleFailReverseAction} 
                  color="error" 
                  variant="contained" 
                  autoFocus
              >
                  Okay
              </Button>
          </DialogActions>
      </Dialog>
      {/* END OF MODAL */}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
  filterStatus,
}: {
  inputData: ITransferItem[]; // Using the specific Transfer Item type
  comparator: (a: any, b: any) => number;
  filterName: string;
  filterStatus: string[];
}) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    // Filter by User ID or Reference Number
    inputData = inputData.filter(
      (product) => product.userId.toLowerCase().includes(filterName.toLowerCase()) || 
                   product.reference.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    // Filter by status
    inputData = inputData.filter((product) => filterStatus.includes(product.status));
  }

  return inputData;
}