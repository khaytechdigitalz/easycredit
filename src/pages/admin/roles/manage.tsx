import * as Yup from 'yup';
import { useState, useEffect, useMemo, useCallback } from 'react';
// next
import Head from 'next/head';
// form
import { useForm } from 'react-hook-form'; 
import { yupResolver } from '@hookform/resolvers/yup';
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
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Tooltip,
  DialogActions,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
// redux
// NOTE: Removed 'AxiosError, isAxiosError' imports here as requested.
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
import FormProvider, { RHFTextField, RHFMultiCheckbox } from '../../../components/hook-form';
import Label from '../../../components/label';

// ----------------------------------------------------------------------

// --- INTERFACES ---

export interface IRoleItem {
  _id: string;
  name: string;
  permissions: string[];
  status: number; // 1 = Active, 0 = Inactive
  createdAt: number;
  updatedAt: number;
}

export interface IPermissionItem {
  _id: string;
  name: string;
  description: string;
}

interface HeadLabel {
  id: keyof IRoleItem | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface RoleCreateFormValues {
  name: string;
  permissions: string[];
  // NOTE: 'root' error is no longer needed if we rely only on snackbar for server errors
  // root?: {
  //   server?: FieldError;
  // };
}

// ----------------------------------------------------------------------
// --- CONSTANTS ---
const TABLE_HEAD: HeadLabel[] = [
  { id: 'name', label: 'Role Name', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
  { id: 'permissions', label: 'Permissions', align: 'left' },
  { id: 'createdAt', label: 'Created At', align: 'left' },
  { id: 'updatedAt', label: 'Updated At', align: 'left' },
  { id: 'action', label: 'Action', align: 'center' }, // New Action column
];

// ----------------------------------------------------------------------
// --- ROLE STATUS TOGGLE MODAL COMPONENT ---

interface RoleStatusModalProps {
  open: boolean;
  onClose: () => void;
  role: IRoleItem | null; // The role being modified
  onUpdateSuccess: () => void;
}

function RoleStatusModal({ open, onClose, role, onUpdateSuccess }: RoleStatusModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!role) return null;

  const newStatus = role.status === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? 'Enable' : 'Disable';
  const confirmationMessage = `Are you sure you want to ${actionText.toLowerCase()} the role "${role.name}"?`;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const config = {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      };

      // PATCH request to update the status
      // Endpoint: admin/roles/:_id
      await axios.put(`/admin/roles/${role._id}`, { status: newStatus }, config);

      enqueueSnackbar(`Role "${role.name}" successfully ${actionText.toLowerCase()}d.`, { variant: 'success' });
      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error('Status update error:', error);
      enqueueSnackbar(`Failed to ${actionText.toLowerCase()} role "${role.name}".`, { variant: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        Confirm Role Status Change
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Alert severity={newStatus === 1 ? 'info' : 'warning'}>
          {confirmationMessage}
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isUpdating}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleUpdate}
          loading={isUpdating}
          variant="contained"
          color={newStatus === 1 ? 'success' : 'error'}
        >
          {actionText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// --- ROLE TABLE ROW COMPONENT ---

interface RoleTableRowProps {
  row: IRoleItem;
  onToggleStatus: (role: IRoleItem) => void; // New prop for status toggle
}

function RoleTableRow({ row, onToggleStatus }: RoleTableRowProps) {
  const { name, permissions, status, createdAt, updatedAt } = row;

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  const statusIcon = status === 1 ? 'eva:slash-fill' : 'eva:checkmark-fill';
  const statusLabel = status === 1 ? 'Disable' : 'Enable';

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>

      <TableCell align="center">
        <Label color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? 'Active' : 'Inactive'}
        </Label>
      </TableCell>

      <TableCell sx={{ minWidth: 200 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {permissions.slice(0, 3).map((permission) => (
            <Box
              key={permission}
              sx={{
                fontSize: 12,
                px: 1,
                borderRadius: 0.5,
                bgcolor: 'primary.lighter',
                color: 'primary.darker',
                border: (theme) => `1px solid ${theme.palette.primary.light}`,
                whiteSpace: 'nowrap',
              }}
            >
              {permission.replace(/_/g, ' ')}
            </Box>
          ))}
          {permissions.length > 3 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
              + {permissions.length - 3} more
            </Typography>
          )}
        </Box>
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(createdAt)}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(updatedAt)}</TableCell>

      {/* --- NEW ACTION CELL --- */}
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title={`${statusLabel} Role`}>
          <IconButton onClick={() => onToggleStatus(row)} color={status === 1 ? 'error' : 'success'}>
            <Iconify icon={statusIcon} />
          </IconButton>
        </Tooltip>
      </TableCell>
      {/* ----------------------- */}
    </TableRow>
  );
}

