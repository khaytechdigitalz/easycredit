 
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
  CircularProgress,
} from '@mui/material';

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
 

// ----------------------------------------------------------------------
// Define the specific structure of the data row (Permission Item)
export interface IPermissionItem {
  _id: string;
  name: string; // Corresponds to the permission key (e.g., 'view_permission')
  description: string; // Corresponds to the descriptive text (e.g., 'Permission for view_permission')
}

// Define the structure for your table header
interface HeadLabel {
  id: keyof IPermissionItem | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

// Updated TABLE_HEAD for Permissions
const TABLE_HEAD: HeadLabel[] = [
  { id: 'name', label: 'Permission Key', align: 'left' },
  { id: 'description', label: 'Description', align: 'left' }, // Changed from 'Value' to 'Description'
];

// ----------------------------------------------------------------------

// PermissionTableRow Component definition
interface PermissionTableRowProps {
  row: IPermissionItem;
}

function PermissionTableRow({ row }: PermissionTableRowProps) {
  const { name, description } = row;

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{description}</TableCell>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

PermissionListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function PermissionListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger] = useState(0);

  const [isFetchingData, setIsFetchingData] = useState(true);
 

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
    defaultOrderBy: 'name',
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<IPermissionItem[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<IPermissionItem[] | null>(null);

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

        const requestResponse = await axios.get('/admin/permissions', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
          // --- Data Mapping Change ---
          // Map backend object to expected IPermissionItem structure
          const mappedData: IPermissionItem[] = requestResponse.data.data.data.map((item: any) => ({
            _id: item._id,
            name: item.name,
            description: item.description, // Use the new 'description' field
          }));
          
          setDashlog(mappedData);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching permissions log:", error);
        enqueueSnackbar('Failed to fetch permissions log.', { variant: 'error' });
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

  // Updated to use IPermissionItem
  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
  }), [tableData, order, orderBy, filterName]);


  const denseHeight = dense ? 60 : 80;


  const isNotFound = (!dataFiltered.length && !!filterName) || (!isFetchingData && !dataFiltered.length);

  // ----------------------------------------------------------------------
  // 💾 CSV Export Function (Updated to use 'description')
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    // Headers map to: Permission Key, Description
    const headers = TABLE_HEAD
      .map(head => head.label)
      .join(',');

    const csvRows = dataFiltered.map((row) => {
      const rowData: IPermissionItem = row;
      
      // Map values corresponding to TABLE_HEAD (name, description)
      const values = [
        rowData.name,
        rowData.description,
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
    link.setAttribute('download', 'permissions_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------------------------------------
  // 📊 Excel Export Function (Updated to use 'description')
  // ----------------------------------------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: IPermissionItem = row;
      // Map values corresponding to TABLE_HEAD (name, description)
      const rowValues = [
        rowData.name,
        rowData.description,
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
    link.setAttribute('download', 'permissions_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Permissions: Permission List | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Permissions"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Permissions',
              href: PATH_DASHBOARD.root, 
            },
            { name: 'Permission List' },
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
                        <PermissionTableRow
                          key={row._id}
                          row={row as any}
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
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: IPermissionItem[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): IPermissionItem[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: IPermissionItem[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    filteredData = filteredData.filter(
      (product) => product.name.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}