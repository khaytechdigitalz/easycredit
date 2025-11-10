import { paramCase } from 'change-case';
import { useState, useEffect, useMemo } from 'react'; // Added useMemo
// next
import Head from 'next/head';
import { useRouter } from 'next/router';

// @mui
import {
  Card,
  Table,
  TableBody,
  Container,
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
  TablePaginationCustom,
} from '../../../components/table';
import Iconify from '../../../components/iconify'; // Assuming Iconify is available
import { useSnackbar } from '../../../components/snackbar'; // Added Snackbar
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
// sections
import { ProductTableRow, ProductTableToolbar } from '../../../sections/@dashboard/users/list';

// ----------------------------------------------------------------------
// Define the specific structure of the data row based on your table headers
export interface ICustomerItem {
  _id: string; 
  firstName: string; 
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  nationality: string;
  phoneVerificationStatus: 'verified' | 'unverified'; // Assuming a status field exists
  // Add other fields present in the API response that correspond to the table headers
}


const TABLE_HEAD = [
  { id: '_id', label: 'ID', align: 'left' },
  { id: 'firstName', label: 'First Name', align: 'left' },
  { id: 'lastName', label: 'Last Name', align: 'left' },
  { id: 'gender', label: 'Gender', align: 'left' },
  { id: 'email', label: 'Email', align: 'left' },
  { id: 'phone', label: 'Phone', align: 'left' },
  { id: 'nationality', label: 'Nationality', align: 'left' }, 
  { id: 'phoneVerificationStatus', label: 'Phone Verification Status', align: 'left' }, 
  { id: '' }, // Empty ID for the action column
];

const STATUS_OPTIONS = [
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];

// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function CustomerListPage() {
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

  const [tableData, setTableData] = useState<ICustomerItem[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);



  const [responselog, setDashlog] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const requestResponse = await axios.get('/admin/user/list', config);
        setDashlog(requestResponse.data.data.data);
        
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, []);
 
  useEffect(() => {
    if (responselog?.length) {
      setTableData(responselog as ICustomerItem[]);
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
  

  const handleViewRow = (id: string) => {
    push(PATH_DASHBOARD.client.view(paramCase(id)));
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
    
    // 1. Prepare Headers (Exclude the last item which is the action column)
    const headers = TABLE_HEAD
        .slice(0, -1)
        .map(head => head.label)
        .join(',');

    // 2. Prepare Data Rows
    const csvRows = dataFiltered.map((row) => {
        const rowData = row as ICustomerItem;
        const values = [
            rowData._id, 
            rowData.firstName, 
            rowData.lastName, 
            rowData.gender, 
            rowData.email, 
            rowData.phone, 
            rowData.nationality, 
            rowData.phoneVerificationStatus,
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
    link.setAttribute('download', 'customer_list.csv');
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
      const rowData = row as ICustomerItem;
      const rowValues = [
          rowData._id, 
          rowData.firstName, 
          rowData.lastName, 
          rowData.gender, 
          rowData.email, 
          rowData.phone, 
          rowData.nationality, 
          rowData.phoneVerificationStatus,
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
    link.setAttribute('download', 'customer_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Customers: Manage Customers | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Customers"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Customers',
              href: '',
            },
            { name: 'Manage Customers' },
          ]}
        />

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
                          key={row._id}
                          row={row}
                          selected={selected.includes(row._id)}
                          onViewRow={() => handleViewRow(row._id)}
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
  inputData: ICustomerItem[]; // Using the specific Customer Item type
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
    // Assuming filtering primarily by first name, last name, or ID/Email
    inputData = inputData.filter(
      (product) => product.firstName.toLowerCase().includes(filterName.toLowerCase()) ||
                   product.lastName.toLowerCase().includes(filterName.toLowerCase()) ||
                   product.email.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    // Assuming filterStatus applies to phoneVerificationStatus
    inputData = inputData.filter((product) => filterStatus.includes(product.phoneVerificationStatus));
  }

  return inputData;
}