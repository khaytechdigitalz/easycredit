/* eslint-disable arrow-body-style */
import { paramCase } from 'change-case';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Button,
  Stack,
  Box,
  Tooltip,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  Checkbox,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  CircularProgress, // <-- Added for loading indicator in the new modal
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

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
// Interfaces and Constants 
// ----------------------------------------------------------------------

export interface ICustomerItem {
  _id: string;
  phone: string;
  email: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  
  first_name?: string;
  last_name?: string;
  gender?: string;
  nationality?: string;
}

// Interface for the new user creation payload
export interface ICreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bankone_customerid: string;
}


const TABLE_HEAD = [
  { id: '_id', label: 'ID', align: 'left' },
  { id: 'first_name', label: 'First Name', align: 'left' },
  { id: 'last_name', label: 'Last Name', align: 'left' },
  { id: 'gender', label: 'Gender', align: 'left' },
  { id: 'email', label: 'Email', align: 'left' },
  { id: 'phone', label: 'Phone', align: 'left' },
  { id: 'nationality', label: 'Nationality', align: 'left' },
  { id: 'phoneVerified', label: 'Phone Verification Status', align: 'left' },
  { id: '' }, // Empty ID for the action column
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];

// ----------------------------------------------------------------------
// 1. CustomerTableToolbar Component
// (Omitted for brevity - remains unchanged)
// ----------------------------------------------------------------------

interface CustomerTableToolbarProps {
  filterName: string;
  filterStatus: string[];
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterStatus: (event: SelectChangeEvent<string[]>) => void;
  statusOptions: { value: string; label: string }[];
  isFiltered: boolean;
  onResetFilter: VoidFunction;
}

function CustomerTableToolbar({
  filterName,
  filterStatus,
  onFilterName,
  onFilterStatus,
  statusOptions,
  isFiltered,
  onResetFilter,
}: CustomerTableToolbarProps) {
  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      justifyContent="space-between"
      sx={{ px: 3, py: 2 }}
    >

      <OutlinedInput
        value={filterName}
        onChange={onFilterName}
        placeholder="Search by name or email..."
        startAdornment={
          <InputAdornment position="start">
            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
          </InputAdornment>
        }
        sx={{ width: { sm: 940 } }}
      />
      <Select
        multiple
        displayEmpty
        value={filterStatus}
        onChange={onFilterStatus}
        input={<OutlinedInput fullWidth  placeholder="Filter status" />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Filter Status
              </Typography>
            );
          }
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Box
                  key={value}
                  sx={{
                    bgcolor: 'grey.300',
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                    textTransform: 'capitalize',
                  }}
                >
                  {statusOptions.find((option) => option.value === value)?.label}
                </Box>
              ))}
            </Box>
          );
        }}
      >
        {statusOptions
          .filter((option) => option.value !== 'all')
          .map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox checked={filterStatus.includes(option.value)} />
              {option.label}
            </MenuItem>
          ))}
      </Select>


      {isFiltered && (
        <Button
          color="error"
          sx={{ flexShrink: 0 }}
          onClick={onResetFilter}
          startIcon={<Iconify icon="eva:trash-2-outline" />}
        >
          Clear
        </Button>
      )}
    </Stack>
  );
}


// ----------------------------------------------------------------------
// 2. CustomerTableRow Component
// (Omitted for brevity - remains unchanged)
// ----------------------------------------------------------------------

interface CustomerTableRowProps {
  row: ICustomerItem;
  onViewRow: VoidFunction;
}

