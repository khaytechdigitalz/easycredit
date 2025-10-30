import { useState } from 'react';
// @mui
import {
  Stack,
  TableRow,
  Checkbox,
  MenuItem,
  TableCell,
  IconButton,
} from '@mui/material';
// utils
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
  const { _id, first_name, last_name, gender, email, phone, phoneVerified,nationality } = row;

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
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
              {_id} 
          </Stack>
        </TableCell>

        <TableCell align="right">{first_name}</TableCell>
        <TableCell align="right">{last_name}</TableCell>
        <TableCell align="right">{gender}</TableCell>
        <TableCell align="right">{email}</TableCell>
        <TableCell align="right">{phone}</TableCell>
        <TableCell align="right">{nationality}</TableCell>
        <TableCell align="center">
          <Label
            variant="soft"
            color={
              (phoneVerified === true && 'success') ||
              'error'
            }
            sx={{ textTransform: 'capitalize' }}
          >
            {
              (phoneVerified === true && 'Verified') ||
              'Not Verified'
            }
          </Label>
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
            onViewRow();
            handleClosePopover();
          }}
        >
          <Iconify icon="eva:eye-fill" />
          Details
        </MenuItem>
      </MenuPopover>
 
    </>
  );
}
