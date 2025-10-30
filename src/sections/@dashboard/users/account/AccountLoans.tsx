import { paramCase } from 'change-case';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// @mui
import { 
  Card, Typography,
  Table,
  TableBody,
  TableContainer, 
  SelectChangeEvent, // Assuming SelectChangeEvent is needed for toolbar status filter
} from '@mui/material';
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
 import { ProductTableRow, ProductTableToolbar } from '../../loans/list';
// ----------------------------------------------------------------------

// FIX: Corrected 'id' fields to match potential loan data properties for sorting
const TABLE_HEAD = [
  { id: '_id', label: 'ID', align: 'left' }, // Should be '_id' for sorting by ID
  { id: 'userId', label: 'User ID', align: 'left' }, 
  { id: 'amount', label: 'Amount', align: 'left' },
  { id: 'term', label: 'Term', align: 'left' },
  { id: 'purpose', label: 'Purpose', align: 'left' },
  { id: 'interestRate', label: 'Interest Rate', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
  { id: 'createdAt', label: 'Date', align: 'left' }, 
  { id: '' }, // Placeholder for actions/menu, which should not have an ID for sorting
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
    onSelectAllRows,
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


  const [loanlog, setDashlog] = useState<any>(null);

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
        const loansResponse = await axios.get(`/admin/users/${id}/loans`, config);
        setDashlog(loansResponse.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]);
 
  useEffect(() => {
  const dataFromApi = loanlog?.data?.data;
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
}, [loanlog]);


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
 
  // FIX: Added the missing handler with the correct SelectChangeEvent type
  const handleFilterStatus = (event: SelectChangeEvent<string[]>) => {
    setPage(0);
    
    const { value } = event.target;
    
    // MUI SelectChangeEvent<string[]> is used, so value is typically string[]
    setFilterStatus(typeof value === 'string' ? [value] : value);
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
          Loan History
        </Typography>

          <ProductTableToolbar
            filterName={filterName}
            filterStatus={filterStatus}
            onFilterName={handleFilterName}
            onFilterStatus={handleFilterStatus} // FIX: Pass the corrected handler
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
                  onSelectAllRows={(checked) =>
                    onSelectAllRows(
                      checked,
                      tableData.map((row) => row._id)
                    )
                  }
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
                          onViewRow={() => handleViewRow(row._id)} // FIX: Use row._id here
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

// FIX: Updated applyFilter to use relevant loan data properties
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
    // Filter by fields relevant to loans, like user ID, purpose, or loan ID
    inputData = inputData.filter(
      (product) => 
        product.userId.toLowerCase().includes(filterName.toLowerCase()) ||
        product._id.toLowerCase().includes(filterName.toLowerCase()) || // Assuming _id is a string
        product.purpose.toLowerCase().includes(filterName.toLowerCase()) // Assuming 'purpose' exists on IProduct
    );
  }

  if (filterStatus.length) {
    // Filter by the 'status' property
    inputData = inputData.filter((product) => filterStatus.includes(product.status));
  }

  return inputData;
}