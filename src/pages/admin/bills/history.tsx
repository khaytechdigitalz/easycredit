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
// sections
import { ProductTableRow, ProductTableToolbar } from '../../../sections/@dashboard/bills/list';


import { 
  BookingWidgetSummary, 
} from '../../../sections/@dashboard/bills/stat';
// assets
import {
  BookingIllustration, 
} from '../../../assets/illustrations';
// ----------------------------------------------------------------------
// Define the specific structure of the data row based on your table
export interface IBillItem {
  _id: string; 
  date: string; 
  userId: string;
  billId: string;
  serviceType: string;
  recipient: string | number; 
  provider: string;
  amount: number;
  status: string;
}

// Corrected TABLE_HEAD with distinct IDs for proper sorting/export mapping
const TABLE_HEAD = [
  { id: 'date', label: 'Date', align: 'left' }, 
  { id: 'userId', label: 'User ID', align: 'left' },
  { id: 'billId', label: 'Bill ID', align: 'left' },
  { id: 'serviceType', label: 'Service Type', align: 'left' },
  { id: 'recipient', label: 'Recipient', align: 'left' },
  { id: 'provider', label: 'Provider', align: 'left' },
  { id: 'amount', label: 'Amount', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
];

const STATUS_OPTIONS = [
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Internet' },
  { value: 'tv', label: 'Cable TV' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'transfer', label: 'Bank Transfer' },
];
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


  const { isLoading } = useSelector((state) => state.product);

  const [tableData, setTableData] = useState<IBillItem[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  
  // 💡 FIX 1: Access window safely
  const queryString = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(queryString);
  const typeValue = params.get('type'); 
  
  const [responselog, setDashlog] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 💡 FIX 2: Guard clause - Only run fetch if typeValue is truthy
      // if (!typeValue) return; 

      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        
        const apiResponse = await axios.get(`/admin/bill/history/${typeValue}`, config);
        setDashlog(apiResponse.data);
      } catch (error) {
        console.error("API Call Error:", error);
      }
    };

    fetchDashboardData();
  }, [typeValue]); 
 
  
  useEffect(() => {
  const dataFromApi = responselog?.data?.data;

  const processData = (data: any[] | Record<string, any>) => {
    const finalArray: any[] = Array.isArray(data) ? data : Object.values(data || {});

    const isValidBillArray = finalArray.every(item => 
      item && 
      typeof item === 'object' && 
      '_id' in item 
    );
      
    if (isValidBillArray) {
        setTableData(finalArray as IBillItem[]);
    } else {
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

  // ----------------------------------------------------------------------
  // 💾 CSV Export Function
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
  // 📊 Excel Export Function
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
              <BookingWidgetSummary image="/assets/icons/payments/cart.png" title="Total Bills Payment" total={responselog?.data ? responselog.data.total : '0'} icon={<BookingIllustration />} />
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

          {/* 2. 💡 Export Buttons placed right after the toolbar */}
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
                  {(isLoading ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <ProductTableRow
                          key={row?._id}
                          row={row} 
                          selected={selected.includes(row?._id)}
                          onSelectRow={() => onSelectRow(row?._id)}
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
                   product.billId.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    inputData = inputData.filter((product) => filterStatus.includes(product.serviceType));
  }

  return inputData;
}