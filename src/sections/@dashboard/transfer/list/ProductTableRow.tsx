import { useState } from 'react';
import { sentenceCase } from 'change-case';
// @mui
import {
  Stack,
  TableRow,
  MenuItem,
  TableCell,
  IconButton,
} from '@mui/material';
// utils
import { fDate } from '../../../../utils/formatTime';
import { fCurrency } from '../../../../utils/formatNumber';
// @types
import { IProduct } from '../../../../@types/product';
// components
import Label from '../../../../components/label';
import Iconify from '../../../../components/iconify';
import MenuPopover from '../../../../components/menu-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IProduct;
  selected: boolean;
  onViewRow: VoidFunction;
  onSelectRow: VoidFunction;
 };

export default function ProductTableRow({
  row,
  selected,
  onSelectRow,
  onViewRow,
}: Props) {
  const { _id, userId, reference, serviceType, providerResponse, recipient,customerAccountNo, providerType, status,amount, createdAt } = row;


  const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null);
  
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  return (
    <>
      <TableRow hover selected={selected}> 

        <TableCell>
          <Stack direction="row" alignItems="left" spacing={2}>
              {fDate(createdAt)} 
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="left" spacing={2}>
              {userId} 
          </Stack>
        </TableCell>

        <TableCell align="left">{reference}</TableCell>
        <TableCell align="left">{providerType}</TableCell> 
        <TableCell align="left">{recipient}</TableCell>
        <TableCell align="left">{customerAccountNo}</TableCell>
        <TableCell align="left">₦{fCurrency(amount)}</TableCell> 
        <TableCell align="left">
          <Label
            variant="soft"
            color={
              (status === 'success' && 'success') ||
              (status === 'pending' && 'warning') ||
              'error'
            }
            sx={{ textTransform: 'capitalize' }}
          >
            {status ? sentenceCase(status) : ''}
          </Label>
        </TableCell> 
      </TableRow>

       
 
    </>
  );
}
