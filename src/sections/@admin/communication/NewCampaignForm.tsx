import * as Yup from 'yup';
import { useEffect, useMemo } from 'react';
// next
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack } from '@mui/material';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';

// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// @types
import { IProduct } from '../../../@types/product';
// components
import { CustomFile } from '../../../components/upload';
import { useSnackbar } from '../../../components/snackbar';
import FormProvider, {
  RHFSelect, 
  RHFTextField, 
} from '../../../components/hook-form';

// ----------------------------------------------------------------------

const GENDER_OPTION = [
  { label: 'Men', value: 'Men' },
  { label: 'Women', value: 'Women' },
  { label: 'Kids', value: 'Kids' },
];

const CATEGORY_OPTION = [
  { group: 'Clothing', classify: ['Shirts', 'T-shirts', 'Jeans', 'Leather'] },
  { group: 'Tailored', classify: ['Suits', 'Blazers', 'Trousers', 'Waistcoats'] },
  { group: 'Accessories', classify: ['Shoes', 'Backpacks and bags', 'Bracelets', 'Face masks'] },
];
  
// ----------------------------------------------------------------------

interface FormValuesProps extends Omit<IProduct, 'images'> {
  taxes: boolean;
  inStock: boolean;
  images: (CustomFile | string)[];
}

type Props = {
  isEdit?: boolean;
  currentProduct?: IProduct;
};

export default function ProductNewEditForm({ isEdit, currentProduct }: Props) {
  const { push } = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const NewProductSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    images: Yup.array().min(1, 'Images is required'),
    tags: Yup.array().min(2, 'Must have at least 2 tags'),
    price: Yup.number().moreThan(0, 'Price should not be $0.00'),
    description: Yup.string().required('Description is required'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      images: currentProduct?.images || [],
      code: currentProduct?.code || '',
      sku: currentProduct?.sku || '',
      price: currentProduct?.price || 0,
      priceSale: currentProduct?.priceSale || 0,
      inStock: true,
      taxes: true,
      gender: currentProduct?.gender || GENDER_OPTION[2].value,
      category: currentProduct?.category || CATEGORY_OPTION[0].classify[1],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentProduct]
  );

  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(NewProductSchema),
    defaultValues,
  });

  const {
    reset, 
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  useEffect(() => {
    if (isEdit && currentProduct) {
      reset(defaultValues);
    }
    if (!isEdit) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, currentProduct]);

  const onSubmit = async (data: FormValuesProps) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      enqueueSnackbar(!isEdit ? 'Create success!' : 'Update success!');
      push(PATH_DASHBOARD.eCommerce.list);
      console.log('DATA', data);
    } catch (error) {
      console.error(error);
    }
  };
 
 
  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
           
          <Card>
          <CardHeader title="Add New Campaign" subheader="New Campaign Inputs" sx={{ mb: 3 }} />

          <Divider />

          <Stack spacing={3} sx={{ p: 3 }}>

            <RHFTextField name="fund" label="Name" />

            <RHFSelect
              native
              name="deduct"
              label="Campaign Type"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Email</option> 
                <option value="yes">SMS</option> 
              </optgroup>
            </RHFSelect>

            <RHFSelect
              native
              name="deduct"
              label="Trigger Type"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Direct</option> 
                <option value="yes">Schedule</option> 
              </optgroup>
            </RHFSelect>

            <RHFTextField name="fund" label="Business Rule" />
            
            <RHFTextField name="fund" label="Description" />

            <RHFSelect
              native
              name="deduct"
              label="Status"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Pending</option> 
                <option value="yes">Active</option> 
                <option value="yes">Inactive</option> 
              </optgroup>
            </RHFSelect>

 
          </Stack>

          <Stack spacing={3} sx={{ p: 3 }}>
          <Grid item xs={12} md={4}>
            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              Create Client
            </LoadingButton>
            </Grid> 
          </Stack>
          
        </Card>
           
        </Grid>

        

      </Grid>
    </FormProvider>
  );
}
