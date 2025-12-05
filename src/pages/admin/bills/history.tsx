/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/no-shadow */
import { useState, useEffect, useMemo, useCallback } from 'react';
// next
import Head from 'next/head';
// next/router is not used, so the import is unnecessary. Keeping it if it's used elsewhere in the original project structure.

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
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  // 💡 NEW IMPORTS FOR LOCAL ROW COMPONENT
  TableRow,
  TableCell,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
// date-fns
import { format } from 'date-fns'; 
// redux
import axios from '../../../utils/axios';
// Removed: import { useSelector } from '../../../redux/store'; // ❌ REMOVED: Redux useSelector is not being used
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
// sections
import { ProductTableToolbar } from '../../../sections/@dashboard/bills/list';
// utilities
import { fDateTime } from '../../../utils/formatTime';
import { fCurrency } from '../../../utils/formatNumber';
import Label from '../../../components/label';

import { 
  BookingWidgetSummary, 
} from '../../../sections/@dashboard/loans/stat';
// assets
import {
  BookingIllustration,
} from '../../../assets/illustrations';

// ----------------------------------------------------------------------

// Define the specific structure of the data row based on your table
export interface IBillItem {
  _id: string;
  date: string; // Mapped from createdAt
  userId: string;
  reference: string;
  billId: string;
  serviceType: string;
  recipient: string | number;
  provider: string; // Mapped from providerType
  amount: number;
  status: string;
}

// Corrected TABLE_HEAD with distinct IDs for proper sorting/export mapping
const TABLE_HEAD = [
  { id: 'date', label: 'Date', align: 'left' },
  { id: 'reference', label: 'Reference', align: 'left' },
  { id: 'userId', label: 'User ID', align: 'left' },
  { id: 'billId', label: 'Bill ID', align: 'left' },
  { id: 'serviceType', label: 'Service Type', align: 'left' },
  { id: 'recipient', label: 'Recipient', align: 'left' },
  { id: 'provider', label: 'Provider', align: 'left' },
  { id: 'amount', label: 'Amount', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
];

const STATUS_OPTIONS_FOR_TOOLBAR = [
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Internet' },
  { value: 'tv', label: 'Cable TV' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'transfer', label: 'Bank Transfer' },
];

// 💡 NEW OPTIONS FOR FILTER MODAL STATUS
const STATUS_OPTIONS_FOR_MODAL = [
  { value: '', label: 'All Statuses' },
  { value: 'success', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

// ----------------------------------------------------------------------
// 🌟 LOCAL ROW COMPONENT
// ----------------------------------------------------------------------

interface BillTableRowProps {
  row: IBillItem;
  selected: boolean;
  onSelectRow: () => void;
}

function BillTableRow({
  row,
  selected,
  onSelectRow,
}: BillTableRowProps) {
  const {
    date,
    reference,
    userId,
    billId,
    serviceType,
    recipient,
    provider,
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
      case 'pending':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <TableRow hover selected={selected} onClick={onSelectRow}>
      {/* Remove Checkbox column if not needed, assuming it's omitted based on the original component usage */}

      <TableCell>{fDateTime(date)}</TableCell>
      <TableCell>{reference}</TableCell>
      <TableCell>{userId}</TableCell>
      <TableCell>{billId}</TableCell>
      <TableCell>{serviceType}</TableCell>
      <TableCell>{recipient}</TableCell>
      <TableCell>{provider}</TableCell>
      <TableCell>{fCurrency(amount)}</TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(status)}>
          {status}
        </Label>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------
// 💡 NEW: FILTER MODAL COMPONENT
// ----------------------------------------------------------------------

interface FilterState {
  status: string;
  search: string;
  from: string;
  to: string;
}

interface TransactionFilterModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (filters: FilterState) => void;
  initialFilters: FilterState; // To pre-fill the form
}

function TransactionFilterModal({ open, onClose, onSubmit, initialFilters }: TransactionFilterModalProps) {
  const [status, setStatus] = useState(initialFilters.status);
  const [search, setSearch] = useState(initialFilters.search);
  const [dateFrom, setDateFrom] = useState(initialFilters.from);
  const [dateTo, setDateTo] = useState(initialFilters.to);
  
  // Update local state when initialFilters changes (e.g., when the modal opens)
  useEffect(() => {
    setStatus(initialFilters.status);
    setSearch(initialFilters.search);
    setDateFrom(initialFilters.from);
    setDateTo(initialFilters.to);
  }, [initialFilters, open]);


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      status,
      search,
      from: dateFrom,
      to: dateTo,
    });
    // onClose(); // Let parent handle closing, or close here if desired
  };

  const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 1,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom>
          Filter Transactions
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Status Select */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS_FOR_MODAL.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search Input */}
          <TextField
            fullWidth
            label="Search (User ID/Bill ID)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Date Range - From */}
          <TextField
            fullWidth
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          {/* Date Range - To */}
          <TextField
            fullWidth
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <Button type="submit" variant="contained" fullWidth>
            Apply Filter
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ----------------------------------------------------------------------


BillsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function BillsPage() {
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


  const [tableData, setTableData] = useState<IBillItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [filterName, setFilterName] = useState(''); 
  const [filterStatus, setFilterStatus] = useState<string[]>([]); 
  
  // 💡 NEW STATE: Loading state for the table data fetch
  const [tableLoading, setTableLoading] = useState(false); 


  // 💡 API Filter State (Must match FilterState interface)
  const [apiFilters, setApiFilters] = useState<FilterState>({
    status: '',
    search: '',
    from: '',
    to: '',
  });


  // 💡 FIX 1: Access window safely
  const queryString = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(queryString);
  const typeValue = params.get('type');
  
  const [responselog, setDashlog] = useState<any>(null);
  
  // Helper to check if API filters are active
  const isApiFilterActive = useMemo(() => {
    return !!(apiFilters.status || apiFilters.search || apiFilters.from || apiFilters.to);
  }, [apiFilters]);


  // 💡 UPDATED: Fetching data logic (Handles both initial load and search)
  const fetchDashboardData = useCallback(async () => {
    setTableLoading(true); // Start loading
    try {
      const accessToken = localStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };
      
      let url: string;
      
      if (isApiFilterActive) {
        // SCENARIO 1: Use the dedicated search endpoint with parameters
        const { status, search, from, to } = apiFilters;
        const formattedFrom = from ? format(new Date(from), 'yyyy-MM-dd') : '';
        const formattedTo = to ? format(new Date(to), 'yyyy-MM-dd') : '';
        
        const queryParams = new URLSearchParams({
          search,
          status,
          from: formattedFrom,
          to: formattedTo,
        }).toString();

        url = `/admin/bill/history?${queryParams}`;
        enqueueSnackbar('Applying filter...', { variant: 'info' });

      } else {
        // SCENARIO 2: Use the original endpoint for all bills/default load
        url = `/admin/bill/history/${typeValue || ''}`; 
      }

      const apiResponse = await axios.get(url, config);
      setDashlog(apiResponse.data);
      enqueueSnackbar('Transactions fetched successfully!', { variant: 'success' });
      setTableLoading(false); // End loading on success

    } catch (error) {
      console.error("API Call Error:", error);
      enqueueSnackbar('Failed to fetch transactions.', { variant: 'error' });
      setDashlog(null);
      setTableData([]);
      setTableLoading(false); // End loading on failure
    }
  }, [apiFilters, isApiFilterActive, typeValue, enqueueSnackbar]); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); 

  
  // 💡 NEW: Function to handle modal submission (API Filter)
  const handleModalSubmit = (filters: FilterState) => {
    setApiFilters(filters);
    setPage(0); // Reset pagination on new API filter
    setIsModalOpen(false); // Close the modal
  };
  
  // 💡 NEW: Handle clear all filters (local and API)
  const handleClearAllFilters = () => {
    setFilterName(''); // Clear local filter
    setFilterStatus([]); // Clear local status filter
    // Clear API filters, which triggers a re-fetch of the default endpoint
    setApiFilters({ status: '', search: '', from: '', to: '' }); 
    setPage(0);
  };


  useEffect(() => {
    const dataFromApi = responselog?.data?.data;

    const processData = (data: any[] | Record<string, any>) => {
      const finalArray: any[] = Array.isArray(data) ? data : Object.values(data || {});

      const processedData: IBillItem[] = finalArray.map((item) => ({
          _id: item._id,
          // Mapping: 'date' comes from 'createdAt'
          date: item.createdAt,
          reference: item.reference,
          userId: item.userId,
          billId: item.billId || 'N/A',
          serviceType: item.serviceType,
          // Mapping: 'recipient' (e.g., phone number)
          recipient: item.recipient || item.customerAccountNo || 'N/A',
          // Mapping: 'provider' comes from 'providerType'
          provider: item.providerType || 'N/A',
          amount: item.amount || 0,
          status: item.status,
        } as IBillItem));
        
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


  
  // NOTE: The existing local table filter (`applyFilter`) still filters the *current* API result (`tableData`)
  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
  }), [tableData, order, orderBy, filterName, filterStatus]);


  const denseHeight = dense ? 60 : 80;

  const isFiltered = filterName !== '' || !!filterStatus.length;

  // 💡 UPDATED: Check for not found based on local filter and API loading state
  const isNotFound = (!dataFiltered.length && !!filterName) || (!tableLoading && !dataFiltered.length);
 
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
  
  // ----------------------------------------------------------------------
  // 💾 CORRECTED: CSV Export Function
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
        enqueueSnackbar('No data to export.', { variant: 'warning' });
        return;
    }
    
    const headers = TABLE_HEAD
        .map(head => head.label)
        .join(',');

    const csvRows = dataFiltered.map((row) => {
        const rowData = row as IBillItem;
        const values = [
            rowData.date, 
            rowData.reference,
            rowData.userId, 
            rowData.billId, 
            rowData.serviceType, 
            rowData.recipient, 
            rowData.provider, 
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
    link.setAttribute('download', `${typeValue || 'all'}_bills_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------------------------------------
  // 📊 CORRECTED: Excel Export Function
  // ----------------------------------------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
        enqueueSnackbar('No data to export.', { variant: 'warning' });
        return;
    }

    const headers = TABLE_HEAD.map(head => `<th>${head.label}</th>`).join('');
    
    const tableRows = dataFiltered.map((row) => {
      const rowData = row as IBillItem;
      const rowValues = [
          rowData.date, 
          rowData.reference,
          rowData.userId, 
          rowData.billId, 
          rowData.serviceType, 
          rowData.recipient, 
          rowData.provider, 
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
    link.setAttribute('download', `${typeValue || 'all'}_bills_log.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };
  

  return (
    <>
      <Head>
        <title> Bills: Bills Payment Log | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading={
            `${typeValue ? `${typeValue.charAt(0).toUpperCase()}${typeValue.slice(1)} ` : ''}Bills Payment Log`
          }
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Bills',
              href: '',
            },
            { name: 'Payment Log' },
          ]}
        />
        
        <Grid container spacing={3}>

            <Grid item xs={12} md={12}>
              <BookingWidgetSummary image="/assets/icons/loan/BillPayment.png" title="Total Bills Payment" total={responselog?.data ? responselog.data.total : '0'} icon={<BookingIllustration />} />
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
            statusOptions={STATUS_OPTIONS_FOR_TOOLBAR}
            isFiltered={isFiltered}
            onResetFilter={() => { setFilterName(''); setFilterStatus([]); }} // Local reset
          />
          
          <Stack 
              direction="row" 
              spacing={1} 
              justifyContent="space-between" 
              sx={{ p: 1.5, pr: 3, pt: 0 }} 
          >
            {/* 💡 NEW: Filter Transaction Button */}
            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              startIcon={<Iconify icon="ic:round-filter-list" />}
            >
              Filter Transaction
            </Button>
            
            {/* Display Active API Filters and Clear Button */}
            <Stack direction="row" spacing={1} alignItems="center">
                {isApiFilterActive && (
                  <Label variant="filled" color="primary">
                      API Filter Active
                  </Label>
                )}
                
                {isApiFilterActive && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAllFilters}
                    startIcon={<Iconify icon="eva:trash-2-outline" />}
                  >
                    Clear Filter
                  </Button>
                )}
            </Stack>


            {/* 2. Export Buttons placed on the right */}
            <Stack direction="row" spacing={1}>
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
          </Stack>
          {/* END OF NEW BUTTONS / EXPORT BUTTONS */}


          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={dense}
              numSelected={selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                onSelectAllRows(
                  checked,
                  tableData.map((row) => row._id) 
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
                  {(tableLoading ? [...Array(rowsPerPage)] : dataFiltered) // 💡 USE tableLoading HERE
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <BillTableRow 
                          key={row?._id}
                          row={row} 
                          selected={selected.includes(row?._id)}
                          onSelectRow={() => onSelectRow(row?._id)}
                         />
                      ) : (
                        // 💡 Show skeleton when tableLoading is true
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
      
      {/* 💡 NEW: Transaction Filter Modal */}
      <TransactionFilterModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialFilters={apiFilters}
      />
 
    </>
  );
}

// ----------------------------------------------------------------------
// Filter function (No change)
// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
  filterStatus,
}: {
  inputData: IBillItem[]; 
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
    inputData = inputData.filter(
      (product) => product.userId.toLowerCase().includes(filterName.toLowerCase()) || 
                   product.billId.toString().toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    inputData = inputData.filter((product) => filterStatus.includes(product.serviceType));
  }

  return inputData;
}