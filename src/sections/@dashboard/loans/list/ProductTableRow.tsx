import { useState } from 'react';
import { sentenceCase } from 'change-case';
// @mui
import {
  Link,
  Stack,
  Button,
  TableRow,
  Checkbox,
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
import Image from '../../../../components/image';
import Iconify from '../../../../components/iconify';
import MenuPopover from '../../../../components/menu-popover';
import ConfirmDialog from '../../../../components/confirm-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: IProduct;
  selected: boolean;
  onEditRow: VoidFunction;
  onViewRow: VoidFunction;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction; 
};

export default function ProductTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onViewRow,
}: Props) {
  const { _id, userId, purpose,interestRate, term, status,amount, applicationDate } = row;

  const [openConfirm, setOpenConfirm] = useState(false);

  const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null);

  const handleOpenConfirm = () => {
    setOpenConfirm(true);
  };

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
              {_id} 
          </Stack>
        </TableCell>

        <TableCell align="right">{userId}</TableCell>
        <TableCell align="right">₦{fCurrency(amount)}</TableCell>
        <TableCell align="right">{term} Days</TableCell>
        <TableCell align="right">{purpose}</TableCell>
        <TableCell align="right">{interestRate}</TableCell>
        <TableCell align="center">
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
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
              {applicationDate} 
          </Stack>
        </TableCell>
 


        <TableCell align="right">
          <IconButton color={openPopover ? 'primary' : 'default'} onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <MenuPopover
        open={openPopover}
        onClose={handleClosePopover}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            handleOpenConfirm();
            handleClosePopover();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="eva:trash-2-outline" />
          Delete
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            handleClosePopover();
          }}
        >
          <Iconify icon="eva:edit-fill" />
          Edit
        </MenuItem>
      </MenuPopover>

      <ConfirmDialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
