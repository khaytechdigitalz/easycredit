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
  Stack,
} from '@mui/material';
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
import Iconify from '../../../components/iconify';
import { useSnackbar } from '../../../components/snackbar';
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
// sections
import { ProductTableRow } from '../../../sections/@dashboard/faq/list';
// types
import { IProductState } from '../../../@types/product'; 

// ----------------------------------------------------------------------
// Define the specific structure of the data row (Complaint Category)
export interface ICustomerItem {
  _id: string; 
  text: string; 
  // Add other fields present in the API response that correspond to the table headers
}

// Define the structure for your table header
interface HeadLabel {
  id: keyof ICustomerItem | 'actions' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

const TABLE_HEAD: HeadLabel[] = [
  { id: '_id', label: 'ID'  },
  { id: 'title', label: 'Title'  },
  { id: 'content', label: 'Content'  },
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

  // Assuming product slice has an isLoading state
  const { isLoading } = useSelector((state) => state.product as IProductState); 

  const [tableData, setTableData] = useState<ICustomerItem[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<ICustomerItem[] | null>(null); 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const requestResponse = await axios.get('/admin/faqs', config);
        
        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
            setDashlog(requestResponse.data.data.data as ICustomerItem[]);
        } else {
            setDashlog([]);
        }
        
      } catch (error) {
        console.error("Error fetching faq:", error);
        enqueueSnackbar('Failed to fetch faq.', { variant: 'error' });
        setDashlog([]); 
      }
    };

    fetchDashboardData();
  }, [enqueueSnackbar]); 

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


  const isNotFound = (!dataFiltered.length && !!filterName) || (!isLoading && !dataFiltered.length);
  

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
        const rowData: ICustomerItem = row; 
        const values = [
            rowData._id, 
            rowData.text, 
        ].map(value => {
            const stringValue = String(value);
            // Enclose in double quotes if the string contains a comma
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
    link.setAttribute('download', 'faq_list.csv');
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

    // Excludes the last item which is the action column
    const headers = TABLE_HEAD.slice(0, -1).map(head => `<th>${head.label}</th>`).join('');
    
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
    link.setAttribute('download', 'faq_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> FAQ: Manage FAQ | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage FAQs"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'FAQ',
              href: PATH_DASHBOARD.faq.root,
            },
            { name: 'FAQ' },
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
                  rowCount={dataFiltered.length} // Use dataFiltered length here
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
                          row={row as any} // Use 'any' or check if ProductTableRow accepts ICustomerItem
                          selected={selected.includes(row._id)}
                          // Assuming there's no onSelectRow needed for categories
                        />
                      ) : (
                        !isNotFound && <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      )
                    )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)}
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