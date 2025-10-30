import { paramCase } from 'change-case';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// @mui
import { Card, Typography,
  Table,
  TableBody,
  TableContainer, } from '@mui/material';
// @types
import axios from '../../../../utils/axios';
import { useSelector } from '../../../../redux/store';
// @types
import { IProduct } from '../../../../@types/product';
import { PATH_DASHBOARD } from '../../../../routes/paths';

// components 

import {
  useTable,
  getComparator,
  emptyRows,
  TableNoData,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from '../../../../components/table';
import Scrollbar from '../../../../components/scrollbar';

// ----------------------------------------------------------------------
 import { ProductTableRow, ProductTableToolbar } from '../../bills/user';
// ----------------------------------------------------------------------

 
const TABLE_HEAD = [
  { id: 'name', label: 'Date', align: 'left' }, 
  { id: 'name', label: 'Provider', align: 'left' },
  { id: 'name', label: 'Service Type', align: 'left' },
  { id: 'name', label: 'Recipient', align: 'left' }, 
  { id: 'name', label: 'Amount', align: 'left' },
  { id: 'name', label: 'Status', align: 'left' },
];

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];
export default function AccountNotifications() {
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
    //
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({
    defaultOrderBy: 'createdAt',
  });

 
  const { push } = useRouter();


  const { isLoading } = useSelector((state) => state.product);

  const [tableData, setTableData] = useState<IProduct[]>([]);

  const [filterName, setFilterName] = useState('');

  const [filterStatus, setFilterStatus] = useState<string[]>([]);


  const [responselog, setDashlog] = useState<any>(null);

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
        const loansResponse = await axios.get(`/admin/users/${id}/bills`, config);
        setDashlog(loansResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]);
 

  useEffect(() => {
  const dataFromApi = responselog?.data.data;
  if (typeof dataFromApi === 'object' && dataFromApi !== null && !Array.isArray(dataFromApi)) {
      const dataAsArray = Object.values(dataFromApi);

     if (dataAsArray.length > 0) {
       setTableData(dataAsArray);
    }

  } else if (Array.isArray(dataFromApi)) {
    console.info("Data was already an array:", dataFromApi);
    if (dataFromApi.length > 0) {
        setTableData(dataFromApi);
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
 
  const handleViewRow = (_id: string) => {
    push(PATH_DASHBOARD.eCommerce.view(paramCase(_id)));
  };

  const handleResetFilter = () => {
    setFilterName('');
    setFilterStatus([]);
  };

      

  return (
       <Card sx={{ p: 3 }}>
        <Typography variant="overline" component="div" sx={{ color: 'text.secondary' }}>
          Payment History
        </Typography>

          <ProductTableToolbar
            filterName={filterName}
            filterStatus={filterStatus}
            onFilterName={handleFilterName}
            statusOptions={STATUS_OPTIONS}
            isFiltered={isFiltered}
            onResetFilter={handleResetFilter}
          />

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
                          onSelectRow={() => onSelectRow(row._id)}
                          onViewRow={() => handleViewRow(row.name)}
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
  );
}

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

