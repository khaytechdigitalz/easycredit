// @mui
import {
  Stack,
  TableRow,
  TableCell,
 } from '@mui/material'; 
// @types
// components 
// ----------------------------------------------------------------------

// 1. Define the structure for a single product item
interface ProductData {
  Id: number | string; // Assuming Id is a number or string
  ProductCode: string;
  ProductName: string;
  ProductDiscriminator: string;
  InterestRate: number; // Assuming InterestRate is a number
  Tenure: number; // Assuming Tenure is a number
}

// 2. Update the Props type to include all necessary data AND the 'selected' status
type Props = {
   selected: boolean; 
} & ProductData; // Use intersection type to combine Props with ProductData

export default function ProductTableRow({
  selected,
  // 3. Destructure all the product properties from the props object
  Id, 
  ProductCode, 
  ProductName,
  ProductDiscriminator, 
  InterestRate, 
  Tenure,
 }: Props) {
  // 4. The previous incorrect line is removed: 
  // const { Id, ProductCode, ProductName,ProductDiscriminator, InterestRate, Tenure };
 
  return (
       <TableRow hover selected={selected}> 

        <TableCell>
          <Stack direction="row" alignItems="left" spacing={2}>
              {Id} 
          </Stack>
        </TableCell> 

        <TableCell align="left">{ProductCode}</TableCell>
        <TableCell align="left">{ProductName}</TableCell>
        <TableCell align="left">{ProductDiscriminator}</TableCell>
        <TableCell align="left">{InterestRate}</TableCell>
        <TableCell align="left">{Tenure}</TableCell>
        
      </TableRow>

      
  );
}