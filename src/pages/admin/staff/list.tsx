/* eslint-disable no-nested-ternary */
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Grid,
  Divider,
  useTheme,
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

// Interface matching the nested 'user' object in the API response
export interface IUserDetail {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  phoneVerified: boolean;
  tier: number;
  password?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Interface matching the actual list item in the API response
export interface IAdminListItem {
    _id: string; // Admin association ID
    user_id: string;
    role_id: string;
    status: number;
    createdAt: number; // (timestamp)
    updatedAt: number; // (timestamp)
    user: IUserDetail; // Nested user details
}

// Interface for Admin Details fetched by /admin/admins/:id
export type IAdminDetails = IAdminListItem;


// Interface ICustomerItem (flattened for table)
export interface ICustomerItem {
  _id: string; // user._id
  admin_id: string; // admin association ID (_id from IAdminListItem)
  phone: string;
  email: string;
  emailVerified: boolean;
  
  first_name?: string;
  last_name?: string;
  
  role_id: string; 
  status: number; 
  createdAt: number; 
  updatedAt: number; 
}

// Interface for the new admin creation payload
export interface ICreateAdminPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: string;
}

// Interface for Role Data
export interface IRole {
    _id: string;
    name: string;
    description: string;
}


const TABLE_HEAD = [
  { id: '_id', label: 'User ID', align: 'left' },
  { id: 'first_name', label: 'First Name', align: 'left' },
  { id: 'last_name', label: 'Last Name', align: 'left' },
  { id: 'email', label: 'Email', align: 'left' },
  { id: 'phone', label: 'Phone', align: 'left' },
  { id: 'role_id', label: 'Role ID', align: 'left' },
  { id: 'status', label: 'Status', align: 'left' },
  { id: 'createdAt', label: 'Created At', align: 'left' },
  { id: 'updatedAt', label: 'Updated At', align: 'left' },
  { id: '' }, // Empty ID for the action column
];

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' }, 
  { value: 'inactive', label: 'Inactive' }, 
];

// Helper to format timestamps
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

// Helper to get status label and next action
const getStatusLabel = (status: number) => {
  switch (status) {
    case 1:
      return { label: 'Active', color: 'success.main', nextStatus: 0, nextAction: 'Disable' };
    default:
      return { label: 'Inactive', color: 'error.main', nextStatus: 1, nextAction: 'Enable' };
  }
}

// ----------------------------------------------------------------------
// 1. CustomerTableToolbar Component
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
// ----------------------------------------------------------------------

interface CustomerTableRowProps {
  row: ICustomerItem;
  onViewRow: (adminId: string) => void;
}