// ----------------------------------------------------------------------
// --- ROLE CREATE FORM MODAL COMPONENT (Re-used) ---

interface RoleCreateFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availablePermissions: IPermissionItem[];
}

const RoleCreateSchema = Yup.object().shape({
  name: Yup.string().required('Role name is required'),
  permissions: Yup.array().min(1, 'At least one permission must be selected'),
});

function RoleCreateFormModal({ open, onClose, onSuccess, availablePermissions }: RoleCreateFormModalProps) {
  const { enqueueSnackbar } = useSnackbar();

  const defaultValues: RoleCreateFormValues = useMemo(() => ({
    name: '',
    permissions: [],
  }), []);

  const methods = useForm<RoleCreateFormValues>({
    resolver: yupResolver(RoleCreateSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = methods;

  const onSubmit = useCallback(async (data: RoleCreateFormValues) => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        };

        await axios.post('/admin/role', data, config);

        enqueueSnackbar('Role created successfully!', { variant: 'success' });
        reset();
        onSuccess();

    } catch (error) { // error is now a generic unknown type
        console.error('Role creation error:', error);

        let errorMessage = 'Failed to create role. Please check the name and permissions.';

        // START: Simplified Error Handling
        if (error && typeof error === 'object' && 'response' in error && error.response) {
            // Attempt to get the error message from the Axios response object (unsafe access without AxiosError type)
            const responseData = (error.response as any).data;
            
            if (responseData && responseData.data && responseData.data.error) {
                errorMessage = responseData.data.error;
            } else if (responseData && responseData.message) {
                errorMessage = responseData.message;
            }
        }
        // END: Simplified Error Handling

        // Use normal snackbar toast for the error response
        enqueueSnackbar(errorMessage, { variant: 'error' });
    }
}, [enqueueSnackbar, onSuccess, reset]);

  const permissionOptions = availablePermissions.map(p => ({
    label: p.description || p.name.replace(/_/g, ' '),
    value: p._id,
  }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Create New Role
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* NOTE: Removed Alert for errors.root?.server */}
            {/* {!!errors.root?.server && (
              <Alert severity="error">{errors.root.server.message}</Alert>
            )} */}

            <RHFTextField name="name" label="Role Name" />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Permissions
              </Typography>
              {availablePermissions.length > 0 ? (
                <RHFMultiCheckbox
                  name="permissions"
                  options={permissionOptions}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(1, 1fr)',
                      sm: 'repeat(2, 1fr)',
                    },
                    gap: 1,
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading permissions...
                </Typography>
              )}
               {!!errors.permissions && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.permissions.message}
                </Typography>
              )}
            </Box>

            <LoadingButton
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
            >
              Create Role
            </LoadingButton>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// --- MAIN LIST PAGE COMPONENT ---

RoleListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function RoleListPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // States for Modals and Permissions
  const [openModal, setOpenModal] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<IPermissionItem[]>([]);

  // --- NEW STATE FOR STATUS MODAL ---
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<IRoleItem | null>(null);
  // ------------------------------------

  const [isFetchingData, setIsFetchingData] = useState(true);

  // Handlers for Create Modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Handlers for Status Modal
  const handleToggleStatus = useCallback((role: IRoleItem) => {
    setSelectedRole(role);
    setOpenStatusModal(true);
  }, []);

  const handleCloseStatusModal = () => {
    setSelectedRole(null);
    setOpenStatusModal(false);
  };

  // Triggers data refresh after successful creation or status update
  const handleSuccessUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseModal(); // Closes Create Modal if successful
    handleCloseStatusModal(); // Closes Status Modal if successful
  }, []);

  // --- useEffect to fetch available permissions ---
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        };
        const response = await axios.get('/admin/permissions', config);

        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          setAvailablePermissions(response.data.data.data as IPermissionItem[]);
        }
      } catch (error) {
        console.error("Error fetching available permissions:", error);
        // Optionally add a snackbar error here if permissions are critical
      }
    };

    fetchPermissions();
  }, [enqueueSnackbar]);
  // ------------------------------------------------------------------------


  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({
    defaultOrderBy: 'name',
  });

  const { themeStretch } = useSettingsContext();
  const [tableData, setTableData] = useState<IRoleItem[]>([]);
  const [filterName] = useState('');
  const [responselog, setDashlog] = useState<IRoleItem[] | null>(null);

  // --- Data fetching logic for /admin/roles ---
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

        const requestResponse = await axios.get('/admin/roles', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data.data)) {
          const mappedData: IRoleItem[] = requestResponse.data.data.data.map((item: any) => ({
            _id: item._id,
            name: item.name,
            permissions: item.permissions || [],
            status: item.status !== undefined ? item.status : 0,
            createdAt: item.createdAt || 0,
            updatedAt: item.updatedAt || 0,
          }));

          setDashlog(mappedData);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching roles log:", error);
        enqueueSnackbar('Failed to fetch roles log.', { variant: 'error' });
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

  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData,
    comparator: getComparator(order, orderBy),
    filterName,
  }), [tableData, order, orderBy, filterName]);


  const denseHeight = dense ? 60 : 80;
  const isNotFound = (!dataFiltered.length && !!filterName) || (!isFetchingData && !dataFiltered.length);

  const formatExportDate = (timestamp: number) => timestamp ? new Date(timestamp).toLocaleString() : '';

  // ----------------------------------------------------------------------
  // 💾 CSV Export Function (Unchanged)
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD.filter(h => h.id !== 'action').map(head => head.label).join(','); // Exclude 'Action' column

    const csvRows = dataFiltered.map((row) => {
      const rowData: IRoleItem = row;

      const values = [
        rowData.name,
        rowData.status === 1 ? 'Active' : 'Inactive',
        rowData.permissions.join(' | '),
        formatExportDate(rowData.createdAt),
        formatExportDate(rowData.updatedAt),
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
    link.setAttribute('download', 'roles_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('CSV exported successfully!', { variant: 'success' });
  };


  // ----------------------------------------------------------------------
  // 📊 Excel Export Function (Unchanged)
  // ----------------------------------------------------------------------
  const exportToExcel = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = TABLE_HEAD.filter(h => h.id !== 'action').map(head => `<th>${head.label}</th>`).join(''); // Exclude 'Action' column

    const tableRows = dataFiltered.map((row) => {
      const rowData: IRoleItem = row;
      const rowValues = [
        rowData.name,
        rowData.status === 1 ? 'Active' : 'Inactive',
        rowData.permissions.join(', '),
        formatExportDate(rowData.createdAt),
        formatExportDate(rowData.updatedAt),
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
    link.setAttribute('download', 'roles_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Roles: Role List | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Roles"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            { name: 'Roles', href: PATH_DASHBOARD.root },
            { name: 'Role List' },
          ]}
          // ADD NEW ROLE BUTTON
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenModal}
            >
              New Role
            </Button>
          }
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
                  onSort={onSort}
                />

                <TableBody>
                  {(isFetchingData ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        // Pass the new handler to the row component
                        <RoleTableRow
                          key={row._id}
                          row={row as any}
                          onToggleStatus={handleToggleStatus}
                        />
                      ) : (
                        !isNotFound && <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      )
                    )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)}
                  />

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
            dense={dense}
            onChangeDense={onChangeDense}
          />
        </Card>
      </Container>

      {/* ROLE CREATE MODAL */}
      <RoleCreateFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccessUpdate}
        availablePermissions={availablePermissions}
      />

      {/* --- ROLE STATUS TOGGLE MODAL --- */}
      <RoleStatusModal
        open={openStatusModal}
        onClose={handleCloseStatusModal}
        role={selectedRole}
        onUpdateSuccess={handleSuccessUpdate}
      />
      {/* ---------------------------------- */}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: IRoleItem[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): IRoleItem[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: IRoleItem[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    filteredData = filteredData.filter(
      (product) => product.name.toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filteredData;
}