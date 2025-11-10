import { useState, useEffect, useMemo } from 'react';
// next
import Head from 'next/head';
 
// @mui
import {
  Card,
  Table,
  TableBody,
  Container,
  TableContainer,
  Button,
  Stack, // Added Stack for arranging multiple buttons
} from '@mui/material';
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
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
import Iconify from '../../../components/iconify';
import { useSnackbar } from '../../../components/snackbar';
// sections
import { ProductTableRow } from '../../../sections/@dashboard/loans/package';
 
// ----------------------------------------------------------------------
// Define the specific structure of the data row
export interface ILoanPackage {
  Id: number | string;
  ProductCode: string;
  ProductName: string;
  ProductDiscriminator: string;
  InterestRate: number;
  Tenure: number;
  _id: string; // Used for row selection/key
}

// Corrected TABLE_HEAD with distinct IDs for sorting
const TABLE_HEAD = [
  { id: 'Id', label: 'ID', align: 'left' }, 
  { id: 'ProductCode', label: 'Product Code', align: 'left' },
  { id: 'ProductName', label: 'Product Name', align: 'left' },
  { id: 'ProductDiscriminator', label: 'Product Discriminator', align: 'left' },
  { id: 'InterestRate', label: 'Interest Rate', align: 'left' },
  { id: 'Tenure', label: 'Tenure', align: 'left' },
  { id: '' }, // For action column
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
    selected,
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({
    defaultOrderBy: 'Id',
  });

  const { themeStretch } = useSettingsContext();

  const [tableData, setTableData] = useState<ILoanPackage[]>([]); 
  const [filterName] = useState('');
  const [filterStatus] = useState<string[]>([]);
  const [loanPackages, setLoanPackages] = useState<ILoanPackage[] | null>(null);
  const [loadingError, setLoadingError] = useState<any>(null);


  // ----------------------------------------
  // CSV Export Logic (Kept for completeness)
  // ----------------------------------------
  const exportToCsv = () => {
      if (!dataFiltered || dataFiltered.length === 0) {
          enqueueSnackbar('No data to export.', { variant: 'warning' });
          return;
      }
      const headers = TABLE_HEAD.slice(0, -1).map(head => head.label).join(',');
      const csvRows = dataFiltered.map((row) => {
          const values = [
              row.Id, row.ProductCode, row.ProductName, row.ProductDiscriminator, row.InterestRate, row.Tenure,
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
      link.setAttribute('download', 'loan_packages.csv');
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------
  // 🆕 Excel Export Logic
  // ----------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
        enqueueSnackbar('No data to export.', { variant: 'warning' });
        return;
    }

    const headers = TABLE_HEAD.slice(0, -1).map(head => `<th>${head.label}</th>`).join('');
    
    // 1. Generate table rows (tr) and cells (td)
    const tableRows = dataFiltered.map((row) => {
      const rowValues = [
          row.Id, 
          row.ProductCode, 
          row.ProductName, 
          row.ProductDiscriminator, 
          row.InterestRate, 
          row.Tenure,
      ].map(value => `<td>${value}</td>`).join('');
      
      return `<tr>${rowValues}</tr>`;
    }).join('');

    // 2. Wrap content in HTML table structure
    const tableHTML = `
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

    // 3. Create the full Excel file content (includes XML declaration for compatibility)
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
    
    // 4. Trigger Download with the special Excel MIME type
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'loan_packages.xls');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };
  // ----------------------------------------


  useEffect(() => {
    const fetchLoanPackages = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const loansResponse = await axios.get('/admin/loans/packages', config);
        setLoanPackages(loansResponse.data.data); 
      } catch (error) {
        console.error(error);
        setLoadingError(error);
      }
    };

    fetchLoanPackages();
  }, []);
 
  useEffect(() => {
    if (loanPackages && Array.isArray(loanPackages)) {
      setTableData(loanPackages);
    }
  }, [loanPackages]);


  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
    filterKey: 'ProductCode' 
  }), [tableData, order, orderBy, filterName, filterStatus]);


  const denseHeight = dense ? 60 : 80;
  const isLoading = !loanPackages && !loadingError;
  const isNotFound = (!dataFiltered.length && !!filterName) || (!isLoading && !dataFiltered.length);
 

  return (
    <>
      <Head>
        <title> Loan: Loan Packages | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Loan Packages"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            { name: 'Loan', href: '', },
            { name: 'Loan Packages' },
          ]}
          // Use Stack to arrange both export buttons neatly
          action={
             <Stack direction="row" spacing={1}>
                 <Button
                    variant="outlined" // Made CSV outlined to distinguish the files
                    onClick={exportToCsv}
                    startIcon={<Iconify icon="eva:file-text-fill" />}
                    disabled={!dataFiltered.length}
                 >
                    Export CSV
                 </Button>
                 <Button
                    variant="contained"
                    onClick={exportToExcel} // New Excel function
                    startIcon={<Iconify icon="eva:cloud-download-fill" />}
                    disabled={!dataFiltered.length}
                 >
                    Export XLS
                 </Button>
             </Stack>
          }
        />
        
        <Card>
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
                          key={row?.Id} 
                          selected={selected.includes(row?._id)}
                          Id={row.Id}
                          ProductCode={row.ProductCode}
                          ProductName={row.ProductName}
                          ProductDiscriminator={row.ProductDiscriminator}
                          InterestRate={row.InterestRate}
                          Tenure={row.Tenure}
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
  filterKey, 
}: {
  inputData: ILoanPackage[]; 
  comparator: (a: any, b: any) => number;
  filterName: string;
  filterStatus: string[];
  filterKey: string;
}) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (filterName && filterKey) {
    inputData = inputData.filter(
      (product) => (product as any)[filterKey]?.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length) {
    inputData = inputData.filter((product) => filterStatus.includes(product.ProductDiscriminator));
  }

  return inputData;
}