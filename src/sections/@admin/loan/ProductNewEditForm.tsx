import * as Yup from 'yup';
import { useCallback, useEffect, useMemo } from 'react';
// next
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, Stack, Typography, InputAdornment } from '@mui/material';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import FormControlLabel from '@mui/material/FormControlLabel';

// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// @types
import { IProduct } from '../../../@types/product';
// components
import { CustomFile } from '../../../components/upload';
import { useSnackbar } from '../../../components/snackbar';
import FormProvider, {
  RHFSwitch,
  RHFSelect,
  RHFEditor,
  RHFUpload,
  RHFTextField,
  RHFRadioGroup,
  RHFAutocomplete,
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

const TAGS_OPTION = [
  'Toy Story 3',
  'Logan',
  'Full Metal Jacket',
  'Dangal',
  'The Sting',
  '2001: A Space Odyssey',
  "Singin' in the Rain",
  'Toy Story',
  'Bicycle Thieves',
  'The Kid',
  'Inglourious Basterds',
  'Snatch',
  '3 Idiots',
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
      tags: currentProduct?.tags || [TAGS_OPTION[0]],
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
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

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

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const files = values.images || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('images', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.images]
  );

  const handleRemoveFile = (inputFile: File | string) => {
    const filtered = values.images && values.images?.filter((file) => file !== inputFile);
    setValue('images', filtered);
  };

  const handleRemoveAllFiles = () => {
    setValue('images', []);
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader
              title="Loan Properties"
              subheader="Additional functions and attributes..."
              sx={{ mb: 3 }}
            />

            <Divider />

            <Stack spacing={3} sx={{ p: 3 }}>
              <Box
                columnGap={2}
                rowGap={3}
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
              >
                <RHFTextField name="fund" label="Fund" />

                <RHFTextField name="currency" label="Currency" />

                <RHFTextField name="decimal" label="Decimal Place" />

                <RHFTextField name="default" label="Default Principal" />
                <RHFTextField name="minimum" label="Minimum Principal" />
                <RHFTextField name="maximum" label="Maximum Principal" />

                <RHFSelect
                  native
                  name="paydayloan"
                  label="Is Payday Loan"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </optgroup>
                </RHFSelect>

                <RHFTextField name="frequency" label="Repayment Frequency" />
                <RHFSelect native name="type" label="Type" InputLabelProps={{ shrink: true }}>
                  <optgroup>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </optgroup>
                </RHFSelect>

                <RHFTextField name="interestrate" label="Default Interest Rate" />
                <RHFTextField name="minimuminteres" label="Minimum Interest Rate" />
                <RHFTextField name="maximuminterest" label="Maximum Interest Rate" />

                <RHFSelect
                  native
                  name="per"
                  label="Disallow interest rate adjustment"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="days">Month</option>
                    <option value="weeks">Year</option>
                    <option value="months">Principal</option>
                  </optgroup>
                </RHFSelect>
                <RHFSelect
                  native
                  name="disallow_interest"
                  label="Disallow interest rate adjustment"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </optgroup>
                </RHFSelect>

                <RHFSelect
                  native
                  name="deduct"
                  label="Deduct interest from principal"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </optgroup>
                </RHFSelect>

                <RHFTextField name="grace_period" label="Grace On Principal Payment" />
                <RHFTextField name="grace_int" label="Grace On Interest Payment" />
                <RHFTextField name="grace_charge" label="Grace On Interest Charged" />

                <RHFSelect
                  native
                  name="deduct"
                  label="Interest Methodology"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Flat</option>
                    <option value="no">Declining Balance</option>
                  </optgroup>
                </RHFSelect>

                <RHFSelect
                  native
                  name="deduct"
                  label="Amortization Method"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Equal Installment</option>
                    <option value="no">Equal Principal Payment</option>
                  </optgroup>
                </RHFSelect>

                <RHFSelect
                  native
                  name="deduct"
                  label="Loan Transaction Processing Strategy"
                  InputLabelProps={{ shrink: true }}
                >
                  <optgroup>
                    <option value="yes">Penalties, Fee, Interest, Principal Order</option>
                    <option value="no">Principal, Interest, Penalties, Fee Order</option>
                    <option value="no">Interest, Principal, Penalties, Fee Order</option>
                  </optgroup>
                </RHFSelect>

                <RHFSelect native name="deduct" label="Charge" InputLabelProps={{ shrink: true }}>
                  <optgroup>
                    <option value="yes">None</option>
                  </optgroup>
                </RHFSelect>
              </Box>
            </Stack>
          </Card>

          <Card>
          <CardHeader title="Accounting" subheader="Accounting related inputs" sx={{ mb: 3 }} />

          <Divider />

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFSelect
              native
              name="deduct"
              label="Accounting Rule"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">None</option>
                <option value="yes">Cash</option>
              </optgroup>
            </RHFSelect>
            <RHFSelect
              native
              name="deduct"
              label="Exclude Weekends"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Yes</option>
                <option value="yes">Now</option>
              </optgroup>
            </RHFSelect>
            <RHFSelect
              native
              name="deduct"
              label="Exclude Holidays"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Yes</option>
                <option value="yes">No</option>
              </optgroup>
            </RHFSelect>
            <RHFSelect
              native
              name="deduct"
              label="User Can Register"
              InputLabelProps={{ shrink: true }}
            >
              <optgroup>
                <option value="yes">Yes</option>
                <option value="yes">No</option>
              </optgroup>
            </RHFSelect>
            <RHFSelect native name="deduct" label="Auto Disburse" InputLabelProps={{ shrink: true }}>
              <optgroup>
                <option value="yes">Yes</option>
                <option value="yes">No</option>
              </optgroup>
            </RHFSelect> 
          </Stack>

          <Stack spacing={3} sx={{ p: 3 }}>
          <Grid item xs={12} md={4}>
            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              {!isEdit ? 'Create Loan Product' : 'Save Changes'}
            </LoadingButton>
            </Grid> 
          </Stack>
          
        </Card>
           
        </Grid>

        

      </Grid>
    </FormProvider>
  );
}
