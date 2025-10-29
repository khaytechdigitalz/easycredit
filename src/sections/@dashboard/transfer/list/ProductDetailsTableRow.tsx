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
  const { amountDue, amountPaid, dueDate, status } = row; 

  return (
       
      <TableRow hover selected={selected}> 
      
        <TableCell>
          <Stack direction="row" alignItems="left" spacing={2}>
              {fDate(dueDate)} 
          </Stack>
        </TableCell>  
        <TableCell align="left">₦{fCurrency(amountDue)}</TableCell>
        <TableCell align="left">₦{fCurrency(amountPaid)}</TableCell> 
        <TableCell align="left">
          <Label
            variant="soft"
            color={
              (status === 'paid' && 'success') ||
              (status === 'pending' && 'warning') ||
              'error'
            }
            sx={{ textTransform: 'capitalize' }}
          >
            {status ? sentenceCase(status) : ''}
          </Label>
        </TableCell> 
      </TableRow>
  
  );
}
