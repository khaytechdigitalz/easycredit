import { paramCase } from 'change-case';
import { useState, useEffect, useMemo } from 'react';
// next
import Head from 'next/head';
import { useRouter } from 'next/router';

// @mui
import {
  Card,
  Table,
  Tooltip,
  TableBody,
  Container,
  Grid,
  IconButton,
  TableContainer,
  Button, // Added Button
  Stack, // Added Stack
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
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
import { useSnackbar } from '../../../components/snackbar'; // Added Snackbar
// sections
import { ProductTableRow, ProductTableToolbar } from '../../../sections/@dashboard/loans/list';


import { 
  BookingWidgetSummary, 
} from '../../../sections/@dashboard/loans/stat';
// assets
import {
  BookingIllustration, 
} from '../../../assets/illustrations';

// ----------------------------------------------------------------------
// Define the specific structure of the data row
export interface ILoanItem {
  _id: string; 
  date: string; 
  loanId: string;
  userId: string;
  amount: number;
  repaymentCycle: string;
  purpose: string;
  interestRate: number;
  status: string;
}

// Corrected TABLE_HEAD with distinct IDs
const TABLE_HEAD = [
  { id: 'date', label: 'Date', align: 'left' }, 
  { id: 'loanId', label: 'Loan ID', align: 'left' },
  { id: 'userId', label: 'User ID', align: 'left' },
  { id: 'amount', label: 'Amount', align: 'left' },
  { id: 'repaymentCycle', label: 'Repayment Cycle', align: 'left' },
  { id: 'purpose', label: 'Purpose', align: 'left' },
  { id: 'interestRate', label: 'Interest Rate', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
  { id: '' },
];

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];

// ----------------------------------------------------------------------

LoanListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function LoanListPage() {
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
    defaultOrderBy: 'createdAt',
  });

  const { themeStretch } = useSettingsContext();

  const { push } = useRouter();

  const { isLoading } = useSelector((state) => state.product);

  const [tableData, setTableData] = useState<ILoanItem[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);


  const [loanlog, setDashlog] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const loansResponse = await axios.get('/admin-dashboard/d/recent-loans', config);
        setDashlog(loansResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, []);
 
  useEffect(() => {
    if (loanlog?.length) {
      setTableData(loanlog as ILoanItem[]);
    }
  }, [loanlog]);


  const [loanstat, setDashstat] = useState<any>(null);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const loansStat = await axios.get('/admin/loans/stats', config);
        setDashstat(loansStat.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLoanData();
  }, []);
 
  useEffect(() => {}, [loanstat]);

  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
  }), [tableData, order, orderBy, filterName, filterStatus]);


  const denseHeight = dense ? 60 : 80;

  const isFiltered = filterName !== '' || !!filterStatus.length;

  const isNotFound = (!dataFiltered.length && !!filterName) || (!isLoading && !dataFiltered.length);

  const handleOpenConfirm = () => {
  };
 
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
  

  const handleViewRow = (id: string) => {
    push(PATH_DASHBOARD.loan.view(paramCase(id)));
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
    
    // 1. Prepare Headers
    const headers = TABLE_HEAD
        .slice(0, -1)
        .map(head => head.label)
        .join(',');

    // 2. Prepare Data Rows
    const csvRows = dataFiltered.map((row) => {
        const rowData = row as ILoanItem;
        const values = [
            rowData.date, 
            rowData.loanId, 
            rowData.userId, 
            rowData.amount, 
            rowData.repaymentCycle, 
            rowData.purpose, 
            rowData.interestRate,
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
    link.setAttribute('download', 'loan_applications.csv');
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

    const headers = TABLE_HEAD.slice(0, -1).map(head => `<th>${head.label}</th>`).join('');
    
    const tableRows = dataFiltered.map((row) => {
      const rowData = row as ILoanItem;
      const rowValues = [
          rowData.date, 
          rowData.loanId, 
          rowData.userId, 
          rowData.amount, 
          rowData.repaymentCycle, 
          rowData.purpose, 
          rowData.interestRate,
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
    link.setAttribute('download', 'loan_applications.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Loan: Loan Applications | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Loan Applications"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Loan',
              href: '',
            },
            { name: 'Loan Applications' },
          ]}
          // Removed action prop here
        />
        
        <Grid container spacing={3}>
            {/* ... BookingWidgetSummary components ... */}
            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/5.png" title="Awaiting Disbursement" total={loanstat?.awaitingDisbursement ? loanstat.awaitingDisbursement : '0'} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/4.png" title="Pending Approval" total={loanstat?.pendingApproval ? loanstat.pendingApproval : '0'} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/7.png" title="Rejected" total={loanstat?.rejected ? loanstat.rejected : '0'} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/1.png" title="Closed" total={loanstat?.closed ? loanstat.closed : '0'} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/6.png" title="Active" total={loanstat?.active ? loanstat.active : '0'} icon={<BookingIllustration />} />
            </Grid>

            <Grid item xs={12} md={4}>
              <BookingWidgetSummary image="/assets/icons/payments/1.png" title="Defaulted" total={loanstat?.defaulted ? loanstat.defaulted : '0'} icon={<BookingIllustration />} />
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
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={handleOpenConfirm}>
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </Tooltip>
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
                          onViewRow={() => handleViewRow(row?._id)}
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
  inputData: ILoanItem[]; 
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
      (product) => product.userId.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    inputData = inputData.filter((product) => filterStatus.includes(product.status));
  }

  return inputData;
}