function CustomerTableRow({ row, onViewRow }: CustomerTableRowProps) {
  const {
    _id,
    first_name,
    last_name,
    gender,
    email,
    phone,
    nationality,
    phoneVerified, // Use the boolean field
  } = row;

  const statusLabel = phoneVerified ? 'Verified' : 'Unverified';
  const statusColor = phoneVerified ? 'success.main' : 'error.main';


  return (
    <TableRow hover>
      <Tooltip title={_id}>
        <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{_id}</TableCell>
      </Tooltip>
      {/* Handle optional fields gracefully */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{first_name || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{last_name || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{gender || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{email}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{phone}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{nationality || 'N/A'}</TableCell>
      
      {/* Display status based on phoneVerified boolean */}
      <TableCell sx={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            color: 'white',
            bgcolor: statusColor,
            display: 'inline-block'
          }}
        >
          {statusLabel}
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="View Details">
          <IconButton onClick={onViewRow}>
            <Iconify icon="eva:eye-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}


// ----------------------------------------------------------------------
// 3. CreateUserModal Component (New Addition)
// ----------------------------------------------------------------------

interface CreateUserModalProps {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (data: ICreateUserPayload) => void;
  isLoading: boolean;
}

function CreateUserModal({ open, onClose, onSubmit, isLoading }: CreateUserModalProps) {
  const [formData, setFormData] = useState<ICreateUserPayload>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bankone_customerid: '',
  });

  // Reset form data when the modal is closed
  useEffect(() => {
    if (!open) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bankone_customerid: '',
      });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Simple validation (can be enhanced with Formik/Yup)
    if (formData.first_name && formData.last_name && formData.email && formData.phone) {
        onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New User</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              required
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
            />
            <TextField
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
            />
            <TextField
              required
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
            />
            <TextField
              required
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
            />
            <TextField
              label="BankOne Customer ID"
              name="bankone_customerid"
              value={formData.bankone_customerid}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
              helperText="Optional field for linking to BankOne"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:plus-fill" />}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// 4. AllUsersBroadcastModal Component 
// (Omitted for brevity - remains unchanged)
// ----------------------------------------------------------------------

interface AllUsersBroadcastModalProps {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (title: string, content: string) => void;
  isLoading: boolean;
}

function AllUsersBroadcastModal({ open, onClose, onSubmit, isLoading }: AllUsersBroadcastModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit(title, content);
    }
  };

  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Broadcast to All Users</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              required
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              required
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading} startIcon={isLoading ? <Iconify icon="eva:refresh-outline" sx={{ mr: 1 }}  /> : null}>
            {isLoading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// 5. OneUserBroadcastModal Component 
// (Omitted for brevity - remains unchanged)
// ----------------------------------------------------------------------

interface OneUserBroadcastModalProps {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (userId: string, title: string, content: string) => void;
  customers: ICustomerItem[];
  isLoading: boolean;
}

function OneUserBroadcastModal({ open, onClose, onSubmit, customers, isLoading }: OneUserBroadcastModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Memoize customer list options for display
  const customerOptions = useMemo(() => {
    return customers.map(c => ({
      id: c._id,
      name: `${c.first_name || c.email} (${c._id.substring(0, 8)}...)`,
    }));
  }, [customers]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedUserId && title.trim() && content.trim()) {
      onSubmit(selectedUserId, title, content);
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedUserId('');
      setTitle('');
      setContent('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Broadcast to One User</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl required fullWidth>
              <InputLabel id="user-select-label">Select User</InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value as string)}
                label="Select User"
                fullWidth
                disabled={customers.length === 0 || isLoading}
              >
                {customers.length === 0 ? (
                    <MenuItem disabled>No users available</MenuItem>
                ) : (
                    customerOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))
                )}
              </Select>
            </FormControl>

            <TextField
              required
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              required
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!selectedUserId || isLoading} startIcon={isLoading ? <Iconify icon="eva:refresh-outline" sx={{ mr: 1 }}  /> : null}>
            {isLoading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// Main CustomerListPage Component (Updated)
// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function CustomerListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { push } = useRouter();

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [openCreateUser, setOpenCreateUser] = useState(false); // <-- New state for Create User Modal
  const [isCreatingUser, setIsCreatingUser] = useState(false); // <-- New state for Create User loading
  const [openAllBroadcast, setOpenAllBroadcast] = useState(false); 
  const [openOneBroadcast, setOpenOneBroadcast] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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
    defaultOrderBy: 'first_name',
  });

  const { themeStretch } = useSettingsContext();

  const [tableData, setTableData] = useState<ICustomerItem[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [responselog, setDashlog] = useState<any>(null);

  // Data fetching logic (Refreshes data only once on mount, or when dependency changes)
  const fetchDashboardData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };
      const requestResponse = await axios.get('/admin/user/list', config);
      const responseData = requestResponse.data.data.data || []; 
      setDashlog(responseData);

    } catch (error) {
      console.error("Error fetching customer list:", error);
      enqueueSnackbar('Failed to fetch customer list.', { variant: 'error' });
      setDashlog([]);
    } finally {
      setIsFetchingData(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (responselog && Array.isArray(responselog)) {
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

  const isFiltered = filterName !== '' || filterStatus.length > 0;

  const isNotFound = (!dataFiltered.length && !!filterName) || (!isFetchingData && !dataFiltered.length && !isFiltered);

  const handleFilterName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setFilterName(event.target.value);
  }, [setPage]);

  const handleFilterStatus = useCallback((event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setPage(0);
    setFilterStatus(typeof value === 'string' ? value.split(',') : value);
  }, [setPage]);


  const handleViewRow = useCallback((id: string) => {
    push(PATH_DASHBOARD.client.view(paramCase(id)));
  }, [push]);

  const handleResetFilter = useCallback(() => {
    setFilterName('');
    setFilterStatus([]);
  }, []);

  // ----------------------------------------------------------------------
  // Create User Logic (New)
  // ----------------------------------------------------------------------

  const handleCreateUserSubmit = useCallback(async (data: ICreateUserPayload) => {
    setIsCreatingUser(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.post(
        '/admin/user/create', // <-- The specified endpoint
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      enqueueSnackbar('User created successfully!', { variant: 'success' });
      setOpenCreateUser(false); // Close on success
      fetchDashboardData(); // Refresh the list
    } catch (error) {
      console.error('Error creating user:', error);
      // @ts-ignore
      const errorMessage = error.response?.data?.message || 'Failed to create user.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsCreatingUser(false);
    }
  }, [enqueueSnackbar, fetchDashboardData]);


  // ----------------------------------------------------------------------
  // Broadcast Logic 
  // (Omitted for brevity - remains unchanged)
  // ----------------------------------------------------------------------

  const handleBroadcastAllSubmit = useCallback(async (title: string, content: string) => {
    setIsBroadcasting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.post(
        '/admin/users/all/broadcast',
        { title, content },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      enqueueSnackbar('Broadcast sent to all users successfully!', { variant: 'success' });
      setOpenAllBroadcast(false); // Close on success
    } catch (error) {
      console.error('Error sending broadcast to all users:', error);
      enqueueSnackbar('Failed to send broadcast to all users.', { variant: 'error' });
    } finally {
      setIsBroadcasting(false);
    }
  }, [enqueueSnackbar]);

  const handleBroadcastOneSubmit = useCallback(async (userId: string, title: string, content: string) => {
    setIsBroadcasting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.post(
        `/admin/users/${userId}/broadcast`,
        { title, content },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      enqueueSnackbar(`Broadcast sent to user ${userId} successfully!`, { variant: 'success' });
      setOpenOneBroadcast(false); // Close on success
    } catch (error) {
      console.error(`Error sending broadcast to user ${userId}:`, error);
      enqueueSnackbar(`Failed to send broadcast to user ${userId}.`, { variant: 'error' });
    } finally {
      setIsBroadcasting(false);
    }
  }, [enqueueSnackbar]);


  // ----------------------------------------------------------------------
  // CSV & Excel Export Functions (omitted for brevity, they remain unchanged)
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
        rowData.first_name || 'N/A',
        rowData.last_name || 'N/A',
        rowData.gender || 'N/A',
        rowData.email,
        rowData.phone,
        rowData.nationality || 'N/A',
        rowData.phoneVerified ? 'Verified' : 'Unverified', // Map boolean to string for export
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


  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD.slice(0, -1).map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData = row as ICustomerItem;
      const verificationStatus = rowData.phoneVerified ? 'Verified' : 'Unverified';

      const rowValues = [
        rowData._id,
        rowData.first_name || 'N/A',
        rowData.last_name || 'N/A',
        rowData.gender || 'N/A',
        rowData.email,
        rowData.phone,
        rowData.nationality || 'N/A',
        verificationStatus,
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
        
        {/* --- Action Buttons (Updated) --- */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mb: 3 }}
        >
          {/* New Add User Button */}
          <Button
            variant="contained"
            onClick={() => setOpenCreateUser(true)} // <-- Open the new modal
            startIcon={<Iconify icon="eva:person-add-fill" />}
          >
            Add New User
          </Button>
          
          {/* Broadcast Buttons */}
          <Button
            variant="outlined"
            onClick={() => setOpenAllBroadcast(true)}
            startIcon={<Iconify icon="eva:message-square-outline" />}
          >
            Send Broadcast to All Users
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenOneBroadcast(true)}
            startIcon={<Iconify icon="eva:person-add-outline" />}
            disabled={tableData.length === 0 && !isFetchingData}
          >
            Send Broadcast to One User
          </Button>
        </Stack>
        {/* ------------------------------------- */}

        <Card>
          {/* 1. CustomerTableToolbar */}
          <CustomerTableToolbar
            filterName={filterName}
            filterStatus={filterStatus}
            onFilterName={handleFilterName}
            onFilterStatus={handleFilterStatus}
            statusOptions={STATUS_OPTIONS}
            isFiltered={isFiltered}
            onResetFilter={handleResetFilter}
          />

          {/* 2. Export Buttons */}
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
                  rowCount={tableData.length}
                  numSelected={selected.length}
                  onSort={onSort}
                />

                <TableBody>
                  {(isFetchingData ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <CustomerTableRow
                          key={row._id}
                          row={row}
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
      
      {/* --- New User Creation Modal --- */}
      <CreateUserModal
        open={openCreateUser}
        onClose={() => setOpenCreateUser(false)}
        onSubmit={handleCreateUserSubmit}
        isLoading={isCreatingUser}
      />

      {/* --- Broadcast Modals --- */}
      <AllUsersBroadcastModal
        open={openAllBroadcast}
        onClose={() => setOpenAllBroadcast(false)}
        onSubmit={handleBroadcastAllSubmit}
        isLoading={isBroadcasting}
      />

      <OneUserBroadcastModal
        open={openOneBroadcast}
        onClose={() => setOpenOneBroadcast(false)}
        onSubmit={handleBroadcastOneSubmit}
        customers={tableData}
        isLoading={isBroadcasting}
      />
      {/* ------------------------------- */}
    </>
  );
}

// ----------------------------------------------------------------------
// Filter Logic 
// (Omitted for brevity - remains unchanged)
// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
  filterStatus,
}: {
  inputData: ICustomerItem[];
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

  let filteredData = inputData;

  if (filterName) {
    // Filter by fields that are usually present: email, first name, last name
    filteredData = filteredData.filter(
      (customer) => customer.email.toLowerCase().includes(filterName.toLowerCase()) ||
                   (customer.first_name && customer.first_name.toLowerCase().includes(filterName.toLowerCase())) ||
                   (customer.last_name && customer.last_name.toLowerCase().includes(filterName.toLowerCase()))
    );
  }

  if (filterStatus.length > 0 && filterStatus.some(status => status !== 'all')) {
    // Convert selected status strings to boolean values for filtering
    const verifiedFilter = filterStatus.includes('verified');
    const unverifiedFilter = filterStatus.includes('unverified');

    filteredData = filteredData.filter((customer) => {
        const isVerified = customer.phoneVerified;

        if (verifiedFilter && isVerified) return true;
        if (unverifiedFilter && !isVerified) return true;
        
        return false;
    });
  }

  return filteredData;
}