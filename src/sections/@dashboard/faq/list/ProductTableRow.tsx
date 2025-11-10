// @mui
import {
  Stack,
  TableRow,
   TableCell,
 } from '@mui/material';
// utils
// @types
import { IProduct } from '../../../../@types/product'; 
// ----------------------------------------------------------------------

type Props = {
  row: IProduct;
  selected: boolean;
 };

export default function ProductTableRow({
  row,
  selected,
}: Props) {
  const { _id, title, content } = row;
 

  return (
      <TableRow hover selected={selected}>
      
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
              {_id} 
          </Stack>
        </TableCell>

        <TableCell>{title}</TableCell>  
        <TableCell>{content}</TableCell>  
      </TableRow>
  
  );
}
