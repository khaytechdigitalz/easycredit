import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
// redux
import axios from '../../../utils/axios';
import { useSelector } from '../../../redux/store';
 // routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// @types
import { IProduct } from '../../../@types/product';
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

const TABLE_HEAD = [
  { id: 'name', label: 'Date', align: 'left' }, 
  { id: 'name', label: 'User ID', align: 'left' },
  { id: 'name', label: 'Bill ID', align: 'left' },
  { id: 'name', label: 'Service Type', align: 'left' },
  { id: 'name', label: 'Recipient', align: 'left' },
  { id: 'name', label: 'Provider', align: 'left' },
  { id: 'name', label: 'Amount', align: 'left' },
  { id: 'name', label: 'Status', align: 'left' },
];

const STATUS_OPTIONS = [
  { value: 'success', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
];

// ----------------------------------------------------------------------

BillsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function BillsPage() {
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


  const { isLoading } = useSelector((state) => state.product);

  const [tableData, setTableData] = useState<IProduct[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // 1. Get the query string: "?type=airtime"
  const queryString = window.location.search;

  // 2. Create a URLSearchParams object
  const params = new URLSearchParams(queryString);

  // 3. Use the get() method
  const typeValue = params.get('type');
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
        // typeValue is used here
        const apiResponse = await axios.get(`/admin/bill/history/${typeValue}`, config);
        setDashlog(apiResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [typeValue]); // <--- Dependency 'typeValue' added
 
  
  useEffect(() => {
  const dataFromApi = responselog?.data?.data;
  if (typeof dataFromApi === 'object' && dataFromApi !== null && !Array.isArray(dataFromApi)) {
    const dataAsArray = Object.values(dataFromApi);

    // Validate and type-assert the data
    if (dataAsArray.length > 0) {
      // Type guard to validate the array items match IProduct structure
      const isValidProductArray = dataAsArray.every(item => 
        item && 
        typeof item === 'object' && 
        '_id' in item // Add checks for required IProduct properties
      );
      
      if (isValidProductArray) {
        setTableData(dataAsArray as IProduct[]);
      } else {
        console.error('Data does not match IProduct structure:', dataAsArray);
        // Handle invalid data - maybe set an empty array or default values
        setTableData([]);
      }
    }
  } else if (Array.isArray(dataFromApi)) {
    console.info("Data was already an array:", dataFromApi);
    if (dataFromApi.length > 0) {
      // Same validation before setting
      const isValidProductArray = dataFromApi.every(item => 
        item && 
        typeof item === 'object' && 
        '_id' in item // Add checks for required IProduct properties
      );
      
      if (isValidProductArray) {
        setTableData(dataFromApi as IProduct[]);
      } else {
        console.error('Data does not match IProduct structure:', dataFromApi);
        setTableData([]);
      }
    }
  }
}, [responselog]);



  
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
  });

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

          

          <ProductTableToolbar
            filterName={filterName}
            filterStatus={filterStatus}
            onFilterName={handleFilterName}
            onFilterStatus={handleFilterStatus}
            statusOptions={STATUS_OPTIONS}
            isFiltered={isFiltered}
            onResetFilter={handleResetFilter}
          />

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={dense}
              numSelected={selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                onSelectAllRows(
                  checked,
                  tableData.map((row) => row.id)
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
  inputData: IProduct[];
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
      (product) => product.userId.toLowerCase().indexOf(filterName.toLowerCase()) !== -1
    );
  }

  if (filterStatus.length) {
    inputData = inputData.filter((product) => filterStatus.includes(product.inventoryType));
  }

  return inputData;
}
