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
  Dialog, // Added Dialog for Modal
  DialogTitle, // Added DialogTitle
  DialogContent, // Added DialogContent
  IconButton, // Added IconButton
  Typography, // Added Typography
  CircularProgress, // Added CircularProgress for loading state
} from '@mui/material';

import TableRow from '@mui/material/TableRow'; 
import TableCell from '@mui/material/TableCell'; 
// utils
import { fDateTime } from '../../../utils/formatTime';
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
// Interfaces
// ----------------------------------------------------------------------
export interface IUser {
  _id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

// Interface for the conversation details from the secondary API call
export interface IMessageDetail {
    _id: string;
    sender: 'user' | 'admin';
    message: string;
    sentAt: number;
}

export interface IChatConversation {
  conversationId: string | null;
  userId: string;
  lastMessage: string;
  lastAt: number; // Unix timestamp
  user: IUser;
}

export type ICustomerItem = IChatConversation; 

// Define the structure for your table header
interface HeadLabel {
  id: keyof IChatConversation | 'userName' | 'userEmail' | 'userPhone' | 'action' | string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

// ----------------------------------------------------------------------
// Table Headers
// ----------------------------------------------------------------------
const TABLE_HEAD: HeadLabel[] = [
  { id: 'userName', label: 'User Name', align: 'left' },
  { id: 'userEmail', label: 'Email', align: 'left' },
  { id: 'userPhone', label: 'Phone', align: 'left' },
  { id: 'lastMessage', label: 'Last Message', align: 'left' },
  { id: 'lastAt', label: 'Last Active', align: 'left' },
  { id: 'action', label: 'Action', align: 'center' }, // New Action Column
];

// ----------------------------------------------------------------------
// Message Detail Modal Component
// ----------------------------------------------------------------------
interface MessageDetailModalProps {
    open: boolean;
    onClose: () => void;
    conversationId: string | null;
    userName: string;
}

function MessageDetailModal({ open, onClose, conversationId, userName }: MessageDetailModalProps) {
    const [messages, setMessages] = useState<IMessageDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const fetchMessages = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const accessToken = localStorage.getItem('accessToken');
            const config = {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            // Endpoint: /admin/livechat?conversationId=_id
            const response = await axios.get(`/admin/livechat?conversationId=${id}`, config);

            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setMessages(response.data.data as IMessageDetail[]);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error fetching message details:", error);
            enqueueSnackbar('Failed to fetch message details.', { variant: 'error' });
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (open && conversationId) {
            fetchMessages(conversationId);
        } else if (!open) {
            setMessages([]); // Clear messages when closed
        }
    }, [open, conversationId, fetchMessages]);


    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            scroll="paper"
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Conversation with **{userName}**</Typography>
                    <IconButton onClick={onClose}>
                        <Iconify icon="eva:close-fill" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 300 }}>
                {isLoading ? (
                    <Stack justifyContent="center" alignItems="center" sx={{ height: 200 }}>
                        <CircularProgress />
                    </Stack>
                ) : conversationId === null ? (
                     <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 5 }}>
                        Conversation ID is missing. Cannot retrieve details.
                    </Typography>
                ) : messages.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 5 }}>
                        No message details found for this conversation.
                    </Typography>
                ) : (
                    <Scrollbar sx={{ maxHeight: 500 }}>
                        <Stack spacing={2} sx={{ py: 1 }}>
                            {messages.map((msg, index) => (
                                <Stack
                                    key={msg._id || index}
                                    direction="column"
                                    alignItems={msg.sender === 'user' ? 'flex-start' : 'flex-end'}
                                >
                                    <Card 
                                        sx={{ 
                                            p: 1.5, 
                                            maxWidth: '80%', 
                                            backgroundColor: msg.sender === 'user' ? 'primary.lighter' : 'grey.300',
                                            color: msg.sender === 'user' ? 'primary.darker' : 'text.primary',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {msg.message}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                            {msg.sender === 'user' ? userName : 'Admin'} • {fDateTime(msg.sentAt)}
                                        </Typography>
                                    </Card>
                                </Stack>
                            ))}
                        </Stack>
                    </Scrollbar>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ----------------------------------------------------------------------
// LiveChat Table Row Component (with enabled action button)
// ----------------------------------------------------------------------
interface LiveChatTableRowProps {
  row: IChatConversation;
  onViewDetails: (conversationId: string | null, userName: string) => void; // conversationId can be null
}

function LiveChatTableRow({ row, onViewDetails }: LiveChatTableRowProps) {
  const { lastMessage, lastAt, user, conversationId } = row;

  // Combine first_name and last_name
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  // Format timestamp to readable date/time
  const formattedLastAt = fDateTime(lastAt);

  const handleView = () => {
    // Pass conversationId (which can be null) and user name to the parent handler
    onViewDetails(conversationId, fullName || 'User');
  }

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fullName || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.email || 'N/A'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.phone || 'N/A'}</TableCell>
      <TableCell sx={{ minWidth: 280 }}>{lastMessage}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formattedLastAt}</TableCell>
      {/* New Action Cell - Button is ENABLED */}
      <TableCell align="center">
        <Button 
            variant="contained" 
            size="small"
            onClick={handleView}
            startIcon={<Iconify icon="eva:eye-fill" />}
            // Removed disabled prop so the button is always clickable
        >
            View
        </Button>
      </TableCell>
    </TableRow>
  );
}
// ----------------------------------------------------------------------

LiveChatListPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------
// Main LiveChatListPage Component
// ----------------------------------------------------------------------

export default function LiveChatListPage() { 
  const { enqueueSnackbar } = useSnackbar();
  const [refreshTrigger] = useState(0); 
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

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
    defaultOrderBy: 'lastAt', // Sort by last message time
  });

  const { themeStretch } = useSettingsContext();


  const [tableData, setTableData] = useState<IChatConversation[]>([]);

  const [filterName] = useState('');

  const [responselog, setDashlog] = useState<IChatConversation[] | null>(null);

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

        const requestResponse = await axios.get('/admin/livechat', config);

        if (requestResponse.data && requestResponse.data.data && Array.isArray(requestResponse.data.data)) {
          setDashlog(requestResponse.data.data as IChatConversation[]);
        } else {
          setDashlog([]);
        }

      } catch (error) {
        console.error("Error fetching livechat log:", error);
        enqueueSnackbar('Failed to fetch livechat log.', { variant: 'error' });
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


  // Handler to open the modal and set conversation details
  const handleViewDetails = (conversationId: string | null, userName: string) => {
    setSelectedConversationId(conversationId);
    setSelectedUserName(userName);
    setOpenModal(true);
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setOpenModal(false);
    // Don't clear ID here, as it might cause a flicker. 
    // Clear state in modal's useEffect on close.
  };


  // ----------------------------------------------------------------------
  // Export Functions (excluding 'action' column)
  // ----------------------------------------------------------------------
  const exportToCsv = () => {
    if (!dataFiltered || dataFiltered.length === 0) {
      enqueueSnackbar('No data to export.', { variant: 'warning' });
      return;
    }

    const headers = 'User Name,Email,Phone,Last Message,Last Active'; 
    
    const csvRows = dataFiltered.map((row) => {
      const rowData: IChatConversation = row;
      const fullName = `${rowData.user?.first_name || ''} ${rowData.user?.last_name || ''}`.trim();
      const formattedLastAt = fDateTime(rowData.lastAt);

      const values = [
        fullName,
        rowData.user?.email || '',
        rowData.user?.phone || '',
        rowData.lastMessage,
        formattedLastAt,
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
    link.setAttribute('download', 'livechat_data_list.csv');
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

    const headers = TABLE_HEAD
      .filter(head => head.id !== 'action') // Exclude 'action' column
      .map(head => `<th>${head.label}</th>`).join('');

    const tableRows = dataFiltered.map((row) => {
      const rowData: IChatConversation = row;
      const fullName = `${rowData.user?.first_name || ''} ${rowData.user?.last_name || ''}`.trim();
      const formattedLastAt = fDateTime(rowData.lastAt);
      
      const rowValues = [
        fullName,
        rowData.user?.email || '',
        rowData.user?.phone || '',
        rowData.lastMessage,
        formattedLastAt,
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
    link.setAttribute('download', 'livechat_data_list.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar('Excel exported successfully!', { variant: 'success' });
  };


  return (
    <>
      <Head>
        <title> Live Chat: Live Chat Data | Easy Credit</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <CustomBreadcrumbs
          heading="Manage Live Chat Data (Read Only)"
          links={[
            { name: 'Dashboard', href: PATH_DASHBOARD.root },
            {
              name: 'Live Chat Data',
              href: PATH_DASHBOARD.livechat.root,
            },
            { name: 'Live Chat Data' },
          ]}
          action={null} 
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
                  numSelected={0} // Selected is 0 since this is read-only
                  onSort={onSort}
                />

                <TableBody>
                  {(isFetchingData ? [...Array(rowsPerPage)] : dataFiltered)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) =>
                      row ? (
                        <LiveChatTableRow
                          key={row.userId} // Using userId as key
                          row={row as any}
                          onViewDetails={handleViewDetails} // Pass the handler
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
      
      {/* Render the Modal */}
      <MessageDetailModal
        open={openModal}
        onClose={handleCloseModal}
        conversationId={selectedConversationId}
        userName={selectedUserName}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// Filter Function
// ----------------------------------------------------------------------
function applyFilter({
  inputData,
  comparator,
  filterName,
}: {
  inputData: IChatConversation[];
  comparator: (a: any, b: any) => number;
  filterName: string;
}): IChatConversation[] {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData: IChatConversation[] = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    const filterText = filterName.toLowerCase();
    filteredData = filteredData.filter(
      (chat) => {
        const fullName = `${chat.user?.first_name || ''} ${chat.user?.last_name || ''}`.trim().toLowerCase();
        return fullName.includes(filterText) || 
               chat.user?.email.toLowerCase().includes(filterText) ||
               chat.lastMessage.toLowerCase().includes(filterText);
      }
    );
  }

  return filteredData;
}