import { useState } from 'react';
import { sentenceCase } from 'change-case';
// @mui
import {
  Stack,
  TableRow,
  TableCell,
} from '@mui/material';
// utils
import { fDate } from '../../../../utils/formatTime';
import { fCurrency } from '../../../../utils/formatNumber';
// @types
import { IProduct } from '../../../../@types/product';
// components
import Label from '../../../../components/label';
 
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
  const { userId, billId,serviceType, recipient,providerType, status,amount, createdAt } = row;


  const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null);
   

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

        <TableCell align="left">{billId}</TableCell>
        <TableCell align="left">{serviceType}</TableCell>
        <TableCell align="left">{recipient}</TableCell>
        <TableCell align="left">{providerType}</TableCell> 
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