function CustomerTableRow({ row, onViewRow }: CustomerTableRowProps) {
  const {
    _id,
    admin_id,
    first_name,
    last_name,
    email,
    phone,
    role_id,
    status,
    createdAt,
    updatedAt,
  } = row;

  const { label: statusLabel, color: statusColor } = getStatusLabel(status);


  return (
    <TableRow hover>
      <Tooltip title={_id}>
        <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{_id}</TableCell>
      </Tooltip>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{first_name || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{last_name || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{email}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{phone}</TableCell>
      
      <Tooltip title={role_id}>
        <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{role_id}</TableCell>
      </Tooltip>
      
      {/* Display Status */}
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
      
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTimestamp(createdAt)}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTimestamp(updatedAt)}</TableCell>

      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="View Details">
          <IconButton onClick={() => onViewRow(admin_id)}> 
            <Iconify icon="eva:eye-fill" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}


// ----------------------------------------------------------------------
// 3. CreateUserModal Component
// ----------------------------------------------------------------------

interface CreateUserModalProps {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (data: ICreateAdminPayload) => void;
  isLoading: boolean;
}

function CreateUserModal({ open, onClose, onSubmit, isLoading }: CreateUserModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);

  const [formData, setFormData] = useState<Omit<ICreateAdminPayload, 'role_id'>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [selectedRoleId, setSelectedRoleId] = useState('');


  const fetchRoles = useCallback(async () => {
    setIsFetchingRoles(true);
    try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await axios.get('/admin/roles', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const fetchedRoles: IRole[] = response.data.data.data || [];
        setRoles(fetchedRoles);
        
        if (fetchedRoles.length > 0) {
            setSelectedRoleId(fetchedRoles[0]._id);
        }

    } catch (error) {
        console.error("Error fetching roles:", error);
        enqueueSnackbar('Failed to fetch available roles.', { variant: 'error' });
    } finally {
        setIsFetchingRoles(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (open) {
      fetchRoles();
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
      });
      setSelectedRoleId('');
    }
  }, [open, fetchRoles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRoleId(e.target.value);
  };


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (formData.first_name && formData.last_name && formData.email && formData.phone && selectedRoleId) {
        const payload: ICreateAdminPayload = {
            ...formData,
            role_id: selectedRoleId
        };
        onSubmit(payload);
    } else {
         enqueueSnackbar('Please fill all required fields and select a role.', { variant: 'warning' });
    }
  };

  const formDisabled = isLoading || isFetchingRoles;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Admin</DialogTitle>
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
              disabled={formDisabled}
            />
            <TextField
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              disabled={formDisabled}
            />
            <TextField
              required
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              disabled={formDisabled}
            />
            <TextField
              required
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              disabled={formDisabled}
            />

            {/* Role ID Selector (Radio Button Group) */}
            <FormControl component="fieldset" required disabled={formDisabled}>
              <FormLabel component="legend">Select Admin Role</FormLabel>
              {isFetchingRoles ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="textSecondary">Fetching roles...</Typography>
                </Stack>
              ) : roles.length > 0 ? (
                <RadioGroup 
                  name="role_id" 
                  value={selectedRoleId} 
                  onChange={handleRoleChange} 
                  sx={{ mt: 1 }}
                >
                  {roles.map((role) => (
                    <Tooltip key={role._id} title={role.description} placement="right">
                      <FormControlLabel 
                        value={role._id} 
                        control={<Radio />} 
                        label={role.name} 
                      />
                    </Tooltip>
                  ))}
                </RadioGroup>
              ) : (
                <Typography color="error" variant="body2" sx={{ my: 1 }}>
                  No roles available. Cannot create admin.
                </Typography>
              )}
            </FormControl>
            
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={formDisabled}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={formDisabled || roles.length === 0 || !selectedRoleId}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:plus-fill" />}
          >
            {isLoading ? 'Creating...' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// 4. AdminDetailsModal Component
// ----------------------------------------------------------------------

interface AdminDetailsModalProps {
  open: boolean;
  adminId: string | null;
  onClose: (refetch?: boolean) => void;
}

function AdminDetailsModal({ open, adminId, onClose }: AdminDetailsModalProps) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [details, setDetails] = useState<IAdminDetails | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAdminDetails = useCallback(async (id: string) => {
    if (!id) return;
    setIsFetching(true);
    try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await axios.get(`/admin/admins/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        // CRITICAL FIX: Extract the single admin object from response.data.data.data[0]
        const fetchedDetails: IAdminDetails | undefined = response.data.data.data?.[0];
        
        if (fetchedDetails) {
            setDetails(fetchedDetails);
        } else {
            throw new Error("Admin details not found in the response array.");
        }


    } catch (error) {
        console.error("Error fetching admin details:", error);
        enqueueSnackbar('Failed to fetch admin details.', { variant: 'error' });
        setDetails(null);
    } finally {
        setIsFetching(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (open && adminId) {
      fetchAdminDetails(adminId);
    } else if (!open) {
      setDetails(null); // Reset details when modal is closed
    }
  }, [open, adminId, fetchAdminDetails]);

  const handleToggleStatus = useCallback(async () => {
    if (!details || !details.user_id) return;

    const { nextStatus, nextAction } = getStatusLabel(details.status);
    const newStatus = nextStatus;

    setIsUpdatingStatus(true);
    try {
        const accessToken = localStorage.getItem('accessToken');
        
        // PATCH request to /admin/admin/:user_id (User ID used here, not Admin Association ID)
        await axios.patch(
            `/admin/admin/${details._id}`, 
            { status: newStatus },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        enqueueSnackbar(`Admin successfully ${nextAction.toLowerCase()}d.`, { variant: 'success' });
        
        // Update local state and trigger parent refetch
        setDetails(prev => prev ? { ...prev, status: newStatus } : null);
        onClose(true); 
        
    } catch (error) {
        console.error(`Error toggling admin status:`, error);
        // @ts-ignore
        const errorMessage = error.response?.data?.message || `Failed to ${nextAction.toLowerCase()} admin.`;
        enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
        setIsUpdatingStatus(false);
    }
  }, [details, enqueueSnackbar, onClose]);


  if (isFetching || !adminId) {
    return (
        <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="md">
            <DialogContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ height: 300 }}>
                    <CircularProgress />
                    <Typography>Loading admin details...</Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
  }

  if (!details) {
    return (
        <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="md">
            <DialogTitle>Admin Details</DialogTitle>
            <DialogContent>
                <Typography color="error">
                    Failed to load details for Admin ID: {adminId}.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Close</Button>
            </DialogActions>
        </Dialog>
    );
  }
  
  const { label: statusLabel, color: statusColor, nextAction } = getStatusLabel(details.status);

  return (
    <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="md">
      <DialogTitle>
        Admin Details: {details.user.first_name} {details.user.last_name}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Section 1: Admin and User Identifiers */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1, color: theme.palette.primary.main }}>
                Identifiers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Admin ID (Association):</Typography>
                    <Tooltip title={details._id} placement="bottom-start">
                        <Typography variant="body1" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{details._id}</Typography>
                    </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">User ID:</Typography>
                    <Tooltip title={details.user_id} placement="bottom-start">
                        <Typography variant="body1" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{details.user_id}</Typography>
                    </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Role ID:</Typography>
                    <Typography variant="body1">{details.role_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Account Status:</Typography>
                    <Box
                        component="span"
                        sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            color: 'white',
                            bgcolor: statusColor,
                            display: 'inline-block',
                            textTransform: 'capitalize'
                        }}
                    >
                        {statusLabel}
                    </Box>
                </Grid>
            </Grid>
          </Grid>
          
          {/* Section 2: Contact Details */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1, mt: 3, color: theme.palette.primary.main }}>
                Contact Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{details.user.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                    <Typography variant="body1">{details.user.phone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">First Name:</Typography>
                    <Typography variant="body1">{details.user.first_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Last Name:</Typography>
                    <Typography variant="body1">{details.user.last_name || 'N/A'}</Typography>
                </Grid>
            </Grid>
          </Grid>
          
          {/* Section 3: Timestamps */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1, mt: 3, color: theme.palette.primary.main }}>
                System Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Admin Created At:</Typography>
                    <Typography variant="body1">{formatTimestamp(details.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Admin Last Updated At:</Typography>
                    <Typography variant="body1">{formatTimestamp(details.updatedAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">User Account Created At:</Typography>
                    <Typography variant="body1">{details.user.createdAt ? formatTimestamp(details.user.createdAt) : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Tier:</Typography>
                    <Typography variant="body1">{details.user.tier}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Phone Verified:</Typography>
                    <Typography variant="body1">{details.user.phoneVerified ? 'Yes' : 'No'}</Typography>
                </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
            onClick={handleToggleStatus} 
            variant="contained" 
            color={details.status === 1 ? 'error' : 'success'}
            disabled={isUpdatingStatus}
            startIcon={isUpdatingStatus ? <CircularProgress size={20} color="inherit" /> : <Iconify icon={details.status === 1 ? "eva:lock-fill" : "eva:unlock-fill"} />}
        >
          {isUpdatingStatus ? `${nextAction}ing...` : `${nextAction} Admin`}
        </Button>
        <Button onClick={() => onClose()}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// 5. Main CustomerListPage Component
// ----------------------------------------------------------------------

CustomerListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function CustomerListPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const [openAdminDetails, setOpenAdminDetails] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);


  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    selected,
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
  const [responselog, setDashlog] = useState<IAdminListItem[] | null>(null);

  // Data fetching logic
  const fetchDashboardData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };
      const requestResponse = await axios.get('/admin/admins', config);
      
      const responseData: IAdminListItem[] = requestResponse.data.data.data || []; 
      setDashlog(responseData);

    } catch (error) {
      console.error("Error fetching admin list:", error);
      enqueueSnackbar('Failed to fetch admin list.', { variant: 'error' });
      setDashlog([]);
    } finally {
      setIsFetchingData(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // DATA MAPPING
  useEffect(() => {
    if (responselog && Array.isArray(responselog)) {
      const flattenedData: ICustomerItem[] = responselog.map(adminItem => ({
        _id: adminItem.user._id, // User ID (used for sorting/table ID)
        admin_id: adminItem._id, // Admin Association ID (used for fetching details)
        phone: adminItem.user.phone,
        email: adminItem.user.email,
        emailVerified: false, 
        first_name: adminItem.user.first_name,
        last_name: adminItem.user.last_name,
        
        role_id: adminItem.role_id,
        status: adminItem.status,
        createdAt: adminItem.createdAt,
        updatedAt: adminItem.updatedAt,
      }));
      setTableData(flattenedData);
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


  const handleResetFilter = useCallback(() => {
    setFilterName('');
    setFilterStatus([]);
  }, []);
  
  // Admin Details Modal Handlers
  const handleOpenDetails = useCallback((adminId: string) => {
    setSelectedAdminId(adminId);
    setOpenAdminDetails(true);
  }, []);

  const handleCloseDetails = useCallback((refetch = false) => {
    setOpenAdminDetails(false);
    setSelectedAdminId(null);
    if (refetch) {
        fetchDashboardData(); // Refetch list if status was updated
    }
  }, [fetchDashboardData]);

  // Create User Logic
  const handleCreateUserSubmit = useCallback(async (data: ICreateAdminPayload) => {
    setIsCreatingUser(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      await axios.post(
        '/admin/admin', 
        data, 
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      enqueueSnackbar('Admin user created successfully!', { variant: 'success' });
      setOpenCreateUser(false); 
      fetchDashboardData(); 
    } catch (error) {
      console.error('Error creating admin user:', error);
      // @ts-ignore
      const errorMessage = error.response?.data?.message || 'Failed to create admin user.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsCreatingUser(false);
    }
  }, [enqueueSnackbar, fetchDashboardData]);


  // CSV & Excel Export Functions
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD
      .slice(0, -1)
      .map(head => head.label)
      .join(',');

    const csvRows = dataFiltered.map((row) => {
      const rowData = row as ICustomerItem;
      const { label: statusLabel } = getStatusLabel(rowData.status);

      const values = [
        rowData._id,
        rowData.first_name || 'N/A',
        rowData.last_name || 'N/A',
        rowData.email,
        rowData.phone,
        rowData.role_id, 
        statusLabel, 
        formatTimestamp(rowData.createdAt), 
        formatTimestamp(rowData.updatedAt), 
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
    link.setAttribute('download', 'admin_list.csv');
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
      const { label: statusLabel } = getStatusLabel(rowData.status);

      const rowValues = [
        rowData._id,
        rowData.first_name || 'N/A',
        rowData.last_name || 'N/A',
        rowData.email,
        rowData.phone,
        rowData.role_id, 
        statusLabel, 
        formatTimestamp(rowData.createdAt), 
        formatTimestamp(rowData.updatedAt), 
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
    link.setAttribute('download', 'admin_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Admins: Manage Admins | Easy Credit</title> 
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Admins"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Admins',
              href: '',
            },
            { name: 'Manage Admins' },
          ]}
        />
        
        {/* --- Action Buttons --- */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mb: 3 }}
        >
          <Button
            variant="contained"
            onClick={() => setOpenCreateUser(true)}
            startIcon={<Iconify icon="eva:person-add-fill" />}
          >
            Add New Admin
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
                          onViewRow={handleOpenDetails} 
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
      
      {/* --- New Admin Creation Modal --- */}
      <CreateUserModal
        open={openCreateUser}
        onClose={() => setOpenCreateUser(false)}
        onSubmit={handleCreateUserSubmit}
        isLoading={isCreatingUser}
      />
      
      {/* --- Admin Details and Status Toggle Modal --- */}
      <AdminDetailsModal
        open={openAdminDetails}
        adminId={selectedAdminId}
        onClose={handleCloseDetails} 
      />
    </>
  );
}

// ----------------------------------------------------------------------
// 6. Filter Logic
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
    filteredData = filteredData.filter(
      (customer) => customer.email.toLowerCase().includes(filterName.toLowerCase()) ||
                   (customer.first_name && customer.first_name.toLowerCase().includes(filterName.toLowerCase())) ||
                   (customer.last_name && customer.last_name.toLowerCase().includes(filterName.toLowerCase())) ||
                   customer.role_id.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  if (filterStatus.length > 0 && filterStatus.some(status => status !== 'all')) {
    const activeFilter = filterStatus.includes('active');
    const inactiveFilter = filterStatus.includes('inactive');

    filteredData = filteredData.filter((customer) => {
        const isActive = customer.status === 1;

        if (activeFilter && isActive) return true;
        if (inactiveFilter && !isActive) return true;
        
        return false;
    });
  }

  return filteredData;
}