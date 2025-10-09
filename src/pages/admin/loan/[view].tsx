import { useState, useEffect } from 'react';
// next
import Head from 'next/head';

// @mui
import {
  Card,
  Table,
  Grid,
  TableBody,
  Container,
  TableContainer,
} from '@mui/material';
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
  TablePaginationCustom,
} from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
// sections
import { ProductDetailsTableRow } from '../../../sections/@dashboard/loans/list';
import { LoanStat } from '../../../sections/@dashboard/loans/details';
 
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Due Date', align: 'left' },
   { id: 'name', label: 'Amount', align: 'left' },
  { id: 'name', label: 'Amount Paid', align: 'left' }, 
  { id: 'name', label: 'Status', align: 'left' },
  { id: '' },
];
 
// ----------------------------------------------------------------------

EcommerceProductListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function EcommerceProductListPage() {
  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
     //
    selected,
    onSelectRow,
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

  const [filterName] = useState('');

  const [filterStatus] = useState<string[]>([]);


  const [loanlog, setDashlog] = useState<any>(null);
  const [loanstat, setDashstat] = useState<any>(null);

  const urlPath = window.location.pathname;
  const id = urlPath.split('/').filter(Boolean).pop(); 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 

        const loansResponse = await axios.get(`/admin/loans/details/${id}`, config);
        setDashlog(loansResponse.data.data.repaymentSchedule);
        setDashstat(loansResponse.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]);
 
  useEffect(() => {
    if (loanlog?.length) {
      setTableData(loanlog);
    }
  }, [loanlog]);

  useEffect(() => {
    if (loanstat?.length) {
      setTableData(loanstat);
    }
  }, [loanstat]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
    filterStatus,
  });


  const denseHeight = dense ? 60 : 80;

  const isNotFound = (!dataFiltered.length && !!filterName) || (!isLoading && !dataFiltered.length);

  return (
    <>
      <Head>
        <title> Loan: Loan Details | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Loan Details"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Loan',
              href: '',
            },
            { name: 'Loan Details' },
          ]}
        />

        <Card> 

          <Grid item xs={12} md={6} lg={4}>
            <LoanStat
              title="Total Loan"
              currentBalance={loanstat?.amount}
              statistics={loanstat}
              sentAmount={loanstat?.term}
            />
          </Grid>
          <br/>
          
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
                        <ProductDetailsTableRow
                          key={row?._id}
                          row={row}
                          selected={selected.includes(row?._id)}
                          onSelectRow={() => onSelectRow(row?._id)}
                          onViewRow={() => null}
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
