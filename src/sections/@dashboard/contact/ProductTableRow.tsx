/* eslint-disable react/jsx-no-useless-fragment */
// @mui
import {
  Stack,
  TableRow,
   TableCell,
 } from '@mui/material';
// utils
// @types
import { IProduct } from '../../../@types/product'; 
// ----------------------------------------------------------------------

type Props = {
  row: IProduct;
  selected: boolean;
 };

export default function ProductTableRow({
  row,
  selected,
}: Props) {
  const { _id, name, value } = row;
 

  return (
      <TableRow hover selected={selected}>
      
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
              {_id} 
          </Stack>
        </TableCell>

        <TableCell>{name}</TableCell>  
        <TableCell>{value}</TableCell>  
        <TableCell><></></TableCell>  
        
      </TableRow>
  
  );
}
