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
// components
import Label from '../../../../components/label';

// ----------------------------------------------------------------------

type Props = {
  row: IProduct;
  selected: boolean;
  onViewRow: VoidFunction;
  onSelectRow: VoidFunction;
 };

interface IProduct {
  userId: string;
  billId: string | number; // Use the correct type for billId
  serviceType: string;
  recipient: string;
  providerType: string;
  status: string;
  amount: number;
  createdAt: string;
}

export default function ProductTableRow({
  row,
  selected,
  onSelectRow,
  onViewRow,
}: Props) {

  const {serviceType, recipient,providerType, status,amount, createdAt } = row;


    
  return (
    // FIX: Removed the unnecessary React Fragment (<> and </>)
    <TableRow hover selected={selected}> 

      <TableCell>
        <Stack direction="row" alignItems="left" spacing={2}>
            {fDate(createdAt)} 
        </Stack>
      </TableCell> 

      <TableCell align="left">{providerType}</TableCell> 
      <TableCell align="left">{serviceType}</TableCell>
      <TableCell align="left">{recipient}</TableCell>
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
  );
}